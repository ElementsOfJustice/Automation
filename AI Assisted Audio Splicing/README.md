# AI Assisted Audio Splicing

This folder contains a pipeline to automatically splice an audio file that contains instances of spoken phrases, as provided by a script. We accomplish this by using VOSK to transcribe the entire audio file into a haystack of words, and then use an algorithm to extract needles, or
the phrases that we want that exist inside the audio file, based on phonetic similarity and the BLEU algorithm.

This methodology has an 80% accuracy in most use cases, the remaining 20% of missed voice lines seem to be phrases that contain nonsense words not programmed into the VOSK model, like "Scootaloo" or "Zecora," or voice lines that are exceedingly short and for which it is difficult to gain
context for the surrounding words.

Command usage works thusly.

python vosk-pyachocorasick_v3.py sceneData.txt audioFile.wav --complexPrint

This technology is in-development. To run the code, create and use audio, text and model folders in this directory.

# Resources
* [VOSK Models](https://alphacephei.com/vosk/models)