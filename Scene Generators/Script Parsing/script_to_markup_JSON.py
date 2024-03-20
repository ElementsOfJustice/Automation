""" 
SCRIPT MARKUP
Description:
Converts a script from Elements of Justice into an audio markup and JSON.
"""
from LeXmo import LeXmo

import sys
import json
import re
import codecs

from tqdm import tqdm

from typing import Dict
from Levenshtein import distance

core_interjections = ["HOLD IT!", "OBJECTION!", "TAKE THAT!", "GOTCHYA!"]

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

def check_strings(strings_to_check, target_string):
    for s in strings_to_check:
        if s in target_string:
            return s
    return None

def getSFX(emotion: str, emotions_dict: Dict[str, str]) -> str:
    min_distance = float('inf')
    closest_emotion = None
    for key, value in emotions_dict.items():
        dist = distance(emotion, key)
        if dist < min_distance:
            min_distance = dist
            closest_emotion = value
    return closest_emotion

def replace_case_insensitive(text, find, replace):
    def _repl(match):
        # Check if the matched text is uppercase
        if match.group(0).isupper():
            return replace.upper()
        # Check if the matched text is titlecase
        elif match.group(0).istitle():
            return replace.capitalize()
        # Otherwise, assume it's lowercase
        else:
            return replace.lower()

    # Use re.sub with the re.IGNORECASE flag to perform a case-insensitive find and replace
    return re.sub(find, _repl, text, flags=re.IGNORECASE)

def ProcessSFX(lineID, line, emotion, sfx_data):
    line = line.replace('’', "'") #slay me
    lineIDoccurance = list(sfx_data.values()).count(lineID)
    lineNoPunct = line.replace(',', "").replace(':', "").replace('-', " ").replace(".", "").replace("(", "").replace(")", "")
    words = lineNoPunct.split()
    uppercase_words = [word for word in words if word.isupper() and word != "I" and word != "A" and word != "O"]

    #?! Permutations
    if is_only_question_or_exclamation(line):
        if lineIDoccurance < 3:
            sfx_data[lineID] = {
                "Alignment": "0",
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
                    "Alignment": word.lower().replace("?", "").replace("!", ""),
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
            "Alignment": first_word.lower().replace("?", "").replace("!", ""),
            "SFX": "sfx-huh"
        }
    elif '“' in line and not '?' in line:
        start_index = line.index('“')
        end_index = line.index('”')
        substring = line[start_index+1:end_index]
        first_word = substring.split()[0]   
        sfx_data[lineID] = {
            "Alignment": first_word.lower().replace("?", "").replace("!", ""),
            "SFX": "sfx-lightbulb"
        }

    # Ellipses Support
    pattern = r"\.{3}\s+(\w+)"
    matches = re.findall(pattern, lineNoPunct)
    if matches and '--' in line:
        sfx_data[lineID] = {
            "Alignment": matches[0].lower().replace("?", "").replace("!", ""),
            "SFX": "sfx-huhlow"
        }
    if matches and '+' in line:
        sfx_data[lineID] = {
            "Alignment": matches[0].lower().replace("?", "").replace("!", ""),
            "SFX": "sfx-huhlow"
        }

    # Handle Uppercase
    for i, sfx_word in enumerate(uppercase_words[:3]):
        if i < 3:
            if '?' in line:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower().replace("?", "").replace("!", ""),
                    "SFX": 'sfx-huh'
                }
            elif '!' in line:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower().replace("?", "").replace("!", ""),
                    "SFX": 'sfx-hit1'
                }
            else:
                sfx_data[lineID] = {
                    "Alignment": sfx_word.lower().replace("?", "").replace("!", ""),
                    "SFX": 'sfx-damage'
                }

    # Interjection handling
    interjection = check_strings(core_interjections, line)

    if interjection:
        character = lineID.split("_")[-1]  # Get the character from the lineId
        sfx = interjection.upper().replace("!", ""   ) + "_" + character.upper().replace(" ", "_")
        sfx_data[lineID] = {
            "Alignment": "0",
            "SFX": sfx
        }

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

