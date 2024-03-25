# -*- coding: utf-8 -*-
""" ******************************************************************************
                        AUTOMATIC LINE SPLICING (2/19/24)

Description: Automatically splices lines in an audio file given the script. Outputs
a label txt file to be imported in Audacity and the individual files.

To-Do:
- Volume-level alignment is expensive
- Write a help section
****************************************************************************** """

import wave
import string
import json
import sys
import os
import re
import codecs
import subprocess
import numpy as np
import torch
import Word as custom_Word

from time import perf_counter
from vosk import Model, KaldiRecognizer, SetLogLevel
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from concurrent.futures import ThreadPoolExecutor
from termcolor import colored

totalMatchTime = 0
totalSearchStartEndTime = 0
totalFFMPEGTime = 0

# Soundman! I don't have a fancy NVIDIA device! 
# Uncomment this next line and let's see if it fixes it!
#torch.set_default_device(torch.device('cpu'))

def extract_character_name(filename):
    # Words to remove
    numerics = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "\\"]
    common_words = ["Case", "Episode", "Scene", "Part", "EoJ", "Elements of Justice", "Raw", "Retakes", "Lines", "Line", "Take"]
    character_last_names = ["Wright", "Justice", "Cykes", "Reed", "Pursuit", "Dash", "Belle"]
    va_names = ["Webshoter", "IMShadow007", "ThatCanadianDude"]
    
    words_to_remove = numerics + common_words + character_last_names + va_names

    # Define a regular expression pattern to match spaces, underscores, numerics, and specified words
    pattern = r'[ \-_0-9]+|' + '|'.join(re.escape(word) for word in words_to_remove)

    # Use re.sub() to replace all matches of the pattern with an empty string
    character_name = re.sub(pattern, '', filename, flags=re.IGNORECASE).replace(".flac", "").replace(".wav", "")

    return character_name

def db_to_amplitude(db):
    return 10 ** (db / 20)

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

def get_word_and_index_at_nth_char(words, n, offset=0):
    start = 0
    for i, word in enumerate(words):
        end = start + len(word.get_word())
        if n <= end:
            return words[min(i + offset, len(words) - 1)].get_word(), min(i + offset, len(words) - 1)
        start = end + 1
    return None, None

def find_similar_endword(list_of_Words, end_index, needle_last_word, searchRange, metaphone_threshold=0.75):
    # Try to find an exact match within a range
    for offset in range(-searchRange, searchRange + 1):
        oldWord, ignore = get_word_and_index_at_nth_char(list_of_Words, end_index)
        word, revised_end_index = get_word_and_index_at_nth_char(list_of_Words, end_index + offset)
        calculation = end_index + offset  # Calculate the index of the first character of the word
        if word == needle_last_word:
            if complexPrint:
                print("The exact word was found, " + word + " where the original word was " + oldWord + " " + str(end_index) + ";" + str(calculation))
            return calculation  

    # If no exact match, find a similar word using string similarity on metaphone representations
    for offset in range(-searchRange, searchRange + 1):
        oldWord, ignore = get_word_and_index_at_nth_char(list_of_Words, end_index)
        word, revised_end_index = get_word_and_index_at_nth_char(list_of_Words, end_index + offset)
        calculation = end_index + offset  # Calculate the index of the first character of the word
        if string_similarity(metaphone(word), metaphone(needle_last_word)) > metaphone_threshold:
            if complexPrint:
                print("A similar word was found, " + word + " where the original word was " + oldWord + " " + str(end_index) + ";" + str(calculation))
            return calculation  

    return end_index

def find_similar_startword(list_of_Words, start_index, needle_start_word, searchRange, metaphone_threshold=0.75):
    # Try to find an exact match within a range
    for offset in range(-searchRange, searchRange + 1):
        oldWord, ignore = get_word_and_index_at_nth_char(list_of_Words, start_index)
        word, revised_start_index = get_word_and_index_at_nth_char(list_of_Words, start_index + offset)
        calculation = start_index + offset  # Calculate the index of the first character of the word
        if word == needle_start_word:
            if complexPrint:
                print("The exact word was found, " + word + " where the original word was " + oldWord + " " + str(start_index) + ";" + str(calculation))
            return calculation  

    # If no exact match, find a similar word using string similarity on metaphone representations
    for offset in range(-searchRange, searchRange + 1):
        oldWord, ignore = get_word_and_index_at_nth_char(list_of_Words, start_index)
        word, revised_start_index = get_word_and_index_at_nth_char(list_of_Words, start_index + offset)
        calculation = start_index + offset  # Calculate the index of the first character of the word
        if string_similarity(metaphone(word), metaphone(needle_start_word)) > metaphone_threshold:
            if complexPrint:
                print("A similar word was found, " + word + " where the original word was " + oldWord + " " + str(start_index) + ";" + str(calculation))
            return calculation  

    return start_index

