# -*- coding: utf-8 -*-

""" ******************************************************************************
                        AUTOMATIC LINE SPLICING (11/30/22)

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

from time import perf_counter
from cProfile import label

import ahocorasick
from vosk import Model, KaldiRecognizer, SetLogLevel
import Word as custom_Word

# VARIABLES
needles = []
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
    print("I think the active character is " + sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1])
    print(" ")
    print(needles)

model_path = "models/vosk-model-small-en-us-0.15"
audio_path = os.path.join(os.path.dirname(__file__), sys.argv[2])
activeChar = sys.argv[2].translate(str.maketrans(string.ascii_letters, string.ascii_letters, string.digits)).split('.')[0].split("\\")[-1]

# SPEECH TO TEXT

t2_start = perf_counter()

model = Model(model_path)
wf = wave.open(audio_path, "rb")
rec = KaldiRecognizer(model, wf.getframerate())
rec.SetWords(True)

# get the list of JSON dictionaries
results = []
# recognize speech using vosk model
while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        part_result = json.loads(rec.Result())
        results.append(part_result)
part_result = json.loads(rec.FinalResult())
results.append(part_result)

# convert list of JSON dictionaries to list of 'Word' objects
list_of_Words = []
for sentence in results:
    if len(sentence) == 1:
        # sometimes there are bugs in recognition 
        # and it returns an empty dictionary
        # {'text': ''}
        continue
    for obj in sentence['result']:
        w = custom_Word.Word(obj)  # create custom Word object
        list_of_Words.append(w)  # and add it to list

charIndexToWordIndex = {}
totalChars = 0

print()

idx = 0

haystack = ""

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
            print("Current Needle:\t " + needles[x][1] + "\t " + needles[x][3].replace("…" , ""))

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
        # there's a lot of arbitrary variable names, I'm sorry, i'm so sorry

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

        # sort by start character index
        arrMatch = sorted(arrMatch, key=lambda i: i[0])

        # break needle string down into list of words
        compList = needles[x][3].split()
        arrFinal = []

        # retarded iteration (he didn't know about enumerate...)
        i = 0
        while i < len(arrMatch):
            for x, n in enumerate(compList):
                # make all lowercase and remove punctuation (does this fuck up contractions?...)
                needleWord = compList[x].lower().translate(
                    str.maketrans('', '', string.punctuation))

                if needleWord == arrMatch[i][3]:
                    # if needleWord matches haystack word, append to arrFinal and specify n-th word in needle

                    if complexPrint:
                        print(
                            "Match found. " + arrMatch[i][3] + " is the " + str(x+1) + " word in the string.")

                    arrFinal.append([arrMatch[i][0], arrMatch[i][1], x+1])
                elif " " in arrMatch[i][3]:
                    # same as above, but catches combined words like 'would have' or 'the defense'
                    tmpSplit = arrMatch[i][3].split()
                    for word in tmpSplit:
                        if needleWord == word:

                            if complexPrint:
                                print("Match found. " + word + " is the " +
                                str(x+1) + " word in the string.")

                            arrFinal.append(
                                [arrMatch[i][0], arrMatch[i][1], x+1])

            if complexPrint:
                print(arrMatch[i])
            i = i+1

        # this is where the big boy algorithm goes that actually re-constructs the sentence
        # make a length tolerance of 1.5 times the needle length rounded to an int, to weed out false positives
        #arrFinal = sorted(arrFinal, key=lambda i: i[0])
        # lenTolerance = round(len(needles[x][3])*1.5)

        size = len(needle.split())
        startChar = None
        endChar = None
        curNumWord = 0
        curSuccesiveMatches = 0

        gotList = []

        for x, n in enumerate(arrFinal):
            startChar = arrFinal[x][0]
            if(curNumWord < arrFinal[x][2]):
                curSuccesiveMatches += 1
            else:
                curSuccesiveMatches = 0
                startChar = arrFinal[x][0]
            curNumWord = arrFinal[x][2]

            if (curSuccesiveMatches >= round(size*0.1)) and (startChar in charIndexToWordIndex): #0.35
                #print("partial match startChar: " + str(startChar))
                #print("partial match first word index: " + str(charIndexToWordIndex[startChar-1] - arrFinal[x][2] + 1)) # charIndexToWordIndex[startChar-1] - arrFinal[x][2] + 1 is start of partial match!!
                #print("partial match last word index: " + str(charIndexToWordIndex[startChar-1] - arrFinal[x][2] + size)) # charIndexToWordIndex[startChar-1] - arrFinal[x][2] + 1 is start of partial match!!

                #print(charIndexToWordIndex[startChar] - arrFinal[x][2] + 1)
                #print(charIndexToWordIndex[startChar] - arrFinal[x][2] + size + 1)

                tmpList = list(range(charIndexToWordIndex[startChar] - arrFinal[x][2] + 1, charIndexToWordIndex[startChar] - arrFinal[x][2] + size + 1))

                flag = False

                for a, b in enumerate(tmpList):
                    #print(str(b) + " " + str(gotList))
                    if b in gotList:
                        #print(list_of_Words.split()[b])
                        flag = True

                if not flag:
                    startWordIndex = charIndexToWordIndex[startChar] - arrFinal[x][2] + 1
                    endWordIndex = charIndexToWordIndex[startChar] - arrFinal[x][2] + size + 1
                    toWrite.append((str(round(list_of_Words[startWordIndex].get_start() - 0.1, 3)) + "\t" + str(round(list_of_Words[endWordIndex-1].get_end() + 0.25, 3)) + "\t" + lineID)+"\n")

                    if complexPrint:
                        print(str(round(list_of_Words[startWordIndex].get_start() - 0.1, 3)) + "/" + str(round(list_of_Words[endWordIndex-1].get_end() + 0.25, 3)) + "/" + lineID)

                for z, w in enumerate(tmpList):
                    gotList.append(tmpList[z])

t1_stop = perf_counter()

for x, n in enumerate(failedLines):
    #print("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1])
    toWrite.append(str("Failed Line: \t" + failedLines[x][0] + "\t" + failedLines[x][1] + "\n"))

if complexPrint:
    print(fullLine)

#Write to file
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

print("Whisper AI Transcription took: \t",
      str(round(t2_stop-t2_start, 3)) + " seconds.")

print("Aho-Corasick search took: \t",
      str(round(t1_stop-t1_start, 3)) + " seconds.")
