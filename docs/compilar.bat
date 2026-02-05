@echo off
REM ============================================================
REM Script de compilación para los informes SQAP TravelBrain
REM Sistema Operativo: Windows
REM ============================================================

echo.
echo ========================================
echo   COMPILACION INFORMES SQAP
echo   TravelBrain - ESPE 2026
echo ========================================
echo.

REM Verificar que pdflatex está instalado
where pdflatex >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pdflatex no encontrado. Instalar MiKTeX primero.
    echo Descargar desde: https://miktex.org/download
    pause
    exit /b 1
)

REM Verificar que biber está instalado
where biber >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] biber no encontrado. Instalar con MiKTeX Package Manager.
    pause
    exit /b 1
)

REM Compilar Informe 1
echo [1/2] Compilando Informe 1: Plan SQAP...
echo.
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en primera compilacion de Informe 1
    echo Revisar archivo: Informe1_Plan_SQAP_TravelBrain.log
    pause
    exit /b 1
)

biber Informe1_Plan_SQAP_TravelBrain
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex

if exist "Informe1_Plan_SQAP_TravelBrain.pdf" (
    echo [OK] Informe 1 generado exitosamente
) else (
    echo [ERROR] No se genero Informe1_Plan_SQAP_TravelBrain.pdf
    pause
    exit /b 1
)

echo.
echo ----------------------------------------
echo.

REM Compilar Informe 2
echo [2/2] Compilando Informe 2: Diseno de Pruebas...
echo.
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en primera compilacion de Informe 2
    echo Revisar archivo: Informe2_Diseno_Pruebas_TravelBrain.log
    pause
    exit /b 1
)

biber Informe2_Diseno_Pruebas_TravelBrain
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex

if exist "Informe2_Diseno_Pruebas_TravelBrain.pdf" (
    echo [OK] Informe 2 generado exitosamente
) else (
    echo [ERROR] No se genero Informe2_Diseno_Pruebas_TravelBrain.pdf
    pause
    exit /b 1
)

echo.
echo ========================================
echo   COMPILACION COMPLETADA
echo ========================================
echo.
echo PDFs generados:
echo   - Informe1_Plan_SQAP_TravelBrain.pdf
echo   - Informe2_Diseno_Pruebas_TravelBrain.pdf
echo.

REM Limpiar archivos temporales (opcional)
echo Desea limpiar archivos temporales? (S/N)
set /p CLEAN=
if /i "%CLEAN%"=="S" (
    echo Limpiando archivos temporales...
    del *.aux *.log *.out *.toc *.bbl *.bcf *.blg *.run.xml 2>nul
    echo Limpieza completada.
)

echo.
echo Presione cualquier tecla para salir...
pause >nul
