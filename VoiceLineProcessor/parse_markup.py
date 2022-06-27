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
    is_voice_line = False   
    for line in file:
        if is_voice_line:
            # strip character voiceine filename, standardize apostrophes, lowercase everything
            new_line = re.sub(r"s\d_\d{3}_", r"", line.rstrip()).rstrip().replace("’", "'").lower()
            # strip line of all characters in square brackets []
            new_line = re.sub(r"\[.*\] ", r"", new_line)
            # get rid of punctuation with space after
            new_line = re.sub(r"[^a-zA-z-' \d:] ", r" ", new_line)
            # get rid of punctuation without space
            new_line = re.sub(r"[^a-zA-z-'’ \d:]", r" ", new_line)
            # remove stuttering
            new_line = re.sub(r"(.)-\1", r"\1", new_line)
            if not os.path.exists(sys.argv[2]):
                os.makedirs(sys.argv[2])
            if len(new_line.rstrip()) > 0:
                dest_file = open(sys.argv[2] + "/" + filename, "w")
                dest_file.write(new_line.rstrip())
                dest_file.close()

            is_voice_line = False
        elif re.match(r"^s\d*_", line.rstrip()):
            filename = str(line.strip() + ".txt")
            is_voice_line = True
