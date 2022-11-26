import wave
import string
import json
import string
import os

from time import perf_counter
from cProfile import label
from matplotlib.lines import segment_hits
import whisper

import ahocorasick

fullLine = "_________________"

#this is nightmare shit code, but it's nightmare shit code that works

needles = [
['dialogue', 's1_004_twilight', 'Twilight', 'It’s true. She was awfully determined to keep things to herself. Again.', 'NONE'],
['dialogue', 's1_006_twilight', 'Twilight', 'I’m wondering if that was connected to how she was behaving earlier today.', 'NONE'],
['dialogue', 's1_008_twilight', 'Twilight', 'Yeah, and how nonchalant she was.', 'NONE'],
['dialogue', 's1_009_twilight', 'Twilight', 'Since Athena managed to surprise her, I think she must have been counting on not being asked to testify.', 'NONE'],
['dialogue', 's1_012_twilight', 'Twilight', 'Agreed. I didn’t like making Sweetie Belle feel that way, either, but she’s definitely up to something. We can’t save her if she isn’t willing to speak.', 'NONE'],
['dialogue', 's1_039_twilight', 'Twilight', 'One that Fair Devotion, Sugar Stamp, and Private Eye must ALL be aware of—that’s why you insisted we go down this route, isn’t it?', 'NONE'],
['dialogue', 's1_043_twilight', 'Twilight', 'What, indeed…?', 'NONE'],
['dialogue', 's1_067_twilight', 'Twilight', '!! B-but, the fact that the magazine cutouts match the tip… does that mean Diamond Tiara’s the one who actually sent it?', 'NONE'],
['dialogue', 's1_079_twilight', 'Twilight', 'You managed to uncover quite a bit, Sonata! It must have taken you some time!', 'NONE'],
['dialogue', 's1_095_twilight', 'Twilight', 'W-wha—Zecora?', 'NONE'],
['dialogue', 's1_103_twilight', 'Twilight', 'Day-bloomers…', 'NONE'],
['dialogue', 's1_117_twilight', 'Twilight', 'Local hospital? That must mean… Ponyville General Hospital.', 'NONE'],
['dialogue', 's1_145_twilight', 'Twilight', 'Right. We’d better head inside, Athena.', 'NONE'],
['dialogue', 's1_163_twilight', 'Twilight', 'A-Athena, we need to get going!', 'NONE']
]

#INPUT

model = whisper.load_model("tiny")
audio_path = os.path.join(os.path.dirname(__file__), "audio\TS_208.wav")
activeChar = "Twilight"

#SPEECH TO TEXT

t2_start = perf_counter()

result = model.transcribe(audio_path, fp16=False, language="en")
strLines = result["text"]

haystack = strLines.lower().translate(str.maketrans('', '', string.punctuation))

print(fullLine)
print(haystack)

#AHO-CORASICK AUTOMATON GOES HERE

