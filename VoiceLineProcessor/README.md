# VoiceLineProcessor
The pipeline to translate the voice lines into keyframes for extremely accurate lipsyncing.

Steps:
0. Install ["Miniconda"] (https://docs.conda.io/en/latest/miniconda.html) and ["Montreal Forced Aligner"] (https://montreal-forced-aligner.readthedocs.io/en/latest/installation.html) (installed through Miniconda). Set up MFA so that you can use it with English.
1. Create the following folders in this directory: "model", "output", "speechrecognition_output", "TextGrid_files", and "voice_lines"
2. If you already have transcriptions for the voice lines, go to Step 4
3. If you want the voicelines automatically transcribed, place ONLY THE VOICE LINE AUDIO FILES in voice_lines and run transcribe_voice_lines.py from the commmand line (requires the SpeechRecognition library). If you want to manually transcribe them (increases accuracy dramatically), put the voice lines in voice_lines and run transcribe_voice_lines_manual.py from the command line.
4. Place the voice lines and the transcriptions into the model folder.
5. run cfgMaker.bat from the MiniConda aligner venv. The cfg files are now in the output file, ready for use in Animate.
