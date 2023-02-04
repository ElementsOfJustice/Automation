# -*- coding: utf-8 -*-
""" ******************************************************************************
                        AUTOMATIC LINE SPLICING (1/26/23)

Description: Automatically splices lines in an audio file given the script. Outputs
to a label txt file to be imported in Audacity.

Issues:
- 

To-Do:
- Make it actually work

****************************************************************************** """

import wave
import string
import json
import sys
import os
import re
import codecs
import jellyfish

from time import perf_counter
from vosk import Model, KaldiRecognizer, SetLogLevel
from nltk.translate.bleu_score import sentence_bleu

import Word as custom_Word

def soundex(word):
    word = word.upper()
    first_letter = word[0]
    word = re.sub(r'[aeiouyh]', '', word)
    word = re.sub(r'[bfpv]', '1', word)
    word = re.sub(r'[cgjkqsxz]', '2', word)
    word = re.sub(r'[dt]', '3', word)
    word = re.sub(r'[l]', '4', word)
    word = re.sub(r'[mn]', '5', word)
    word = re.sub(r'[r]', '6', word)
    word = first_letter + re.sub(r'[aeiouyh]', '', word)
    word = word[:4].ljust(4, '0')
    return word

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

def jaro_winkler(s1, s2):
    return jellyfish.jaro_winkler(s1, s2)

def bleu_4(reference, candidate):
    weights = (0.25, 0.25, 0.25, 0.25)
    return sentence_bleu([reference], candidate, weights)

def find_matches(haystack, needle):
    matches = []
    match_indices = []
    for i in range(len(haystack) - len(needle) + 1):
        if string_similarity(soundex(haystack[i:i+len(needle)]), soundex(needle)) > 0.9:
            if haystack[i:i+len(needle)] == needle or bleu_4(haystack[i:i+len(needle)], needle) > 0.75:
                start_index = i
                end_index = i + len(needle) - 1
                if not match_indices or start_index > match_indices[-1][1]:
                    match_indices.append((start_index, end_index))
                    matches.append(haystack[i:i+len(needle)])
    return matches

def remove_stuttering(text):
    return re.sub(r"(\w+)-\1+", r"\1", re.sub(r"(\b\w+)\s+\1+", r"\1", text), flags=re.IGNORECASE)

def remove_leading_space(line):
    while line and line[0] == ' ':
        line = line[1:]
    return line

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

# VARIABLES
needles = []
charIndexToWordIndex = {}
totalChars = 0
idx = 0
haystack = ""
fullLine = "________________________________________________________________________________________________________________________________________________________"

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

with open(sys.argv[1], "r", encoding="utf-8") as file: #cp1252 #utf-8 #unicode_escape
    for line in file:
        if line.startswith("['dialogue',"):
            reconArr = re.findall(r"'([^']*)'", line)
            needles.append(reconArr)

try:
    if sys.argv[3] == "--complexPrint":
        complexPrint = True

except:
    complexPrint = False

if complexPrint:
    print(" ")
    print("I think the active character is " + sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1])
    print(" ")
    print(needles)

# SPEECH TO TEXT
model_path = "models/vosk-model-small-en-us-0.15" #models/vosk-model-small-en-us-0.15 #models/vosk-model-en-us-0.42-gigaspeech #models/vosk-model-en-us-0.22-lgraph
audio_path = os.path.join(os.path.dirname(__file__), sys.argv[2])
activeChar = sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1]

t2_start = perf_counter()

model = Model(model_path)
wf = wave.open(audio_path, "rb")
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

print()

for word in list_of_Words:
    charIndexToWordIndex[totalChars] = idx
    totalChars += len(str(word.get_word())) + 1 # space xD
    idx = idx + 1
    haystack = haystack + str(word.get_word()) + " "

wf.close() 

if complexPrint:
    print(haystack)

t2_stop = perf_counter()
t1_start = perf_counter()

