@echo off
title Grand Hotel - Backend
cd /d "%~dp0"
if not exist mvnw.cmd cd ..
if not exist mvnw.cmd (
    echo Erro: mvnw.cmd nao encontrado. Execute este script na pasta do projeto (hotel-api-main).
    pause
    exit /b 1
)
echo Iniciando backend (perfil cloud - Supabase)...
call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=cloud"
pause
