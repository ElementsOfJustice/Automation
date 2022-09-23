import sys
import re
import os
if not len(sys.argv) > 1:
    print("Please specify script file as the first argument.")
    exit()
if not len(sys.argv) > 2:
    print("Please specify the output file")
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
    for line in file:
        new_line = line
        is_dialogue_line = False
        if "SCENE " in line:
            scene = int(line[line.index("SCENE ") + len("SCENE "):len(line) - 1])
            characters = [] # reset characters for new scene, probably redundant
            cur_voice_line = 1 # reset voice line count
        if "Characters: " in line:
            # get characters of a scene
            characters = line[line.index("Characters: ") + len("Characters: "):len(line) - 1].split(', ')
        for character in characters:
            if (character.upper()+"\n" in line) or (character.upper() + " &" in line):
                is_dialogue_line = True
                new_line = new_line.replace(character.upper(), "s"+str(scene)+"_"+str(cur_voice_line).zfill(3)+"_"+character.lower())
        if is_dialogue_line:
            cur_voice_line+=1
        to_write+=new_line
    try:
        dest_file = open(sys.argv[2], "w")
    except:
        print("Invalid destination file, abort.")
        exit()
    dest_file.write(to_write)
    dest_file.close()