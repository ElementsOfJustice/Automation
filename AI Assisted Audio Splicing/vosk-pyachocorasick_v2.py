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
import numpy as np

from time import perf_counter

import ahocorasick
from vosk import Model, KaldiRecognizer, SetLogLevel
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

# VARIABLES
needles = []
charIndexToWordIndex = {}
totalChars = 0
idx = 0
haystack = ""
fullLine = "_________________"

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
model_path = "models/vosk-model-small-en-us-0.15"
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

# AHO-CORASICK AUTOMATON GOES HERE
t2_stop = perf_counter()
t1_start = perf_counter()

chkFlag = False
minLength = 3
failedLines = []
toWrite = [];
lineID = ""

for x, n in enumerate(needles):

    if needles[x][2] == activeChar:
        A = ahocorasick.Automaton()

        lineID = needles[x][1]

        if complexPrint:
            print(fullLine)
            print("Current Needle:\t " + needles[x][1] + "\t " + "|" + needles[x][3].replace("…" , "") + "|")

        needle = needles[x][3].lower().translate(
            str.maketrans('', '', string.punctuation)).replace("…" , "")
        for idx, key in enumerate(needle.split()):

            if len(key) <= minLength and chkFlag == False and idx < len(needle.split())-1:
                newKey = key + " " + needle.split()[idx+1]
                A.add_word(newKey, (idx, newKey))
                chkFlag = True
                continue
            elif chkFlag == False:
                A.add_word(key, (idx, key))

            if chkFlag == True:
                chkFlag = False

        A.make_automaton()

        # SORTING LOGIC GOES HERE
        arrMatch = []
        flagFailed = True

        # append WORD from haystack to arrMatch
        for end_index, (insert_order, original_value) in A.iter(haystack):
            start_index = end_index - len(original_value) + 1
            flagFailed = False
            arrMatch.append(
                [start_index, end_index, insert_order, original_value])

        # flagFailed determines if a line is not present in the audio file,
        # adds it to failedLines array for logging
        if flagFailed:
            failedLines.append([needles[x][1], needles[x][3]])

        arrMatch = sorted(arrMatch, key=lambda i: i[0])
        compList = needle.split()

        arrFinal = []
        for i, match in enumerate(arrMatch):
            for x, n in enumerate(compList):
                needleWord = compList[x].lower().translate(str.maketrans('', '', string.punctuation))
                if soundex(needleWord) == soundex(match[3]):
                    if complexPrint:
                        print("Phonetic match found. " + match[3] + " is similar to " + needleWord + ".")
                    arrFinal.append([match[0], match[1], x+1])
            if complexPrint:
                print(arrMatch[i])

        # SENTENCE RECONSTRUCTION
        size = len(needle.split())
        start_word_index = None
        end_word_index = None
        got_list = []

        for x, n in enumerate(arrFinal):
            if (arrFinal[x][0] in charIndexToWordIndex):
                start_word_index = charIndexToWordIndex[arrFinal[x][0]] - arrFinal[x][2] + 1
                end_word_index = start_word_index + size

                if not any(i in got_list for i in range(start_word_index, end_word_index)):
                    if end_word_index <= len(list_of_Words):
                        got_list.extend(range(start_word_index, end_word_index))
                        toWrite.append((str(round(list_of_Words[start_word_index].get_start() - 0.1, 3)) + "\t" + 
                                        str(round(list_of_Words[end_word_index-1].get_end() + 0.25, 3)) + "\t" + lineID)+"\n")

                        if complexPrint:
                            print(str(round(list_of_Words[start_word_index].get_start() - 0.1, 3)) + "/" + 
                                str(round(list_of_Words[end_word_index-1].get_end() + 0.25, 3)) + "/" + lineID)

        t1_stop = perf_counter()

for x, n in enumerate(failedLines):
    toWrite.append(str("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1] + "\n"))
    if complexPrint:
        print("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1])

if complexPrint:
    print(fullLine)

try:
    dest_file = codecs.open(sys.argv[1].replace(".txt", "_autoLabel.txt"), "w", "utf-8")

except:
    print("Invalid destination file, abort.")
    exit()

res = []
[res.append(x) for x in toWrite if x not in res]
toWrite = res

for x in toWrite:
    dest_file.write(x)

dest_file.close()

print("Finished.")

print("VOSK Transcription took: \t",
      str(round(t2_stop-t2_start, 3)) + " seconds.")

print("Aho-Corasick search took: \t",
      str(round(t1_stop-t1_start, 3)) + " seconds.")
