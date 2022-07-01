"""
*******************************************************************************
PARSE TEXT GRID
Description: 
*******************************************************************************
"""

import textgrid
import os
import sys

"""
Function: writeParsedFile
Variables:  
	source [A string. The path of the source file.]
	destination [A string. The path of the destination file.]
Description: 
"""
def writeParsedFile(source, destination):
    tg = textgrid.TextGrid.fromFile(source)
    words = "var words = { \n"
    phonemes = "var phonemes = { \n"
    for j in tg[0]:
        words += str(j.minTime) + " : [" + str(j.maxTime) + \
            ",\"" + str(j.mark) + "\"], \n"
    words += "};"
    for j in tg[1]:
        phonemes += str(j.minTime) + " : [" + \
            str(j.maxTime) + ",\"" + str(j.mark) + "\"], \n"
    phonemes += "};"
    
    if not os.path.exists(str(destination)[:str(destination).rfind("/")]):
        os.makedirs(str(destination)[:str(destination).rfind("/")])
    f = open(destination, "w")
    f.write(words + "\n" + phonemes)
    f.close()

"""
>>>MAIN<<<
Description: 
"""
def main():
    if not len(sys.argv) > 1:
        print("Please specify input folder as the first argument.")
        exit()
    if not len(sys.argv) > 2:
        print("Please specify the output folder as the second argument")
        exit()
    directory_name = str(sys.argv[1])
    directory = os.fsencode(directory_name)

    # for each file in the directory...
    for folder in os.listdir(directory):
        foldername = os.fsdecode(folder)
        for file in os.listdir(os.fsencode(directory_name + "/" + foldername)):
            filename = os.fsdecode(file)
            writeParsedFile(directory_name + "/" + foldername + "/" + filename,
                            str(sys.argv[2]) + "/" +  foldername + "/" + filename.rsplit(".", 1 )[0] + ".cfg")


main()
