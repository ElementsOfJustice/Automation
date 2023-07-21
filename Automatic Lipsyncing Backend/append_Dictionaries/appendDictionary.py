import g2p_en
import string
import codecs
import sys
import os

def nonsense_to_arpabet(nonsense):
    g2p = g2p_en.G2p()
    arpabet_transcription = g2p(nonsense)
    return arpabet_transcription

def remove_punctuation(input_string):
    translator = str.maketrans("", "", string.punctuation)
    result = input_string.translate(translator)

    return result

def array_to_spaced_string(arr):
    return " ".join(str(element) for element in arr)

def fix_formatting(text):
    # Manual replacement ahahaha
    text = text.replace("-", " ")
    text = text.replace("—", " ")
    text = text.replace('“', " ")
    text = text.replace('”', " ")
    text = text.replace('…', " ")
    text = text.replace('‘', "'")
    text = text.replace('’', "'")

    text = remove_punctuation(text)

    return text.upper()

def get_words_not_in_file2(file1_path, file2_path):

    with open(file1_path, 'r', encoding="utf8") as file1:
        words_file1 = set(fix_formatting(file1.read()).split())

    with open(file2_path, 'r', encoding="utf8") as file2:
        words_file2 = set(fix_formatting(file2.read()).split())

    # Find words that are in File1 but not in File2
    words_not_in_file2 = words_file1 - words_file2

    return words_not_in_file2

# Start Execution Here
if not len(sys.argv) == 4:
    print(len(sys.argv))
    print("Invalid number of arguments.")
    print("arg1: File path (relative will work) to the dictionary file to consider.")
    print("arg2: File path (relative will work) to the episode script you want to compare to the dictionary.")
    print("arg3: Acceptable parameters are 'append' or 'new' ")
    exit()

try:
    os.path.exists(sys.argv[1])
except:
    print("File does not exist: " + str(sys.argv[1]) + ".")
    exit()

try:
    os.path.exists(sys.argv[2])
except:
    print("File does not exist: " + str(sys.argv[2]) + ".")
    exit()

if sys.argv[3] == "append":
    dest_file = codecs.open(sys.argv[1], "a", "utf-8")
else:
    dest_file = codecs.open(sys.argv[1].replace(".dict", "_appendix.dict"), "w", "utf-8")

for element in sorted(get_words_not_in_file2(sys.argv[2], sys.argv[1])):
    dest_file.write(element + "\t" + array_to_spaced_string(nonsense_to_arpabet(element)) + "\n")
    print("{:<25} {:>3}".format(element, array_to_spaced_string(nonsense_to_arpabet(element))))

dest_file.close()