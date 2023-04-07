@echo off
mkdir TextGrid_files
call conda activate aligner
echo Conda environment activated.
set /p model_folder="Enter the name of the folder that contains character-name folders that contain voice lines and their transcripts: "
mfa adapt --clean %model_folder% english_us_arpa english_us_arpa TextGrid_files --beam 100 --retry_beam 400
mkdir output
python parse_textGrid.py TextGrid_files output
call conda deactivate
echo Finished. Config files are in the output folder.
pause