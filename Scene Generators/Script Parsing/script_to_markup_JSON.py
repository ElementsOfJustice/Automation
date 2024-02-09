""" 
SCRIPT MARKUP
Description:
Converts a script from Elements of Justice into an audio markup and into an array file for
scene generation.

Issues:
- Export scene generation file per-scene
- How the hell are we gonna do SFX?
"""
from LeXmo import LeXmo

import sys
import json
import re
import os
import codecs

import os.path

def remove_square_brackets(text):
    return re.sub(r'\[.*?\]', '', text)

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

dialogue_data = {}

with open(sys.argv[1], "r", encoding="utf8") as file:
    cur_voice_line = 1
    scene = 1
    characters = []

    for line in file:
        new_line = line.strip()

        if line.startswith("<"):
            # Handle stage directions (if needed)
            continue
        
        elif "SCENE " in line:
            scene = int(line.upper()[line.upper().index("SCENE ") + len("SCENE "):len(line) - 1])
            characters = []
            cur_voice_line = 1
            continue

        elif "Characters: " in line:
            characters = line.strip()[line.index("Characters: ") + len("Characters: "):len(line) - 1].split(', ')
            continue

        for character in characters:
            if (character.upper().replace(" ", "") + "\n" in line.replace(" ", "")) or (character.upper() + " &" in line.strip()):
                speaker_key = f"s{scene}_{cur_voice_line:03d}_{character.lower()}"
                if speaker_key not in dialogue_data:
                    LineText = remove_square_brackets(file.readline()).strip()
                    dialogue_data[speaker_key] = {
                        "CharacterName": character,
                        "LineText": LineText,
                        "Emotion": returnEmotion(LeXmo.LeXmo(LineText), LineText)
                    }
                cur_voice_line += 1
                break

# Wrap the dialogue data in a dictionary under the key "Dialogue"
output_data = {"Dialogue": dialogue_data}

# Write the JSON to a file
output_file_path = sys.argv[1].replace(".txt", "_output.json")
with open(output_file_path, "w", encoding="utf-8") as json_file:
    json.dump(output_data, json_file, indent=4, ensure_ascii=False)

print("JSON generation completed successfully. Output saved to:", output_file_path)