@echo off

set "ps_dir=C:\Windows\System32\WindowsPowerShell\v1.0"

echo Adding %ps_dir% to PATH...

setx PATH "%ps_dir%;%PATH%" /M

echo Done.
pause