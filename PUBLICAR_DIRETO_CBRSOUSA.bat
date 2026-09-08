@echo off
chcp 65001 >nul
title Publicando BibliaAI CBR no GitHub de cbrsousa...
cls
echo ============================================================
echo      PUBLICANDO BIBLIA-AI STUDIO CBR -> GITHUB PAGES
echo ============================================================
echo.
cd /d "C:\Users\SARMENTO-MT5\BibliaAI_CBR_PWA"

if not exist ".git" (
    git init
)

git config user.name "cbrsousa"
git config user.email "cbrsousa@users.noreply.github.com"

echo [1/3] Adicionando arquivos...
git add .
git commit -m "Publicacao do PWA BibliaAI Studio CBR"

echo [2/3] Configurando branch principal...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/cbrsousa/biblia-cbr.git

echo [3/3] Enviando para o GitHub...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ============================================================
    echo [ERRO] O repositorio ainda nao foi criado na sua conta do GitHub!
    echo Certifique-se de clicar em 'Create repository' na pagina aberta
    echo e execute este script novamente.
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo [SUCESSO!] ARQUIVOS ENVIADOS COM EXITO PARA O GITHUB!
    echo ============================================================
    echo.
    echo Abrindo a pagina de configuracao do Pages no seu navegador...
    start "" "https://github.com/cbrsousa/biblia-cbr/settings/pages"
)
echo.
pause