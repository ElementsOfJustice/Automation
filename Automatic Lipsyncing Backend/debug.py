import os
import sys
import re
directory_name = str(sys.argv[1])
directory = os.fsencode(directory_name)
print(os.listdir(os.fsencode(directory_name + "/" + foldername)))