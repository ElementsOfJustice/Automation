"""
*******************************************************************************
TRANSCRIBE VOICE LINES
Description: Import a directory of voice line files and use the Google speech 
recognition API to transcribe each line into text.
*******************************************************************************
"""
import speech_recognition as sr
import os
import traceback
directory_name = "voice_lines"
directory = os.fsencode(directory_name)

for file in os.listdir(directory):
    filename = os.fsdecode(file)
    r = sr.Recognizer()
    with sr.AudioFile(directory_name + "/" + filename) as source:
        audio_text = r.listen(source)
    try:
       # using Google speech recognition API
        text = r.recognize_google(audio_text)
        f = open("speechrecognition_output/" + filename.rsplit(".", 1 )[0] + ".txt", "x")
        f.write(text)
        f.close()
    except:
        print('Transcription FAILED: ' + str(filename))
        f = open("speechrecognition_output/" + filename.rsplit(".", 1 )[0] + ".txt", "x")
        f.close()
