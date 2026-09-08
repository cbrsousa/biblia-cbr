@echo off
chcp 65001 >nul
title Publicador Automatico - BibliaAI CBR no GitHub Pages
cls
echo ============================================================
echo      BIBLIA-AI STUDIO CBR - PUBLICADOR PARA GITHUB PAGES
echo ============================================================
echo.
echo Este assistente vai subir seu aplicativo automaticamente para
echo o GitHub Pages para que qualquer pessoa na sua igreja possa
echo abrir no celular ou computador com um link na internet.
echo.
echo ============================================================
echo PASSO UNICO:
echo.
echo 1. Va no seu navegador em: https://github.com/new
echo 2. Crie um repositorio publico (ex: biblia-cbr)
echo 3. Copie o link HTTPS do repositorio (ex: https://github.com/SEU-USUARIO/biblia-cbr.git)
echo ============================================================
echo.
set /p repo_url="Cole o link do seu repositorio GitHub aqui: "

if "%repo_url%"=="" (
    echo.
    echo [ERRO] O link do repositorio nao pode ficar vazio.
    pause
    exit /b
)

echo.
echo [1/4] Inicializando repositorio Git local...
cd /d "C:\Users\SARMENTO-MT5\BibliaAI_CBR_PWA"

if not exist ".git" (
    git init
)

git config user.name "BibliaAI CBR"
git config user.email "contato@cbr.local"

echo [2/4] Preparando arquivos do aplicativo PWA...
git add .
git commit -m "Publicacao do aplicativo BibliaAI Studio CBR"

echo [3/4] Conectando com seu GitHub...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %repo_url%

echo [4/4] Enviando arquivos para o GitHub...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ============================================================
    echo [AVISO] Se o GitHub pediu login, autorize na janela do navegador.
    echo Se ja autorizou e deu erro, tente novamente.
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo [SUCESSO!] ARQUIVOS ENVIADOS COM EXITO!
    echo ============================================================
    echo.
    echo AGORA BASTA ATIVAR O LINK NO GITHUB (LEVA 10 SEGUNDOS):
    echo 1. Abra o seu repositorio no GitHub.
    echo 2. Clique na aba 'Settings' (Configuracoes).
    echo 3. Clique em 'Pages' no menu lateral esquerdo.
    echo 4. Em 'Branch', escolha 'main' e clique em 'Save'.
    echo.
    echo Pronto! O link da sua igreja estara no ar!
    echo ============================================================
)

echo.
pause