@echo off
echo WARNING: THIS MUST BE RUN IN THE MINICONDA ALIGNER VENV!!
mfa adapt --clean model english_us_arpa english_us_arpa TextGrid_files --beam 100 --retry_beam 400
python parse_textGrid.py TextGrid_files output
echo Finished. Config files are in the output folder.
pause