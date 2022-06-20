import textgrid
import os


def writeParsedFile(source, destination):
    tg = textgrid.TextGrid.fromFile(source)
    words = "var words = [ \n"
    phonemes = "var phonemes = [ \n"
    for j in tg[0]:
        words += "[" + str(j.minTime) + "," + str(j.maxTime) + \
            ",\"" + str(j.mark) + "\"], \n"
    words += "];"
    for j in tg[1]:
        phonemes += "[" + str(j.minTime) + "," + \
            str(j.maxTime) + ",\"" + str(j.mark) + "\"], \n"
    phonemes += "];"
    f = open(destination, "x")
    f.write(words + "\n" + phonemes)
    f.close()


def main():
    directory_name = "TextGrid_files"
    directory = os.fsencode(directory_name)

    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        try:
            writeParsedFile(directory_name + "/" + filename,
                           "output/" + filename.rsplit(".", 1 )[0] + ".cfg")
        except:
            print("fail")
            exit()


main()