def count_lines_per_scene(file_path):
    scene_line_counts = {}
    with open(file_path, "r", encoding="utf8") as file:
        scene = None
        line_count = 0
        characters = ""

        for line in file:
            if "SCENE " in line:
                if scene is not None:
                    scene_line_counts[scene] = int(line_count)
                scene = int(line.split()[1])
                line_count = 0

            if "Characters: " in line:
                characters = line.strip()[line.index("Characters: ") + len("Characters: "):len(line) - 1].split(', ')

            for character in characters:
                if (character.upper().replace(" ", "").replace("	", "") + "\n" in line.replace(" ", "").replace("	", "")) or (character.upper() + " &" in line.strip()):
                    line_count+=1

        if scene is not None:
            scene_line_counts[scene] = int(line_count)

    return scene_line_counts

def get_mode_text(characters):
    return "COURTROOM" if "Judge" in characters else "INVESTIGATION"

if not len(sys.argv) > 1:
    print("Please specify script file as the first argument. TXT file must be UTF-8 encoded or else you will receive the error UnicodeEncodeError: 'charmap' codec can't encode character '\ufeff' in position 0: character maps to <undefined>.")
    exit()

if len(sys.argv) > 1 and sys.argv[1] in ["--help", "-h", "-?"]:
    print("")
    print("Usage:")
    print("    python script_to_markup_JSON.py \"Script Path here\" --check")
    print("")
    print("Options:")
    print("    --help, -h, -?  Display this help message")
    print("")
    print("Description:")
    print("    A Python script that generates both the audio engineer markup and the scene generation files for an")
    print("episode of Elements of Justice. Before using this tool, please verify that the data within the script is")
    print("correct. You will need to manually check that all specified characters under the scene header are declared")
    print("exactly as their names are written in speakertags. So if 'Phoenix Wright' is listed as a character but he")
    print("is called 'Phoenix' by the script, it won't work.")
    print("")
    print("Please verify that all typewriter data is formatted the following way:")
    print("     Date {EN DASH} Time {EN DASH} Location: February 21 {HYPHEN} 12:35 PM {HYPHEN} Location {EN DASH} Sublocation")
    print("")
    print("For emotionEngine, this Python script invokes a multidimensional sentiment analysis that is time-expensive.")
    print("For the sake of your time, please generate the data first with the '--check' argument, which will default")
    print("all emotions to thinking, allowing you to quickly review the data before re-generating for the correct")
    print("emotions.")
    print("")
    sys.exit()

try:
    file = open(sys.argv[1], "r")

except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()

check = False
dialogue_data = {}
sfx_data = {}
intro_data = {}
label_data = {}
scenes_data = {}
to_write = ""

if len(sys.argv) > 2 and sys.argv[2] == "--check":
    check = True

with open(sys.argv[1], "r", encoding="utf8") as file:
    lines = file.readlines()
    scenes = [int(line.split()[1]) for line in lines if line.startswith("SCENE")]
    highest_scene_number = max(scenes)

scene_line_counts = count_lines_per_scene(sys.argv[1])

