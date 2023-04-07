@echo off

setlocal

echo Activating Conda environment...

::set "conda_dir=%USERPROFILE%\Miniconda3"
::set "env_name=aligner"

::call "%conda_dir%\Scripts\activate.bat" "%conda_dir%\envs\%env_name%"

call conda activate aligner

echo Conda environment activated.

set /p markup_file="Enter the name of the markup file: "
mkdir Transcripts
set "output_folder=Transcripts"

echo Running parse_markup.py...

python "%~dp0\parse_markup.py" "%markup_file%" "%output_folder%"

echo parse_markup.py completed.

echo Deactivating Conda environment...

call conda deactivate

echo Conda environment deactivated.

echo Finished. Transcripts are in the Transcripts folder. You need to merge these with the voice line audio files (dragging and dropping the folders will work).

endlocal

pause
