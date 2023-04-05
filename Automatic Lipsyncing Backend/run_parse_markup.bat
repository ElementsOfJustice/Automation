@echo off

setlocal

echo Activating Conda environment...

set "conda_dir=%USERPROFILE%\Miniconda3"
set "env_name=aligner"

call "%conda_dir%\Scripts\activate.bat" "%conda_dir%\envs\%env_name%"

echo Conda environment activated.

set /p markup_file="Enter the name of the markup file: "
set "output_folder=model"

echo Running parse_markup.py...

python "%~dp0\parse_markup.py" "%markup_file%" "%output_folder%"

echo parse_markup.py completed.

echo Deactivating Conda environment...

call "%conda_dir%\condabin\conda.bat" deactivate

echo Conda environment deactivated.

echo Batch file completed successfully!

endlocal

pause
