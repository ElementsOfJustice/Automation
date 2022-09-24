import sys
import re
import os

if not len(sys.argv) > 1:
    print("Please specify script file as the first argument. TXT file must be UTF-8 encoded or else you will receive the error UnicodeEncodeError: 'charmap' codec can't encode character '\ufeff' in position 0: character maps to <undefined>.")
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
    isSpeakingLine = False
    runFirst = True

    lineId = ""
    speaker = ""
    dialogue = ""
    pose = ""

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
                lineId = new_line.strip('\n')

        if isSpeakingLine: #gets dialogue line

            if line.startswith("["):
                pose = line[line.find('[')+1:line.find(']')]
            else:
                pose = "NONE"

            dialogue = re.sub(r"[\([{})\]]", "", line.strip('\n'))
            
            isSpeakingLine = False
            runFirst = False
    
        if is_dialogue_line: #this variable name is fucking terrible CONZOR!!! it actually checks if it's a SPEAKERTAG line!!!
            speaker = line.title()
            speaker = speaker.strip('\n')
            isSpeakingLine = True
            cur_voice_line+=1
            runFirst = True

        if not runFirst:
            print("dialogue" + " " + lineId + " "  + speaker + " "  + dialogue + " " + "(" + pose + ")")
            runFirst = True

        to_write+=new_line

    try:
        dest_file = open(sys.argv[2], "w")

    except:
        print("Invalid destination file, abort.")
        exit()

    dest_file.write(to_write)
    dest_file.close()