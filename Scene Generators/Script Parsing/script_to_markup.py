
""" 
SCRIPT MARKUP
Description:
Converts a script from Elements of Justice into an audio markup and into an array file for
scene generation.

Issues:
- Export scene generation file per-scene
- How the hell are we gonna do SFX?
"""

#EMOTION ENGINE SUPPORT

from configparser import SafeConfigParser

from msilib.schema import Feature
from unittest import TestCase
from LeXmo import LeXmo

from fuzzywuzzy import fuzz
from fuzzywuzzy import process

#EMOTION ENGINE SUPPORT

import sys
import re
import os

import os.path


def returnEmotion(emo, emoStr):

    lexmoDictionary = ""

    if emo.get("positive") != 0 or emo.get("negative") != 0:
            if emo.get("positive") > emo.get("negative"):
                lexmoDictionary += "+"
                if emo.get("positive") > 0.2:
                    lexmoDictionary += "+"
            else:
                lexmoDictionary += "-"
                if emo.get("negative") > 0.2:
                    lexmoDictionary += "-"

    if emo.get("joy") != 0 or emo.get("sadness") != 0:
        if emo.get("joy") > emo.get("sadness"):
            lexmoDictionary += "H"
            if emo.get("joy") > 0.2:
                lexmoDictionary += "H"
        else:
            lexmoDictionary += "B"
            if emo.get("sadness") > 0.2:
                lexmoDictionary += "B"

    if emo.get("anger") != 0:
        lexmoDictionary += "R"

    if emo.get("anger") > 0.2:
        lexmoDictionary += "R"

    if "!" in emoStr:
        lexmoDictionary += "R"

    if emo.get("anticipation") != 0:
        lexmoDictionary += "A"

    if "!?" in emoStr or "..." in emoStr or "-" in emoStr:
        lexmoDictionary += "A"

    if emo.get("disgust") != 0:
        lexmoDictionary += "G"

    if emo.get("disgust") > 0.2:
        lexmoDictionary += "G"

    if emo.get("fear") != 0:
        lexmoDictionary += "F"

    if emo.get("fear") > 0.2:
        lexmoDictionary += "F"

    if emo.get("surprise") != 0:
        lexmoDictionary += "S"

    if emo.get("surprise") > 0.2:
        lexmoDictionary += "S"

    if "!?" in emoStr or "?!" in emoStr:
        lexmoDictionary += "S"

    if emo.get("trust") != 0:
        lexmoDictionary += "T"

    if "you" in emoStr or "You" in emoStr:
        lexmoDictionary += "T"

    if "?" in emoStr or "Huh" in emoStr or "..." in emoStr:
        lexmoDictionary += "C"

    return lexmoDictionary

if not len(sys.argv) > 1:
    print("Please specify script file as the first argument. TXT file must be UTF-8 encoded or else you will receive the error UnicodeEncodeError: 'charmap' codec can't encode character '\ufeff' in position 0: character maps to <undefined>.")
    exit()

try:
    file = open(sys.argv[1], "r")

except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()

with open(sys.argv[1], "r", encoding="utf8") as file:

    to_write = ""
    cur_voice_line = 1

    scene = 1
    characters = []

    flag_isSpeakingLine = False
    flag_runFirst = True

    str_lineId = ""
    str_speaker = ""
    str_dialogue = ""
    str_pose = ""

    arr_sceneData = []

    for line in file:

        new_line = line
        flag_isSpeakertag = False

        if "SCENE " in line:
            scene = int(line[line.index("SCENE ") + len("SCENE "):len(line) - 1])
            characters = [] # reset characters for new scene, probably redundant <= don't reset, let it build to maximize successful run if a character is undeclared by err in a later scene -S
            cur_voice_line = 1 # reset voice line count

        if "Characters: " in line:
            # get characters of a scene
            characters = line[line.index("Characters: ") + len("Characters: "):len(line) - 1].split(', ')

        for character in characters:
            if (character.upper()+"\n" in line) or (character.upper() + " &" in line):
                flag_isSpeakertag = True
                new_line = new_line.replace(character.upper(), "s"+str(scene)+"_"+str(cur_voice_line).zfill(3)+"_"+character.lower())
                str_lineId = new_line.strip('\n')

        if line.startswith("<"):
            #get stage directions

            #fades
            if "fade" in line.lower():
                if "out" in line.lower():
                    print("fade out")
                if "in" in line.lower():
                    print("fade in")            

            #panning TODO: Handle Multiple Witnesses
            if "pan" in line.lower():
                if "prosecution" in line.lower():
                    print("pan prosecution")
                if "defense" in line.lower():
                    print("pan defense")

            #evidence
            if "evidence" in line.lower():
                if "get" in line.lower():
                    print("evidence get " + line.split(' ')[3-1] + " " + line.split(" ", 3)[-1].strip('\n').strip('>'))
                if "present" in line.lower():
                    print("evidence present " + line.split(' ')[3-1] + " " + line.split(" ", 3)[-1].strip('\n').strip('>'))

            #write SFX some other day

        if flag_isSpeakingLine: 
            #gets dialogue lines

            str_dialogue = re.sub("\[.*?\]+\s", "", line.strip('\n')) #TODO this still does not remove text inside [] brackets, fuck my life
            flag_isSpeakingLine = False
            flag_runFirst = False

            #EMOTION ENGINE SUPPORT

            #do it dynamically

            str_pose = returnEmotion(LeXmo.LeXmo(str_dialogue), str_dialogue)

            #EMOTION ENGINE SUPPORT
    
        if flag_isSpeakertag:
            #gets speaker tag
            str_speaker = line.title()
            str_speaker = str_speaker.strip('\n')
            flag_isSpeakingLine = True
            cur_voice_line+=1
            flag_runFirst = True

        if not flag_runFirst:
            #export dialogue data
            #print("dialogue" + " " + str_lineId + " "  + str_speaker + " "  + str_dialogue + " " + "(" + str_pose + ")")

            arr_tmpData = ["dialogue", str_lineId, str_speaker, str_dialogue, str_pose]
            arr_sceneData.append(arr_tmpData)
            #print("Calculated Pose\n")

            flag_runFirst = True

        to_write+=new_line

    try:
        dest_file = open(sys.argv[1].replace(".txt", "_ae_markup.txt"), "w")

    except:
        print("Invalid destination file, abort.")
        exit()

    dest_file.write(to_write)
    dest_file.close()

    try:
        dest_file = open(sys.argv[1].replace(".txt", "_sceneGeneration.txt"), "w")

    except:
        print("Invalid destination file, abort.")
        exit()

    dest_file.write("var sceneData = \n[")

    for i in arr_sceneData:
        if i != arr_sceneData[-1]:
            dest_file.write("\n" + str(i) + ",")
        else:
            dest_file.write("\n" + str(i))

    dest_file.write("\n];")

    dest_file.close()

    print("Execution completed successfully.")