""" 

SOUNDMAN THOUGHT 1

Organize the problem into two smaller problems:

1. Speech-to-text

    Whisper AI offers the best trade-off between speed and accuracy. The only remaining issue with this portion of the problem
is world-level time signatures for the labelling. Someone did manual forced alignment with Whisper that allows for world-level
time stamping, check that out.

2. Set cover problem

    Aho-Corasick is about as fast as we can reasonably get for checking substrings in a needle-haystack structure. This, plus
the returned character indices makes this a very attractive solution. Consider a nested Aho-Corasick search down below when
we iterate over compList.

Aho-Corasick should have linear time complexity as input increases. SST may scale O(n^3) because deep learning :/

SOUNDMAN THOUGHT 2

[13, 22, 3, 'in session']
[24, 30, 5, 'for the']
[32, 36, 7, 'trial']
[46, 52, 10, 'sweetie']
[54, 58, 11, 'belle']
[127, 133, 12, 'i would']
[269, 275, 12, 'i would']
[453, 459, 12, 'i would']
[135, 138, 14, 'like']
[277, 280, 14, 'like']
[397, 400, 14, 'like']
[461, 464, 14, 'like']
[626, 629, 14, 'like']
[140, 145, 15, 'to ask']
[282, 287, 15, 'to ask']
[466, 471, 15, 'to ask']
[631, 636, 15, 'to ask']
[77, 89, 17, 'the defendant']
[91, 98, 19, 'is ready']
[100, 109, 21, 'to testify']

This is what the Aho-Corasick algorithm outputs as EXACT MATCHES between the voice line from the script and
the VOSK output. We need a comparison algorithm that can fill in where the beginning and end of the voice line
is in the VOSK output based COMPARING these EXACT MATCHES to the script line.

We will accomplish this by counting WORDS and getting the N-th word offset from an EXACT MATCH.

This is to say, the process for determining the start and stop of this line:

"Court is now in session for the trial of Ms. Sweetie Belle. I would like to ask the defendant is ready to testify?"
   0   1   2   3    4     5   6    7   8  9     10      11   12 13    14  15  16  17    18     19  20   21    22

Where the VOSK output is 
"haters back in session for the trial of miss sweetie belle arent close that the defendant is ready to testify 
before we begin i would like to ask if either the prosecution or the have any final objections to the matter 
prosecutor new know what say you before we begin i would like to ask if either the problem the judge suddenly 
turn of the full puff there oh im so glad im not doing a character like that my pop filter with okay right before 
we begin i would like to ask if either the prosecution or defense of any final objections to the matter matt matt 
at but ah but ah but im a tad bit immature before we begin or would like to ask if either the prosecution or defense 
of any final objections to the matter prosecutor new know what say you those little to conversation on a little more 
thought of"

The longest matching substring is "the defendant," which is known to be the 17th and 18th word, respectively.

Working outwards from the longest substring, we can determine that the end of the VOSK line should be
"testify," which is the 22nd word, and so is the end of the line. The algorithm should factor in other matches,
since "the defendant is ready to testify" is all an EXACT MATCH.

Establishing the start of the line is trickier. The earliest exact match is "in session," which is the 3rd and 4th
word of the line, respectively. Counting words backwards, we know the start of the line should be the word BEFORE
haters. Since haters is a mistranscription of court is, this is erroneous. This step needs error-catching to prevent
this from happening.

SOUNDMAN THOUGHT 3

Added a lot of print statements to help your understanding.

_________________
Current Needle:  s1_145_twilight         Right. We’d better head inside, Athena.
Match found. athena is the 6 word in the string.
[420, 425, 5, 'athena']
Match found. athena is the 6 word in the string.
[523, 528, 5, 'athena']
Match found. right is the 1 word in the string.
[1449, 1453, 0, 'right']
Match found. better is the 3 word in the string.
[1459, 1464, 2, 'better']
Match found. head is the 4 word in the string.
[1466, 1469, 3, 'head']
Match found. inside is the 5 word in the string.
[1471, 1476, 4, 'inside']
Match found. athena is the 6 word in the string.
[1478, 1483, 5, 'athena']
Match found. right is the 1 word in the string.
[1485, 1489, 0, 'right']
Match found. better is the 3 word in the string.
[1495, 1500, 2, 'better']
Match found. head is the 4 word in the string.
[1502, 1505, 3, 'head']
Match found. inside is the 5 word in the string.
[1507, 1512, 4, 'inside']
Match found. athena is the 6 word in the string.
[1514, 1519, 5, 'athena']
Match found. athena is the 6 word in the string.
[1521, 1526, 5, 'athena']
Match found. athena is the 6 word in the string.
[1549, 1554, 5, 'athena']
_________________

The pattern is obvious, but tricky to encode. Athena is the 6th word in the string and happens twice before the first word,
therefore it is junk data. The same is true of the last two Athena's.

With the words organized by start character index, we can count two takes of word order 1-3-4-5-6, 1-3-4-5-6.

The two take labels should be the starting time signature of the first instance one of 1, and the ending time signature of the
first instance of 6. Then the starting time signature of the second instance of 1, and the ending time signature of the second
instance of 6.

TO-DO:
After we extrapolate a line's start and stop and it is validated to be a correct line, remove it from the haystack?
Contractions don't show up when they should?

CMD Format should be:
python aho-corasick-fuzzy.py sceneData.txt audioFile.wav
Remove .wav and all numbers from audioFile to get activeChar

"""

