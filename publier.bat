@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo   Publication de BE-ESGIS sur GitHub
echo   (envoi en plusieurs petits paquets)
echo ==============================================
git config core.quotepath off
git config core.longpaths true
git config http.postBuffer 157286400
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
set ECHEC=

echo.
echo [1/3] Preparation (le gros commit refuse par GitHub est defait,
echo       vos fichiers restent intacts sur le disque)...
git fetch origin
if errorlevel 1 goto erreur
git reset -q --mixed origin/main
if errorlevel 1 goto erreur

echo.
echo [2/3] Envoi dossier par dossier...
git add -- .gitignore publier.bat README.md index.html l1.html l2.html l3.html logo.png assets outils
call :envoyer "index.html" "Site BE-ESGIS"
call :envoyer "ancienne-version" "Ancienne version du site"

for /d %%D in ("archiveL1\Epreuve_L1\*") do call :envoyer "%%D" "Epreuves L1 - %%~nxD"
call :envoyer "archiveL1\Epreuve_L1" "Epreuves L1"
for /d %%D in ("archiveL1\*") do call :envoyer "%%D" "Archives L1 - %%~nxD"
call :envoyer "archiveL1" "Archives L1"

for /d %%A in ("L1 - Mati*res") do (
    for /d %%D in ("%%A\*") do call :envoyer "%%D" "L1 - %%~nxD"
    call :envoyer "%%A" "L1 - fichiers isoles"
)

for /d %%D in ("Dossier L2IRT\*") do call :envoyer "%%D" "L2 - %%~nxD"
call :envoyer "Dossier L2IRT" "L2 - fichiers isoles"

for /d %%D in ("COURS ET EPREUVES L2\*") do call :envoyer "%%D" "Cours L2 - %%~nxD"
call :envoyer "COURS ET EPREUVES L2/[A-Ka-k]*" "Cours L2 (A-K)"
call :envoyer "COURS ET EPREUVES L2/[L-Zl-z]*" "Cours L2 (L-Z)"
call :envoyer "COURS ET EPREUVES L2" "Cours L2 (reste)"

echo.
echo [3/3] Derniers fichiers...
call :envoyer "." "Fichiers restants"

echo.
if defined ECHEC (
    echo Certains paquets n'ont pas pu etre envoyes. Relancez simplement publier.bat :
    echo seuls les paquets manquants seront renvoyes.
    pause
    exit /b 1
)
echo Termine ! Activez ensuite GitHub Pages : Settings ^> Pages ^> Branch "main" / root.
pause
exit /b 0

:envoyer
git add -- "%~1"
git diff --cached --quiet && goto pousser_si_besoin
echo.
echo --- %~2
git commit -q -m "%~2"
:pousser_si_besoin
git status -sb | findstr /c:"ahead" >nul || exit /b 0
git push -q origin main
if errorlevel 1 (
    echo     Nouvel essai dans 15 secondes...
    timeout /t 15 >nul
    git push -q origin main
    if errorlevel 1 (
        echo     ECHEC pour : %~2
        set ECHEC=1
    )
)
exit /b 0

:erreur
echo.
echo Une erreur est survenue. Copiez le message ci-dessus et envoyez-le a Claude.
pause
exit /b 1