def find_matches(list_of_Words, needle):
    needle = remove_last_space(needle)
    matches = []
    match_indices = []
    needle_words = needle.split()

    # Iterate through the list of words one word at a time
    for i in range(len(list_of_Words) - len(needle_words) + 1):
        current_window = [word.get_word() for word in list_of_Words[i:i + len(needle_words)]]

        # Check for exact word match within the window
        if current_window == needle_words:
            start_index = i  # Store the starting index of the word match
            end_index = i + len(needle_words)
            matches.append(" ".join(word.get_word() for word in list_of_Words[start_index:end_index]))
            match_indices.append((start_index, end_index))
            continue

        # If not exact match, try fuzzy matching on the whole window
        if (
            string_similarity(
                metaphone(" ".join(current_window)), metaphone(" ".join(needle_words))
            )
            > 0.75
            and (
                bleu_4(" ".join(current_window), " ".join(needle_words)) > 0.65
            )
        ):
            start_index = i
            end_index = i + len(needle_words)

            # Refine start/end indices using find_similar_startword/find_similar_endword
            # (Assuming these functions can work with list_of_Words as well)
            start_index = find_similar_startword(list_of_Words, start_index, current_window[0], 5)
            end_index = find_similar_endword(list_of_Words, end_index, current_window[-1], 5)

            matches.append(" ".join(word.get_word() for word in list_of_Words[start_index:end_index]))
            match_indices.append((start_index, end_index))

    return matches

def add_failed_lines(all_lines, failed_lines):
    to_write = ""

    for failed_line_id, line_text in failed_lines:
        current_line_index = int(failed_line_id.split('_')[1])
        next_line = None

        for line in all_lines:
            line_id = line[2]
            index = int(line_id.split('_')[1])
            if index > current_line_index:
                if next_line is None or index < int(next_line[2].split('_')[1]):
                    next_line = line
            elif next_line is not None and index >= int(next_line[2].split('_')[1]):
                break

        if next_line is None:
            to_write += ("1" + "\t" + "2" + "\t" + "[!]" + failed_line_id + "\n")
        else:
            # Calculate start time as 5 seconds before the next intended lineID
            start_time = float(next_line[0]) - 5
            end_time = start_time + 1
            to_write += (str(start_time) + "\t" + str(end_time) + "\t" + "[!]" + failed_line_id + "\n")

    return to_write
    
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
    
def hmm_remover(line):
    pattern = re.compile(r'hm{2,4}', re.IGNORECASE)
    cleaned_line = re.sub(pattern, '', line)
    return cleaned_line

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
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
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
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    t_Downsample_Stop = perf_counter()
    totalFFMPEGTime += (t_Downsample_Stop - t_Downsample_Start)

def read_wav_file(file_path):
    with wave.open(file_path, 'rb') as wav_file:
        frames = wav_file.readframes(-1)
        sample_width = wav_file.getsampwidth()
        frame_rate = wav_file.getframerate()
        audio_data = np.frombuffer(frames, dtype=np.int16)
    return audio_data, sample_width, frame_rate

def get_volume_at_time(audio_data, frame_rate, time):
    sample_index = int(time * frame_rate)   
    # Get the absolute value of the audio sample
    sample_value = np.abs(audio_data[sample_index])
    
    # Normalize the value to the range [0, 1]
    max_value = np.abs(audio_data).max()
    normalized_volume = sample_value / max_value if max_value != 0 else 0
    
    return normalized_volume

def search_for_threshold_single(audio_data, frame_rate, time, threshold, max_search_time, direction='backwards'):
    search_direction = 1 if direction == 'forwards' else -1
    current_time = time
    current_volume = get_volume_at_time(audio_data, frame_rate, current_time)

    while current_volume >= threshold and abs(time - current_time) <= max_search_time:
        current_time += search_direction * 0.01
        current_volume = get_volume_at_time(audio_data, frame_rate, current_time)
    
    if current_volume < threshold:
        return True, current_time
    else:
        return False, None

