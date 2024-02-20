""" 
SCRIPT MARKUP
Description:
Converts a script from Elements of Justice into an audio markup and into an array file for
scene generation.

Issues:
- Export scene generation file per-scene
- This doesn't do audio markup ahahaha

- Transient emotion smoothing
- If sfx-high is in sequence, increment second to sfx-higher

- Up to three SFX in a line, no more
- Apostrophes are weird in SFX automation
"""
from LeXmo import LeXmo

import sys
import json
import re
import string

from typing import Dict
from Levenshtein import distance

import os.path

def remove_square_brackets(text):
    return re.sub(r'\[.*?\]', '', text)

def is_only_question_or_exclamation(line):
    return re.match(r'^[?!]+$', line.strip()) is not None

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

emotions_dict = {
    '+C': 'sfx-huh',
    '-RGF': 'sfx-damage',
    'SS': 'sfx-shocked'
}

def getSFX(emotion: str, emotions_dict: Dict[str, str]) -> str:
    min_distance = float('inf')
    closest_emotion = None
    for key, value in emotions_dict.items():
        dist = distance(emotion, key)
        if dist < min_distance:
            min_distance = dist
            closest_emotion = value
    return closest_emotion

def ProcessSFX(lineID, line, emotion):
    line = line.replace('’', "'") #slay me
    lineIDoccurance = list(sfx_data.values()).count(lineID)
    lineNoPunct = line.replace(',', "").replace(':', "").replace('-', " ")
    words = lineNoPunct.split()
    uppercase_words = [word for word in words if word.isupper() and word != "I" and word != "A" and word != "O"]

    #May want index to find n-th instance of work. (s1_153_apollo)
    #Check s1_163_apollo

    #?! Permutations
    if is_only_question_or_exclamation(line):
        if lineIDoccurance < 3:
            sfx_data[lineID] = {
                "Alignment": 0,
                "SFX": "sfx-lightbulb"
            }
    
    # Huh Coverage
    if len(line) < 15:
        if "Huh" in line.lower():
            if lineIDoccurance < 3:
                sfx_data[lineID] = {
                    "Alignment": "huh",
                    "SFX": "sfx-huh"
                }

    # Question Coverage, needs to be non-negative Emotion, with ?
    question_words = ["what", "who", "where", "when", "why", "how"]
    for word in question_words:
        if word in lineNoPunct.lower() and '?' in line.lower() and '-' not in emotion:
            if lineIDoccurance < 3:
                sfx_data[lineID] = {
                    "Alignment": word.lower(),
                    "SFX": "sfx-huh"
                }
            break

    # Quotational Coverage
    # Magical Unicode Horseshit
    if '“' in line and '?' in line:
        start_index = line.index('“')
        end_index = line.index('”')
        substring = line[start_index+1:end_index]
        first_word = substring.split()[0]
        sfx_data[lineID] = {
            "Alignment": first_word.lower(),
            "SFX": "sfx-huh"
        }
    elif '“' in line and not '?' in line:
        start_index = line.index('“')
        end_index = line.index('”')
        substring = line[start_index+1:end_index]
        first_word = substring.split()[0]   
        sfx_data[lineID] = {
            "Alignment": first_word.lower(),
            "SFX": "sfx-lightbulb"
        }

    # Ellipses Support
    pattern = r"\.{3}\s+(\w+)"
    matches = re.findall(pattern, lineNoPunct)
    if matches and '--' in line:
        sfx_data[lineID] = {
            "Alignment": matches[0].lower(),
            "SFX": "sfx-huhlow"
        }
    if matches and '+' in line:
        sfx_data[lineID] = {
            "Alignment": matches[0].lower(),
            "SFX": "sfx-huhlow"
        }

    # Handle Uppercase
    for i, sfx_word in enumerate(uppercase_words[:3]):
        if i < 3:
            if '?' in line:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower(),
                    "SFX": 'sfx-huh'
                }
            elif '!' in line:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower(),
                    "SFX": 'sfx-hit1'
                }
            else:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower(),
                    "SFX": 'sfx-damage'
                }


    # Need Objection/Hold It/Take That... Coverage
        
def PostprocessSFX(json_data):
    consecutive_count = 0
    for key, value in json_data["SFX"].items():
        # Huh chain
        if value["SFX"] == "sfx-huh":
            consecutive_count += 1
        if consecutive_count >= 2:
            value["SFX"] = f"sfx-huh{['', 'high', 'higher', 'highest'][consecutive_count - 2]}"
        else:
            consecutive_count = 0

        # Proportionally prune excessive lightbulbs
        if value["SFX"] == "sfx-lightbulb":
            consecutive_count_lightbulb += 1
            lightbulb_keys.append(key)

            if consecutive_count_lightbulb > 3:
                if consecutive_count_lightbulb % 2 == 0:
                    lightbulb_keys_to_remove = lightbulb_keys[1:-1]
                else:
                    lightbulb_keys_to_remove = lightbulb_keys[:-1]
                
                for key_to_remove in lightbulb_keys_to_remove:
                    del json_data["SFX"][key_to_remove]

                lightbulb_keys = [lightbulb_keys[-1]]
                consecutive_count_lightbulb = 1
        else:
            lightbulb_keys = []
            consecutive_count_lightbulb = 0

if not len(sys.argv) > 1:
    print("Please specify script file as the first argument. TXT file must be UTF-8 encoded or else you will receive the error UnicodeEncodeError: 'charmap' codec can't encode character '\ufeff' in position 0: character maps to <undefined>.")
    exit()

try:
    file = open(sys.argv[1], "r")

except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()

dialogue_data = {}
sfx_data = {}
intro_data = {}

with open(sys.argv[1], "r", encoding="utf8") as file:
    cur_voice_line = 1
    scene = 1
    characters = []

    for line in file:
        new_line = line.strip()

        if "Date - Time – Location:" in line:
            intro_data["TypewriterIntro"] = {}
            parts = line.split("–")
            intro_data["TypewriterIntro"]["Time"] = parts[1].strip().replace('Location: ', '')
            intro_data["TypewriterIntro"]["Location"] = parts[2].strip()

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
            if (character.upper().replace(" ", "").replace("	", "") + "\n" in line.replace(" ", "").replace("	", "")) or (character.upper() + " &" in line.strip()):
                speaker_key = f"s{scene}_{cur_voice_line:03d}_{character.lower()}"
                if speaker_key not in dialogue_data:
                    LineText = remove_square_brackets(file.readline()).strip()
                    Emotion = returnEmotion(LeXmo.LeXmo(LineText), LineText)
                    #Emotion = "C"
                    dialogue_data[speaker_key] = {
                        "CharacterName": character,
                        "LineText": LineText,
                        "Emotion": Emotion
                    }
                    ProcessSFX(speaker_key, LineText, Emotion)
                cur_voice_line += 1
                break

# Wrap the dialogue data in a dictionary under the key "Dialogue"
output_data = {
    "Dialogue": dialogue_data,
    "SFX": sfx_data,
    "Typewriter": intro_data
}

PostprocessSFX(output_data)

# Write the JSON to a file
output_file_path = sys.argv[1].replace(".txt", "_output.json")
with open(output_file_path, "w", encoding="utf-8") as json_file:
    json.dump(output_data, json_file, indent=4, ensure_ascii=False)

print("JSON generation completed successfully. Output saved to:", output_file_path)