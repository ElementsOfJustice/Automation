"""
*******************************************************************************
PARSE TEXT GRID
Description: 
*******************************************************************************
"""

import textgrid
import os

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
    f = open(destination, "x")
    f.write(words + "\n" + phonemes)
    f.close()

"""
>>>MAIN<<<
Description: 
"""
def main():
    directory_name = "TextGrid_files"
    directory = os.fsencode(directory_name)

    # for each file in the directory...
    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        try:
            writeParsedFile(directory_name + "/" + filename,
                           "output/" + filename.rsplit(".", 1 )[0] + ".cfg")
        except:
            print("fail")
            exit()


main()
