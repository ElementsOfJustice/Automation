# -*- coding: utf-8 -*-
""" ******************************************************************************
                        AUTOMATIC LINE SPLICING (2/19/24)

Description: Automatically splices lines in an audio file given the script. Outputs
to a label txt file to be imported in Audacity.

Issues:
- 

To-Do:
- Refactor to have support with new sceneData format!
- Automatically apply truncate silence(?), level speech
- ffmpeg to make 8kHz mono copy for VOSK
- Pick good takes via picking algorithm. If a word appears more time in transcription than it should, decrease favorability.
- Remove out-of-order labels.
- Optimize alignment to work on word level instead of character level

****************************************************************************** """

import wave
import string
import json
import sys
import os
import re
import codecs
import subprocess

from time import perf_counter
from vosk import Model, KaldiRecognizer, SetLogLevel
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

from termcolor import colored
import Word as custom_Word

totalMatchTime = 0
totalSearchStartEndTime = 0
totalFFMPEGTime = 0
needles, failedLines, allLines, toWrite, charIndexToWordIndex = [], [], [], [], {}
totalChars, idx, characterCount = 0, 0, 0
haystack = ""
fullLine = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
translation_table = str.maketrans("", "", string.punctuation.replace("'", ""))

def metaphone(word):
    word = word.upper()
    first_letter = word[0]
    word = re.sub(r'[^A-Z]', '', word)
    
    # Rules for converting letters to digits
    conversion_rules = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    }

    # Apply conversion rules
    metaphone_code = first_letter
    for char in word[1:]:
        metaphone_code += conversion_rules.get(char, '')

    # Remove duplicate digits
    deduplicated_code = ''
    for i in range(len(metaphone_code)):
        if i == 0 or metaphone_code[i] != metaphone_code[i - 1]:
            deduplicated_code += metaphone_code[i]

    # Remove zeros and limit to 4 characters
    metaphone_code = deduplicated_code.replace('0', '')[:4].ljust(4, '0')

    return metaphone_code

def levenshtein_distance(s1, s2):
    m = len(s1)
    n = len(s2)
    d = [[0 for x in range(n+1)] for x in range(m+1)]

    for i in range(m+1):
        for j in range(n+1):
            if i == 0:
                d[i][j] = j
            elif j == 0:
                d[i][j] = i
            elif s1[i-1] == s2[j-1]:
                d[i][j] = d[i-1][j-1]
            else:
                d[i][j] = 1 + min(d[i-1][j], d[i][j-1], d[i-1][j-1])

    return d[m][n]

def string_similarity(s1, s2):
    return 1 - (levenshtein_distance(s1, s2) / max(len(s1), len(s2)))

def bleu_4(reference, candidate):
    smoothie = SmoothingFunction().method4
    weights = (0.25, 0.25, 0.25, 0.25) #4-gram order!
    return sentence_bleu([reference], candidate, weights, smoothing_function=smoothie)

def get_word_at_nth_char(string, n, offset=0):
    words = string.split()
    start = 0
    for i, word in enumerate(words):
        end = start + len(word)
        if n <= end:
            return words[min(i + offset, len(words) - 1)]
        start = end + 1
    return None

def find_similar_endword(haystack, end_index, needle_last_word, searchRange, metaphone_threshold=0.75):
    # Try to find an exact match within a range
    for offset in range(-searchRange, searchRange + 1):
        word = get_word_at_nth_char(haystack, end_index + offset)
        if word == needle_last_word:
            calculation = end_index + offset  # Calculate the index of the first character of the word
            if complexPrint:
                print("The exact word was found, " + get_word_at_nth_char(haystack, calculation) + " where the original word was " + get_word_at_nth_char(haystack, end_index) + " " + str(end_index) + ";" + str(calculation))
            return calculation  

    # If no exact match, find a similar word using string similarity on metaphone representations
    for offset in range(-searchRange, searchRange + 1):
        word = get_word_at_nth_char(haystack, end_index + offset)
        if string_similarity(metaphone(word), metaphone(needle_last_word)) > metaphone_threshold:
            calculation = end_index + offset  # Calculate the index of the first character of the word
            if complexPrint:
                print("A similar word was found, " + get_word_at_nth_char(haystack, calculation) + " where the original word was " + get_word_at_nth_char(haystack, end_index) + " " + str(end_index) + ";" + str(calculation))
            return calculation  

    return end_index