t2_stop = perf_counter()

t1_start = perf_counter()

chkFlag = False
minLength = 3
failedLines = []

for x, n in enumerate(needles):
    if needles[x][2] == activeChar:
        A = ahocorasick.Automaton()
        print(fullLine)
        print("Current Needle:\t " + needles[x][1] + "\t " + needles[x][3])

        needle = needles[x][3].lower().translate(str.maketrans('', '', string.punctuation))
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

        #SORTING LOGIC GOES HERE
        #there's a lot of arbitrary variable names, I'm sorry, i'm so sorry

        arrMatch = []
        flagFailed = True

        #append WORD from haystack to arrMatch
        for end_index, (insert_order, original_value) in A.iter(haystack):
            start_index = end_index - len(original_value) + 1
            flagFailed = False
            arrMatch.append([start_index, end_index, insert_order, original_value])

        #flagFailed determines if a line is not present in the audio file,
        #adds it to failedLines array for logging
        if flagFailed:
            failedLines.append([needles[x][1], needles[x][3]])

        #sort by start character index
        arrMatch = sorted(arrMatch, key=lambda i: i[0])

        #break needle string down into list of words
        compList = needles[x][3].split()
        arrFinal = []

        #retarded iteration (he didn't know about enumerate...)
        i = 0
        while i < len(arrMatch):
            for x, n in enumerate(compList):
                #make all lowercase and remove punctuation (does this fuck up contractions?...)
                needleWord = compList[x].lower().translate(str.maketrans('', '', string.punctuation))

                if needleWord == arrMatch[i][3]:
                    #if needleWord matches haystack word, append to arrFinal and specify n-th word in needle
                    print("Match found. " + arrMatch[i][3] + " is the " + str(x+1) + " word in the string.")
                    arrFinal.append([arrMatch[i][0], arrMatch[i][1], x+1])
                elif " " in arrMatch[i][3]:
                    #same as above, but catches combined words like 'would have' or 'the defense'
                    tmpSplit = arrMatch[i][3].split()
                    for word in tmpSplit:
                        if needleWord == word:
                            print("Match found. " + word + " is the " + str(x+1) + " word in the string.")
                            arrFinal.append([arrMatch[i][0], arrMatch[i][1], x+1])

            print(arrMatch[i])
            i = i+1

    #this is where the big boy algorithm goes that actually re-constructs the sentence
    #make a length tolerance of 1.5 times the needle length rounded to an int, to weed out false positives
    #arrFinal = sorted(arrFinal, key=lambda i: i[0])
    #lenTolerance = round(len(needles[x][3])*1.5)

    for x, n in enumerate(arrFinal):
        if x <= len(arrFinal)-1:
            print("starChar " + str(arrFinal[x][0]), end = ' ')
            print("endChar " + str(arrFinal[x][1]), end = ' ')
            print("numWord " + str(arrFinal[x][2]))

t1_stop = perf_counter()

for x, n in enumerate(failedLines):
    print("Failed Line: \t" + failedLines[x][0] + "\t\t " + failedLines[x][1])

print(fullLine)

print("Whisper AI Transcription took: \t",
                                        str(round(t2_stop-t2_start, 3)) + " seconds.")

print("Aho-Corasick search took: \t",
                                        str(round(t1_stop-t1_start, 3)) + " seconds.")