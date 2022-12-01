import wave
import string
import json
import string
import time

from vosk import Model, KaldiRecognizer, SetLogLevel
import Word as custom_Word
import ahocorasick

complexPrint = False

needle = "Court is now in session for the trial of Ms. Sweetie Belle. I trust that the defendant is ready to testify?"
needle = needle.lower().translate(str.maketrans('', '', string.punctuation))

#INPUT

model_path = "models\\vosk-model-small-en-us-0.15"
audio_filename = "C:\\Users\\rct3f\\AppData\\Local\\Adobe\\Animate 2022\\en_US\\Configuration\\Commands\\AI Assisted Audio Splicing\\algorithmicAI\\Judge208.wav"
activeChar = "Judge"

#SPEECH TO TEXT

model = Model(model_path)
wf = wave.open(audio_filename, "rb")
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

wf.close()  # close audiofile

strLines = ""
wLines = []
charArr = []
uniqueID = []

for word in list_of_Words:
    strLines+=(" "+word.get_word())
    wLines.append(word)
    charArr.append(len(strLines)) 

haystack = strLines.lower().translate(str.maketrans('', '', string.punctuation))

print(haystack)

#AHO-CORASICK AUTOMATON GOES HERE
begin = time.perf_counter()
A = ahocorasick.Automaton()

for idx, key in enumerate(needle.split()):
    A.add_word(key, (idx, key))

A.make_automaton()

#SORTING LOGIC GOES HERE

arrMatch = []

for end_index, (insert_order, original_value) in A.iter(haystack):
    start_index = end_index - len(original_value) + 1
    if complexPrint:
        print((start_index, end_index, (insert_order, original_value)))
    else:
        print(original_value, end = ' ')
    #assert haystack[start_index:start_index + len(original_value)] == original_value

    arrMatch.append([start_index, end_index, insert_order, original_value])

arrMatch = sorted(arrMatch, key=lambda i: i[0])

print(arrMatch)
end = time.perf_counter()
print(begin, end)
""" 
Soundman's Thinking Area

Organize the problem into two smaller problems:

1. Speech-to-text

    Speech-to-text will never be 100% accurate, and this is why we need fuzzy matching. The more accurate the SST is,
the less fuzziness we need to calculate for. It stands to reason then, we need to maximize accuracy of this stage without
greatly increasing execution time. Experiment between VOSK-small and Montreal Forced Alignment accuracy of SST.

2. Set cover problem

    This Aho-Corasick package allows for substitutions, but not insertions or deletions (as far as I can tell.) This means
it runs extremely fast, but the data it outputs is also messy and unhelpful. We need a methodology for splicing the haystack
into needle segments that accounts for errors on the SST's part. Getting the first word and last word to get the duration of
a voice line is problematic, because it requires both the first and last words match perfectly. An elegant solution must 
exist, but it is likely complicated and out of scope for one programmer. OH CONNOR!

For Connor's Use:

It seems to be possible to pre-compute the automaton, the documentation calls this pickling. Don't know how useful this is
for our use case, but maybe it's very useful!

"""