def find_similar_startword(haystack, start_index, needle_start_word, searchRange, metaphone_threshold=0.75):
    # Try to find an exact match within a range
    for offset in range(-searchRange, searchRange + 1):
        word = get_word_at_nth_char(haystack, start_index + offset)
        if word == needle_start_word:
            calculation = start_index + offset  # Calculate the index of the first character of the word
            if complexPrint:
                print("The exact word was found, " + get_word_at_nth_char(haystack, calculation) + " where the original word was " + get_word_at_nth_char(haystack, start_index) + " " + str(start_index) + ";" + str(calculation))
            return calculation  

    # If no exact match, find a similar word using string similarity on metaphone representations
    for offset in range(-searchRange, searchRange + 1):
        word = get_word_at_nth_char(haystack, start_index + offset)
        if string_similarity(metaphone(word), metaphone(needle_start_word)) > metaphone_threshold:
            calculation = start_index + offset  # Calculate the index of the first character of the word
            if complexPrint:
                print("A similar word was found, " + get_word_at_nth_char(haystack, calculation) + " where the original word was " + get_word_at_nth_char(haystack, start_index) + " " + str(start_index) + ";" + str(calculation))
            return calculation  

    return start_index
    
def find_matches(haystack, needle):
    global totalSearchStartEndTime
    needle = remove_last_space(needle)
    matches = []
    match_indices = []
    needle_words = needle.split()
    max_attempts = min(5, len(needle_words))
    
    # Current stable tolerances for Metaphone is 0.75, Bleu-4 is 0.65
    for attempt in range(max_attempts):
        for i in range(len(haystack) - len(needle_words[attempt]) + 1):
            current_needle = " ".join(needle_words[attempt:])
            if (string_similarity(metaphone(haystack[i:i+len(current_needle)]), metaphone(current_needle)) > 0.75 and
                (haystack[i:i+len(current_needle)] == current_needle or bleu_4(haystack[i:i+len(current_needle)], current_needle) > 0.65)):

                end_index = i + len(current_needle) # - 1
                start_index = i + attempt

                # Increase end_index until we reach a space, then go back one character.
                # Then go back by the length of the word at that index.
                while end_index < len(haystack) and haystack[end_index] != ' ':
                    end_index += 1
                if end_index >= len(haystack) or haystack[end_index-1] != ' ':
                    while end_index < len(haystack) and haystack[end_index] != ' ':
                        end_index += 1
                    end_index -= 1
                end_index - len(get_word_at_nth_char(haystack, end_index))
                end_index+=1

                # Decrease start_index until we reach a space, then go forwards one character.
                while start_index > len(haystack) and haystack[start_index] != ' ':
                    start_index -= 1
                if start_index <= len(haystack) or haystack[start_index-1] != ' ':
                    while start_index < len(haystack) and haystack[start_index] != ' ':
                        start_index -= 1
                    start_index += 1

                needle_last_word = needle_words[-1]
                needle_first_word = needle_words[0]

                match_start_word = get_word_at_nth_char(haystack, i + attempt).translate(str.maketrans('', '', string.punctuation))
                match_last_word = get_word_at_nth_char(haystack, end_index).translate(str.maketrans('', '', string.punctuation))

                if complexPrint:
                    print(colored("Preprocessed String: " + haystack[start_index : end_index], 'grey', attrs=['bold']))

                if (match_last_word != needle_last_word):
                    # If the last matching word is not the needle's last word, search for surrounding exact matches, then surrounding similar sounding matches.
                    if complexPrint:
                        print(colored("Last Word Mismatch!", 'red', attrs=['bold']))
                    t_Search_Start = perf_counter()
                    end_index = find_similar_endword(haystack, end_index, needle_last_word, 25)
                    t_Search_Stop = perf_counter()
                    totalSearchStartEndTime += (t_Search_Stop - t_Search_Start)

                if (match_start_word != needle_first_word):
                    # Handle Start Word mismatch
                    if complexPrint:
                        print(colored("First Word Mismatch!", 'red', attrs=['bold']))
                    t_Search_Start = perf_counter()
                    start_index = find_similar_startword(haystack, start_index, needle_first_word, 25)
                    t_Search_Stop = perf_counter()
                    totalSearchStartEndTime += (t_Search_Stop - t_Search_Start)

                if not (match_start_word != needle_first_word) and not (match_last_word != needle_last_word):
                    # Perfect!
                    if complexPrint:
                        print(colored("I just met my perfect match!", 'green', attrs=['bold']))

                # Increase end_index until we reach a space, then go back one character.
                # Then go back by the length of the word at that index.
                while end_index < len(haystack) and haystack[end_index] != ' ':
                    end_index += 1
                if end_index >= len(haystack) or haystack[end_index-1] != ' ':
                    while end_index < len(haystack) and haystack[end_index] != ' ':
                        end_index += 1
                    end_index -= 1
                end_index - len(get_word_at_nth_char(haystack, end_index))
                end_index+=1

                # Decrease start_index until we reach a space, then go forwards one character.
                while start_index > len(haystack) and haystack[start_index] != ' ':
                    start_index -= 1
                if start_index <= len(haystack) or haystack[start_index-1] != ' ':
                    while start_index < len(haystack) and haystack[start_index] != ' ':
                        start_index -= 1
                    start_index += 1

                if complexPrint:
                    print(colored("Processed String: " + haystack[start_index : end_index], 'grey', attrs=['bold']))
                    print(str(start_index) + " " + str(end_index))
                    
                matches.append(haystack[start_index:(end_index)]) # The only time we ever add one to end_index

    return matches

