@echo off
REM Script para crear usuario administrador
REM Uso: setup-admin.bat [email] [password]

set EMAIL=%1
set PASSWORD=%2

if "%EMAIL%"=="" set EMAIL=admin@travelbrain.com
if "%PASSWORD%"=="" set PASSWORD=Admin123!

echo 🚀 Configurando usuario administrador...
echo.

cd /d "%~dp0\.."

node scripts\setup-admin.js %EMAIL% %PASSWORD%

pause