def search_for_threshold(audio_data, frame_rate, start_time, end_time, threshold, max_search_time):
    start_found, start_match_time = search_for_threshold_single(audio_data, frame_rate, start_time, threshold, max_search_time, direction='backwards')
    end_found, end_match_time = search_for_threshold_single(audio_data, frame_rate, end_time, threshold, max_search_time, direction='forwards')
    
    if start_found and end_found:
        return True, start_match_time, end_match_time
    else:
        return False, None, None

# INPUT
if not len(sys.argv) > 1:
    print("Require path to operating folder.")
    exit()

complexPrint = False
simplePrint = False
doVolumeAlign = False
    
if len(sys.argv) > 3:
    if sys.argv[3] == "--complexPrint":
        complexPrint = True
        simplePrint = True
    elif sys.argv[3] == "--simplePrint":
        simplePrint = True
    elif sys.argv[3] == "--volumeAlign":
        doVolumeAlign = True

if len(sys.argv) > 4:
    if sys.argv[4] == "--volumeAlign":
        doVolumeAlign = True

def autoAlignAudio(jsonFile, audioFile):
    totalChars, idx, characterCount = 0, 0, 0
    failedLines, allLines, toWrite, charIndexToWordIndex = [], [], [], {}
    haystack = ""
    fullLine = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
    translation_table = str.maketrans("", "", string.punctuation.replace("'", ""))
    totalMatchTime = 0
    totalSearchStartEndTime = 0
    totalFFMPEGTime = 0

    file_path = jsonFile
    jsonData = "empty"
    with open(file_path, 'r', encoding='utf-8') as file:
        jsonData = json.load(file)

    # SPEECH TO TEXT
    model_path = "models/vosk-model-small-en-us-0.15"
    audio_path = os.path.join(os.path.dirname(__file__), audioFile)
    audio_truncate_path = os.path.join(os.path.dirname(audio_path), os.path.basename(audio_path) + "_truncated.wav")
    audio_downsample_path = os.path.join(os.path.dirname(audio_path), os.path.basename(audio_path) + "_downsample.wav")
    activeChar = extract_character_name(audioFile)

    print("I think the active character is " + activeChar)

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
    t_Meta_stop = 0

    # ONE-TO-MANY FAKED FORCED ALIGNMENT
    # Iterate over each dialogue entry in the "Dialogue" dictionary
    if "Dialogue" in jsonData:
        dialogues = jsonData["Dialogue"]
        for dialogue_id, dialogue in dialogues.items():
            # Extract the "LineText" property from each dialogue
            if "LineText" in dialogue:
                lineID = dialogue_id
                needle = dialogue["LineText"]
                characterName = dialogue["CharacterName"]

                # Don't process this shit, idiot
                if characterName != activeChar: continue

                # Break if it's an empty string like "?!" "!!" "..."
                if not any(c.isalpha() for c in needle):
                    continue

                # Remove stage instructions, stuttering, punctuation and leading spaces.
                needle = re.sub(r'\[.*?\]', '', needle)
                needle = remove_stuttering(remove_stuttering(needle)).replace("-", " ").replace("—", " ").replace("“", "").replace("”", "").replace("’", "'")
                needle = hmm_remover(needle)
                needle = needle.lower().translate(translation_table)
                needle = remove_leading_space(needle)

                if simplePrint:
                    print(colored(fullLine, 'grey', attrs=['bold']))
                    print(colored('Current Needle:\t', 'yellow') + needle + " " + "'" + needle + "'")

                # Retrieve matches or else report zero matches.
                t_Match_start = perf_counter()
                matches = find_matches(list_of_Words, needle)
                t_Match_stop = perf_counter()
                totalMatchTime += (t_Match_stop - t_Match_start)

                if len(matches) > 0:
                    for i in matches:
                        locateMatch = haystack.find(i)

                        if simplePrint:
                            print(colored('Haystack Match: ', 'green') + i)

                        if locateMatch in charIndexToWordIndex:
                            start_word_index = charIndexToWordIndex[locateMatch]
                            end_word_index = start_word_index + len(i.split()) - 1

                            start_time = round(list_of_Words[start_word_index].get_start(), 3)
                            end_time = round(list_of_Words[end_word_index].get_end(), 3)

                            startingWord = list_of_Words[start_word_index].word
                            endingWord = list_of_Words[end_word_index].word

                            startCompColor = 'green'
                            endCompColor = "green"

                            if startingWord != needle.split()[0]:
                                startCompColor = "red"
                            if endingWord != needle.split()[-1]:
                                endCompColor = "red"

                            if complexPrint:
                                print("Start;End Word Indices" + str(start_word_index) + ";" + str(end_word_index))
                                print(colored("The starting word being '" + str(list_of_Words[start_word_index].word) + "' when it should be " + str(needle.split()[0]), startCompColor, attrs=['bold']))
                                print(colored("The ending word being '" + str(list_of_Words[end_word_index].word) + "' when it should be " + str(needle.split()[-1]), endCompColor, attrs=['bold']))
                                print("Start;End Times " + str(start_time) + ";"+ str(end_time))

                            # RATE IT RALPH (I'M GONNA RATE IT!)
                            points = 0

                            first_word_needle = needle.split()[0]
                            last_word_needle = needle.split()[-1]

                            first_word_needle = first_word_needle.translate(translation_table).lower()
                            last_word_needle = last_word_needle.translate(translation_table).lower()

                            first_word_transcription = startingWord.translate(translation_table).lower()
                            last_word_transcription = endingWord.translate(translation_table).lower()

                            #print(first_word_needle + " ... " + first_word_needle + " " + str(first_word_needle == first_word_transcription))
                            #print(last_word_needle + " ... " + last_word_transcription  + " " + str(last_word_needle == last_word_transcription))

                            # Check if first word matches
                            if first_word_needle == first_word_transcription:
                                points += 2

                            # Check if last word matches
                            if last_word_needle == last_word_transcription:
                                points += 2

                            # Calculate points based on duration and number of words in the needle
                            duration = float(end_time) - float(start_time)
                            points += ((duration / len(needle[0].split())) * 1)

                            # Calculate Bleu-4 similarity score
                            bleu_score = bleu_4(needle[0], i)
                            points += (bleu_score * 1)

                            # Assign the points to the line in allLines
                            points = round(points, 10)

                            allLines.append([str(round(start_time - 0.05, 2)), str(round(end_time + 0.05, 2)), lineID, i, points])

                            if simplePrint:
                                print(colored('! Match Successful !', 'green', attrs=['bold']))
                        else:
                            failedLines.append([lineID, needle])
                            if simplePrint:
                                print(colored('X Unique Match Failed X', 'red', attrs=['bold']))
                else:
                    if simplePrint:
                        print(colored('X No Matches X', 'red', attrs=['bold']))
                    failedLines.append([lineID, needle])
                    t_Meta_stop = perf_counter()

    if simplePrint:
        print(colored(fullLine, 'grey', attrs=['bold']))

    try:
        dest_file = codecs.open(audioFile.replace(".wav", "_autoLabel.txt"), "w", "utf-8")

    except:
        print("Invalid destination file, abort.")
        exit()

    # Remove excessively long takes.
    pruned_allLines = []
    for line in allLines:
        start_time, end_time, label, transcription, points = line
        duration = float(end_time) - float(start_time)
        if duration <= 30:
            pruned_allLines.append(line)
    allLines = pruned_allLines

    # Make matches unique— prevent multiples of the same match with same start/end time. 
    # This may make a good confidence system eventually, seeing how many times the same section matched.
    allLines = [list(x) for x in set(tuple(x) for x in allLines)]
    allLines = remove_nested_arrays(allLines)
    allLines.sort(key=lambda x: float(x[0]))

    # Minimize right-overhang matching.
    i = 0
    while i < len(allLines) - 1:
        j = i + 1
        while j < len(allLines):
            if float(allLines[i][1]) > float(allLines[j][0]) and float(allLines[i][0]) < float(allLines[j][1]):
                allLines[i][1] = allLines[j][0]
                break
            j += 1
        i += 1

    # Volume-level alignment
    if doVolumeAlign:
        audio_data, sample_width, frame_rate = read_wav_file(audio_truncate_path)

        for line in allLines:
            start_time = float(line[0])
            end_time = float(line[1])
            lineID = line[2]
            
            found, start_match_time, end_match_time = search_for_threshold(audio_data, frame_rate, start_time, end_time, db_to_amplitude(-45), 8)
            if found:
                line[0] = str(start_match_time)
                line[1] = str(end_match_time)
                if complexPrint:
                    print("Volume aligned line " + lineID)

    # Correct accuracy calculator
    missing_lines = len(failedLines)
    total_active_char_lines = 0
    if "Dialogue" in jsonData:
        dialogues = jsonData["Dialogue"]
        for dialogue_id, dialogue in dialogues.items():
            if "LineText" in dialogue:
                characterName = dialogue["CharacterName"]
                if characterName != activeChar: continue
                total_active_char_lines += 1

    missing_lines_percentage = (missing_lines / total_active_char_lines) * 100 if total_active_char_lines > 0 else 0

    print(activeChar.upper())
    print()
    print(colored("Accuracy is " + str(round((100 - missing_lines_percentage), 2)) + "%", "white", attrs=['bold']))
    print()

    # Dictionary to store the highest scoring line for each lineID
    highest_scores = {}

    # Find the highest scoring line for each lineID
    for line in allLines:
        lineID = line[2]
        score = line[4]

        if lineID in highest_scores:
            if score > highest_scores[lineID][1]:
                highest_scores[lineID] = (line, score)
        else:
            highest_scores[lineID] = (line, score)

    # Update lineIDs and remove transcription and score for non-highest scoring lines
    for line in allLines[:]:
        lineID = line[2]
        if line is not highest_scores[lineID][0]:
            line[2] += "_alt"
            line.pop()  # Remove transcription
            line.pop()  # Remove score

    # This is some code to mass export takes straight from the script. I'm keeping it because it's cool,
    # but I've realized we need a human breakpoint to review before exporting, so this sucks.
            
    # for line in allLines:
    #     # Check if lineID contains "_alt"
    #     start_time = line[0]
    #     end_time = line[1]
    #     lineID = line[2]
    #     if "_alt" not in lineID:
    #         input_file = audio_truncate_path
    #         output_file = f"{lineID}.flac"
    #         ffmpeg_command = f'ffmpeg -i "{input_file}" -ss {start_time} -to {end_time} -y -c:a flac "{output_file}"'
    #         subprocess.run(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)

    # Writing to Destination File
    for i in range(len(allLines)):
        toWrite += (allLines[i][0] + "\t" + allLines[i][1] + "\t" + allLines[i][2] + "\n")

    # Failed Lines
    addendum = add_failed_lines(allLines, failedLines)
    for x, n in enumerate(failedLines):
        print(colored("Failed Line: \t", 'red') + failedLines[x][0] + "\t" + failedLines[x][1])

    for x in toWrite:
        dest_file.write(x)
    dest_file.write(addendum)
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
            str(round(totalMatchTime, 3)) + " seconds.")

    print("\tMetaphone Seeking took: \t",
            str(round(totalSearchStartEndTime, 3)) + " seconds.")

    print("\tFFMPEG took: \t\t\t",
            str(round(totalFFMPEGTime, 3)) + " seconds.")

    print()
    print(colored(fullLine, 'grey', attrs=['bold']))
    print()

    os.remove(audio_downsample_path)

# Scene-level auto splicing.
folder_path = sys.argv[1]

# Initialize variables to store paths
json_path = None
audio_paths = []

# Iterate over all files in the folder
for file_name in os.listdir(folder_path):
    file_path = os.path.join(folder_path, file_name)
    if file_name.endswith('.json') and os.path.isfile(file_path):
        json_path = file_path
    elif file_name.endswith(('.flac', '.wav', '.mp3')) and os.path.isfile(file_path) and "downsample" not in file_name and "truncated" not in file_name:
        audio_paths.append(file_path)

# Check if at least one JSON file and one audio file were found
if json_path is None or len(audio_paths) == 0:
    raise ValueError("Error: At least one JSON file and one audio file (flac, wav, or mp3) are required.")

# Print the paths and/or perform further actions
print("JSON file path:", json_path)
print("Audio file paths:", audio_paths)

# Use ThreadPoolExecutor to run autoAlignAudio in parallel
with ThreadPoolExecutor() as executor:
    futures = [executor.submit(autoAlignAudio, json_path, audio_path) for audio_path in audio_paths]

    for future in futures:
        try:
            future.result()
        except Exception as e:
            print(f"An error occurred: {e}")