def remove_stuttering(text):
    return re.sub(r"(\w+)-\1+", r"\1", re.sub(r"(\b\w+)\s+\1+", r"\1", text), flags=re.IGNORECASE)

def remove_leading_space(line):
    while line and line[0] == ' ':
        line = line[1:]
    return line

def remove_last_space(string):
    if string[-1] == ' ':
        return string[:-1]
    else:
        return string

def remove_nested_arrays(allLines):
    filtered_arrays = []
    for i in range(len(allLines)):
        is_nested = False
        for j in range(len(allLines)):
            if i != j:
                if float(allLines[j][0]) <= float(allLines[i][0]) and float(allLines[i][1]) <= float(allLines[j][1]):
                    is_nested = True
                    break
        if not is_nested:
            filtered_arrays.append(allLines[i])
    return filtered_arrays

def truncate_silence(input_file, output_file):
    global totalFFMPEGTime
    t_Truncate_Start = perf_counter()            
    # Command to truncate silence and overwrite the input file
    command = [
        'ffmpeg',
        '-i', input_file,
        '-af', 'silenceremove=1:0:-50dB:stop_duration=1',
        '-c:a', 'pcm_s16le',  # Audio codec for encoding
        '-y',  # Overwrite without asking
        output_file  # Output to the new file
    ]
    subprocess.run(command)
    t_Truncate_Stop = perf_counter()
    totalFFMPEGTime += (t_Truncate_Stop - t_Truncate_Start)

def downsample_to_vosk_quick_format(input_file, output_file):
    global totalFFMPEGTime
    t_Downsample_Start = perf_counter()   
    # Command to convert the file to WAV, downsample, and force mono
    command = [
        'ffmpeg',
        '-i', input_file,
        '-af', 'aresample=16000:resampler=soxr:precision=24,pan=mono|c0=c0',
        '-c:a', 'pcm_s16le',
        '-y',  # Overwrite without asking
        output_file
    ]
    # Run the command
    subprocess.run(command)
    t_Downsample_Stop = perf_counter()
    totalFFMPEGTime += (t_Downsample_Stop - t_Downsample_Start)

# INPUT
if not len(sys.argv) > 1:
    print("Required arguments are sceneData.txt and audioFile.wav")
    exit()

try:
    file = open(sys.argv[1], "r")
except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()

try:
    os.path.exists(sys.argv[2])
except:
    print("File does not exist: " + str(sys.argv[2]) + ".")
    exit()

with open(sys.argv[1], "r", encoding="utf-8") as file:
    for line in file:
        if line.startswith("['dialogue',"):
            reconArr = re.findall(r"'([^']*)'", line)
            needles.append(reconArr)

