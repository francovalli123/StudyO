@echo off
cd /d D:\StudyO\backend\studyo
call ..\env\Scripts\activate.bat
python manage.py clean_weekly_objectives
echo %date% %time% - Weekly objectives cleanup completed >> cleanup_log.txt