with open(sys.argv[1], "r", encoding="utf8") as file:
    cur_voice_line = 1
    scene = 1
    characters = []

    for line in file:
        new_line = line.strip()

        if "SCENE " in line:
            if scene != 1:
                # Close the progress bar for the previous scene
                progress_bar.close()

                # Write the scene data to a JSON file
                output_data = {
                    "Dialogue": scenes_data[scene]["Dialogue"],
                    "SFX": scenes_data[scene]["SFX"],
                    "Typewriter": scenes_data[scene]["Typewriter"],
                    "DataLabels": scenes_data[scene]["DataLabels"]
                }
                
                output_file_path = sys.argv[1].replace(".txt", f"_Scene_{scene}_output.json")
                with open(output_file_path, "w", encoding="utf-8") as json_file:
                    json.dump(output_data, json_file, indent=4, ensure_ascii=False)

            scene = int(line.split()[1])

            # Extract the episode number from the file name
            episode_number = sys.argv[1].split()[3].split(".")[0]

            # Split the episode number into parts (assuming it's always in the format "3-3")
            episode_parts = episode_number.split("-")
            episode_text = " ".join(sys.argv[1].split()[0:3]) + f" ({episode_parts[0]}-{episode_parts[1]})"

            scenes_data[scene] = {
                "Dialogue": {},
                "SFX": {},
                "Typewriter": {},
                "DataLabels": {
                    "EpisodeText": episode_text,
                    "SceneText": f"SCENE {scene}",
                    "ModeText": get_mode_text(characters)
                }
            }
            characters = []
            cur_voice_line = 1

            # Update total_iterations for the current scene
            progress_bar = tqdm(total=scene_line_counts[scene], position=0, leave=True)
            progress_bar.set_description(f"Processing Scene {scene}")
            continue

        elif "Characters: " in line:
            characters = line.strip()[line.index("Characters: ") + len("Characters: "):len(line) - 1].split(', ')
            continue

        for character in characters:
            if (character.upper().replace(" ", "").replace("	", "") + "\n" in line.replace(" ", "").replace("	", "")) or (character.upper() + " &" in line.strip()):
                speaker_key = f"s{scene}_{cur_voice_line:03d}_{character.lower()}"
                if speaker_key not in scenes_data[scene]["Dialogue"]:
                    progress_bar.set_description(f"Processing {speaker_key}...")

                    next_line = file.readline()
                    new_line = speaker_key + "\n" + next_line

                    LineText = remove_square_brackets(next_line).strip()
                    LineText = LineText.replace("  ", " ")

                    # Intelligent NLP packages are time-expensive. Being dumb is better here.

                    # This is not pure UK-US, some UK exceptions are preffered because English is demonstrably stupid
                    LineText = replace_case_insensitive(LineText, "honour", "honor")
                    LineText = replace_case_insensitive(LineText, "colour", "color")
                    LineText = replace_case_insensitive(LineText, "favourite", "favorite")
                    LineText = replace_case_insensitive(LineText, "organise", "organize")
                    LineText = replace_case_insensitive(LineText, "analyse", "analyze")
                    LineText = replace_case_insensitive(LineText, "fulfil", "fulfill")
                    LineText = replace_case_insensitive(LineText, "grey", "gray")
                    LineText = replace_case_insensitive(LineText, "judgment", "judgement")

                    # Get the actual emotion or fake it if we just wanna check data
                    if check:
                        Emotion = "C"
                    else:
                        Emotion = returnEmotion(LeXmo.LeXmo(LineText), LineText)

                    ProcessSFX(speaker_key, LineText, Emotion, scenes_data[scene]["SFX"])

                    for interjection in core_interjections:
                        if interjection in LineText:
                            LineText = LineText.replace(interjection + " ", "")

                    scenes_data[scene]["Dialogue"][speaker_key] = {
                        "CharacterName": character,
                        "LineText": LineText,
                        "Emotion": Emotion
                    }
                cur_voice_line += 1
                progress_bar.update(1)
                break

        # "This isn't working! Why isn't it working?!"
        # Answer, the writers may have forgotten this new, very specific formatting scheme.
        # Date {EN DASH} Time {EN DASH} Location: February 21 {HYPHEN} 12:35 PM {HYPHEN} Manehattan {EN DASH} Secretariat Race Course
        # HYPHEN -
        # EN DASH –
        if "Date – Time – Location:" in line:
            intro_data = {}
            date, time, location = line.split("-")
            intro_data["Time"] = date.strip().replace("Date – Time – Location: ", "") + " - " + time.strip()
            intro_data["Location"] = location.strip()
            scenes_data[scene]["Typewriter"] = intro_data

        to_write+=new_line.strip().replace("	", "") + "\n"

# Close the progress bar for the last scene
progress_bar.close()

dest_file = codecs.open(sys.argv[1].replace(".txt", "_ae_markup.txt"), "w", "utf-8")
dest_file.write(to_write)

# Write all scene data to JSON files
for scene_num, data in scenes_data.items():
    output_data = {
        "Dialogue": data["Dialogue"],
        "SFX": data["SFX"],
        "Typewriter": data["Typewriter"],
        "DataLabels": data["DataLabels"]
    }
    output_file_path = sys.argv[1].replace(".txt", f"_Scene_{scene_num}_output.json")
    with open(output_file_path, "w", encoding="utf-8") as json_file:
        json.dump(output_data, json_file, indent=4, ensure_ascii=False)

print("JSON generation completed successfully.")