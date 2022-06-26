import os
directory_name = "voice_lines"
directory = os.fsencode(directory_name)

for file in os.listdir(directory): 
    filename = os.fsdecode(file)
    os.startfile(directory_name + "\\" + filename)
    text = input(filename + " transcript: ")
    while text=="REPLAY":
        os.startfile(directory_name + "\\" + filename)
        text = input(filename + " transcript: ")
    f = open("speechrecognition_output/" + filename.rsplit(".", 1 )[0] + ".txt", "w")
    f.write(text)
    f.close()