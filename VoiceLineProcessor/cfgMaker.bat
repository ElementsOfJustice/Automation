@echo off
echo WARNING: THIS MUST BE RUN IN THE MINICONDA ALIGNER VENV!!
mfa align --clean model english_us_arpa english_us_arpa TextGrid_files
python parse_textGrid.py
echo Finished. Config files are in the output folder.
pause