characterCount = 0
failedLines = []
allLines = []
toWrite = []

for x, n in enumerate(needles):

    if needles[x][2] == activeChar:

        characterCount += 1
        lineID = needles[x][1]
        needle = needles[x][3]

        needle = remove_stuttering(remove_stuttering(needle)).replace("-", " ").replace("“", "").replace("”", "")
        needle = needle.lower().translate(str.maketrans('', '', string.punctuation)).replace("…" , "").replace("—", " ")
        needle = remove_leading_space(needle)

        #Break if it's an empty string like "?!" "!!" "..."
        if not any(c.isalpha() for c in needle):
            continue

        if complexPrint:
            print(fullLine)
            print("Current Needle:\t " + needles[x][1] + "\t " + "|" + needle + "|")

        arrMatch = []
        flagFailed = True

        matches = find_matches(haystack, needle)

        if len(matches) > 0:
            for i in matches:
                startIndex = haystack.find(i)

                if complexPrint:
                    print("Match: " + i)

                if startIndex in charIndexToWordIndex:
                    lineSize = len(needle.split())

                    start_word_index = charIndexToWordIndex[startIndex]
                    end_word_index = start_word_index + lineSize

                    allLines.append([str(round(list_of_Words[start_word_index].get_start() - 0.25, 3)), str(round(list_of_Words[end_word_index-1].get_end() + 0.75, 3)), lineID])

                    if complexPrint:
                        print("Match Successful")
                else:
                    failedLines.append([needles[x][1], needle])
                    if complexPrint:
                        print("Unique Match Failed " + i)

        else:
            if complexPrint:
                print("No Matches")

            failedLines.append([needles[x][1], needle])

        t1_stop = perf_counter()

if complexPrint:
    print(fullLine)

try:
    dest_file = codecs.open(sys.argv[1].replace(".txt", "_autoLabel.txt"), "w", "utf-8")

except:
    print("Invalid destination file, abort.")
    exit()

#Prune Output Arrays
allLines = [list(x) for x in set(tuple(x) for x in allLines)]
allLines = remove_nested_arrays(allLines) #this has weird behavior, check the "Apollo..." line
allLines.sort(key=lambda x: float(x[0]))

#Superbad merging is caused by the sliding window find matches method. Fix this with GPT later.

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
label_counts = {}
for line in allLines:
    label = line[2]
    if label in label_counts:
        label_counts[label] += 1
    else:
        label_counts[label] = 1

for label, count in label_counts.items():
    if count >= 6: #Maximum number of takes a VA could plausibly do
        allLines = [line for line in allLines if line[2] != label]

# Create a set of all unique identifiers in allLines
allLinesIds = set([line[2] for line in allLines])

# Iterate over needles and check if the identifier is in the set of allLinesIds
for needle in needles:
    if needles[2] == activeChar:
        if needle[1] not in allLinesIds:    
            failedLines.append([needle[1], needle[3]])

#Failed Lines Prune Duplicates
failedLines = list(set(tuple(i) for i in failedLines))
failedLines = [list(i) for i in failedLines]
failedLines = sorted(failedLines, key=lambda x: int(x[0].split("_")[1]))

if complexPrint:
    print("Accuracy is %" + str(round((((characterCount-len(failedLines))/characterCount) * 100), 2)))

#Print
for i in range(len(allLines)):
    toWrite += (allLines[i][0] + "\t" + allLines[i][1] + "\t" + allLines[i][2] + "\n")

#Failed Lines
for x, n in enumerate(failedLines):
    toWrite.append(str("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1] + "\n"))
    if complexPrint:
        print("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1])

for x in toWrite:
    dest_file.write(x)

dest_file.close()

print()
print("Finished.")
print()

print("VOSK Transcription took: \t",
      str(round(t2_stop-t2_start, 3)) + " seconds.")

print("SoundEx Alignment took: \t",
      str(round(t1_stop-t1_start, 3)) + " seconds.")