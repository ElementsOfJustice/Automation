# VoiceLineProcessor
The pipeline to translate the voice lines into keyframes for extremely accurate lipsyncing.

Steps:

0. Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) and [Montreal Forced Aligner](https://montreal-forced-aligner.readthedocs.io/en/latest/installation.html) (installed through Miniconda, use the "All Platforms" method). Set up MFA so that you can use it with English (the model and dictionary should both be english_us_arpa).
1. Create the following folders in this directory (VoiceLineProcessor)  : "model", "output", "speechrecognition_output", "TextGrid_files", and "voice_lines"
2. If you already have transcriptions for the voice lines, go to Step 4. In any case, cd to the VoiceLineProcessor directory in the Conda terminal (copy and paste the directory from Explorer for the command "cd \<path>")
3. There are three options for getting transcripts of voice lines, in order of decreasing favorability. The first method is to use parse_markup.py on the script markup; place the markup in this directory and run the command "python parse_markup.py \<markup file name> \<output folder name>" in the Conda terminal. The second method is transcription via speech recognition. If you want the voicelines automatically transcribed, place ONLY THE VOICE LINE AUDIO FILES (supports .FLAC and .WAV only) in voice_lines and run "python transcribe_voice_lines.py" from the Conda terminal (requires the SpeechRecognition library, run "python -m pip install SpeechRecognition" to install). The third method is manual transcription. If you want to manually transcribe them, put the voice lines in voice_lines and run "python transcribe_voice_lines_manual.py" from the Conda terminal.
4. Place the voice lines and the transcriptions into the model folder.
5. run cfgMaker.bat from the MiniConda aligner venv (use the "conda activate aligner" command to get into the venv). The cfg files are now in the output file, ready for use in Animate.
