@echo off
cd /d "%~dp0"
python tools\serve.py --port 8765
pause
