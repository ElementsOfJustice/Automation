import sys
import re
import os
if not len(sys.argv) > 1:
    print("Please specify markup file as the first argument.")
    exit()
if not len(sys.argv) > 2:
    print("Please specify the output folder")
    exit()
try:
    file = open(sys.argv[1], "r")
except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()
with open(sys.argv[1], "r", encoding="utf8") as file:
    filename = ""
    scene = 1
    is_voice_line = False
    speaker_name = ""
    for line in file:
        if is_voice_line:
            # remove interjections
            new_line = re.sub(r"TAKE THAT|OBJECTION|HOLD IT", "", line.strip())
            # strip character voiceine filename, standardize apostrophes, lowercase everything
            new_line = re.sub(r"s\d*_\d{3}_", r"", new_line.strip()).strip().replace("’", "'").lower()
            # strip line of all characters in square brackets []
            new_line = re.sub(r"\[.*\] ", r"", new_line)
            # strip line of all characters in angle brackets <>
            new_line = re.sub(r"\<.*\> ", r"", new_line)
            # get rid of punctuation with space after
            new_line = re.sub(r"[^a-zA-z-' \d:] ", r" ", new_line)
            # get rid of punctuation without space
            new_line = re.sub(r"[^a-zA-z-'’ \d:]", r" ", new_line)
            # remove stuttering
            new_line = re.sub(r"(.)-\1", r"\1", new_line)
            if not os.path.exists(sys.argv[2]):
                os.makedirs(sys.argv[2])
            if not os.path.exists(sys.argv[2] + "/" + "SCENE " + str(scene)):
                os.makedirs(sys.argv[2] + "/" + "SCENE " + str(scene))
            if not os.path.exists(sys.argv[2] + "/" + "SCENE " + str(scene) + "/" + speaker_name):
                os.makedirs(sys.argv[2] + "/" + "SCENE " + str(scene) + "/" + speaker_name)
            if len(new_line.strip()) > 0:
                dest_file = open(sys.argv[2] + "/" + "SCENE " + str(scene) + "/" + speaker_name + "/" +  filename, "w")
                dest_file.write(new_line.strip())
                dest_file.close()

            is_voice_line = False
        elif re.match(r"^s\d*_", line.strip()):
            filename = str(line.strip() + ".txt")
            scene = int(re.sub(r"s(\d*).*", r"\1", line.strip()).strip().replace("’", "'").lower())
            is_voice_line = True
            # get only first name of first speaker
            speaker_name = re.sub(r"s\d*_\d*_(.[^_ ,]*)_?.*", r"\1", line.strip()).strip().replace("’", "'").lower()