complexPrint = False
simplePrint = False
    
if sys.argv[3] == "--complexPrint":
    complexPrint = True
    simplePrint = True
if sys.argv[3] == "--simplePrint":
    simplePrint = True

# Need better handling to extract character and scene.
if complexPrint:
    print(" ")
    print("I think the active character is " + sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1])
    print(" ")

# SPEECH TO TEXT
model_path = "models/vosk-model-small-en-us-0.15"
#model_path = "models/vosk-model-en-us-0.22"
audio_path = os.path.join(os.path.dirname(__file__), sys.argv[2])
audio_truncate_path = os.path.join(os.path.dirname(audio_path), os.path.basename(audio_path) + "_truncated.wav")
audio_downsample_path = os.path.join(os.path.dirname(audio_path), os.path.basename(audio_path) + "_downsample.wav")
activeChar = sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1]

# Downsample & Truncate
truncate_silence(audio_path, audio_truncate_path)
downsample_to_vosk_quick_format(audio_truncate_path, audio_downsample_path)

t_Vosk_start = perf_counter()
model = Model(model_path)
wf = wave.open(audio_downsample_path, "rb")
rec = KaldiRecognizer(model, wf.getframerate())
rec.SetWords(True)

# VOSK BOILERPLATE
results = []
while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        part_result = json.loads(rec.Result())
        results.append(part_result)
part_result = json.loads(rec.FinalResult())
results.append(part_result)

list_of_Words = []
for sentence in results:
    if len(sentence) == 1:
        continue
    for obj in sentence['result']:
        w = custom_Word.Word(obj)
        list_of_Words.append(w)

for word in list_of_Words:
    charIndexToWordIndex[totalChars] = idx
    totalChars += len(str(word.get_word())) + 1 # space xD
    idx = idx + 1
    haystack = haystack + str(word.get_word()) + " "

print()
wf.close() 

if complexPrint:
    print(colored(fullLine, 'grey', attrs=['bold']))
    print("HAYSTACK")
    print(colored(fullLine, 'grey', attrs=['bold']))
    print(colored(haystack, "blue"))
    print(colored(fullLine, 'grey', attrs=['bold']))

t_Vosk_stop = perf_counter()
t_Meta_start = perf_counter()

# ONE-TO-MANY FAKED FORCED ALIGNMENT
for x, n in enumerate(needles):

    if needles[x][2] == activeChar:

        characterCount += 1
        lineID = needles[x][1]
        needle = needles[x][3]

        # Break if it's an empty string like "?!" "!!" "..."
        if not any(c.isalpha() for c in needle):
            continue

        # Remove stage instructions, stuttering, punctuation and leading spaces.
        needle = re.sub(r'\[.*?\]', '', needle)
        needle = remove_stuttering(remove_stuttering(needle)).replace("-", " ").replace("“", "").replace("”", "").replace("’", "'")
        needle = needle.lower().translate(translation_table)
        needle = remove_leading_space(needle)

        if simplePrint:
            print(colored(fullLine, 'grey', attrs=['bold']))
            print(colored('Current Needle:\t', 'yellow') + needles[x][1] + " " + "'" + needle + "'")

        # Retrieve matches or else report zero matches.
        t_Match_start = perf_counter()
        matches = find_matches(haystack, needle)
        t_Match_stop = perf_counter()
        totalMatchTime += (t_Match_stop - t_Match_start)

        if len(matches) > 0:
            for i in matches:
                locateMatch = haystack.find(i)

                if simplePrint:
                    print(colored('Haystack Match: ', 'green') + i)

                if locateMatch in charIndexToWordIndex:
                    lineSize = len(needle.split())

                    start_word_index = charIndexToWordIndex[locateMatch]
                    end_word_index = start_word_index + lineSize

                    start_time = round(list_of_Words[start_word_index].get_start(), 3)
                    end_time = round(list_of_Words[end_word_index].get_end(), 3)

                    print("I am getting a match, with start_word_index " + str(start_word_index))
                    print("And end_word_index " + str(end_word_index))
                    print("The starting word being " + str(list_of_Words[start_word_index].word) + " when it should be " + str(needle.split()[0]))
                    print("The ending word being " + str(list_of_Words[end_word_index].word) + " when it should be " + str(needle.split()[-1]))
                    print("Start time is " + str(start_time))
                    print("End time is " + str(end_time))

                    allLines.append([str(start_time), str(end_time), lineID])

                    if simplePrint:
                        print(colored('! Match Successful !', 'green', attrs=['bold']))
                else:
                    failedLines.append([needles[x][1], needle])
                    if simplePrint:
                        print(colored('X Unique Match Failed X', 'red', attrs=['bold']))

        else:
            if simplePrint:
                print(colored('X No Matches X', 'red', attrs=['bold']))

            failedLines.append([needles[x][1], needle])

        t_Meta_stop = perf_counter()

if simplePrint:
    print(colored(fullLine, 'grey', attrs=['bold']))

try:
    dest_file = codecs.open(sys.argv[1].replace(".txt", "_autoLabel.txt"), "w", "utf-8")

except:
    print("Invalid destination file, abort.")
    exit()

# Make matches unique— prevent multiples of the same match with same start/end time. 
# This may make a good confidence system eventually, seeing how many times the same section matched.
""" allLines = [list(x) for x in set(tuple(x) for x in allLines)]
allLines = remove_nested_arrays(allLines)
allLines.sort(key=lambda x: float(x[0])) """

#Merge labels
""" i = 0
while i < len(allLines) - 1:
    j = i + 1
    while j < len(allLines):
        if float(allLines[i][1]) > float(allLines[j][0]) and float(allLines[i][0]) < float(allLines[j][1]):
            middle_point = (float(allLines[i][1]) + float(allLines[j][0])) / 2
            allLines[i][1] = str(round(middle_point, 3))
            allLines[j][0] = str(round(middle_point, 3))
            break
        j += 1
    i += 1 """

#Prune False Positives
""" label_counts = {}
for line in allLines:
    label = line[2]
    if label in label_counts:
        label_counts[label] += 1
    else:
        label_counts[label] = 1

for label, count in label_counts.items():
    if count >= 6: #Maximum number of takes a VA could plausibly do
        allLines = [line for line in allLines if line[2] != label] """

# Create a set of all unique identifiers in allLines
""" allLinesIds = set([line[2] for line in allLines]) """

# Iterate over needles and check if the identifier is in the set of allLinesIds
""" for needle in needles:
    if needles[2] == activeChar:
        if needle[1] not in allLinesIds:    
            failedLines.append([needle[1], needle[3]]) """

#Failed Lines Prune Duplicates
""" failedLines = list(set(tuple(i) for i in failedLines))
failedLines = [list(i) for i in failedLines]
failedLines = sorted(failedLines, key=lambda x: int(x[0].split("_")[1])) """

print(colored("Accuracy is %" + str(round((((characterCount-len(failedLines))/characterCount) * 100), 2)), "white", attrs=['bold']))
print()

#Print
for i in range(len(allLines)):
    toWrite += (allLines[i][0] + "\t" + allLines[i][1] + "\t" + allLines[i][2] + "\n")

#Failed Lines
for x, n in enumerate(failedLines):
    toWrite.append(str("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1] + "\n"))
    print(colored("Failed Line: \t", 'red') + failedLines[x][0] + "\t" + failedLines[x][1])

for x in toWrite:
    dest_file.write(x)
dest_file.close()

# Diagnostics
print()
print(colored("Finished!", 'green', attrs=['bold']))
print()

print("\tVOSK Transcription took: \t",
      str(round(t_Vosk_stop-t_Vosk_start, 3)) + " seconds.")

print("\tMetaphone Alignment took: \t",
      str(round(t_Meta_stop-t_Meta_start, 3)) + " seconds.")

print("\tMetaphone Matching took: \t",
        str(round(totalMatchTime, 3)) + " seconds")

print("\tMetaphone Seeking took: \t",
        str(round(totalSearchStartEndTime, 3)) + " seconds")

print("\tFFMPEG took: \t\t",
        str(round(totalFFMPEGTime, 3)) + " seconds")

print()
print(colored(fullLine, 'grey', attrs=['bold']))
print()

os.remove(audio_downsample_path)