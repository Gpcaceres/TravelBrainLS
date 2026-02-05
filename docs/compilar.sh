#!/bin/bash
# ============================================================
# Script de compilación para los informes SQAP TravelBrain
# Sistema Operativo: Linux/macOS
# ============================================================

echo ""
echo "========================================"
echo "  COMPILACIÓN INFORMES SQAP"
echo "  TravelBrain - ESPE 2026"
echo "========================================"
echo ""

# Verificar que pdflatex está instalado
if ! command -v pdflatex &> /dev/null; then
    echo "[ERROR] pdflatex no encontrado."
    echo "Instalar con: sudo apt-get install texlive-full"
    exit 1
fi

# Verificar que biber está instalado
if ! command -v biber &> /dev/null; then
    echo "[ERROR] biber no encontrado."
    echo "Instalar con: sudo apt-get install biber"
    exit 1
fi

# Compilar Informe 1
echo "[1/2] Compilando Informe 1: Plan SQAP..."
echo ""
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo en primera compilación de Informe 1"
    echo "Revisar archivo: Informe1_Plan_SQAP_TravelBrain.log"
    exit 1
fi

biber Informe1_Plan_SQAP_TravelBrain
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex
pdflatex -interaction=nonstopmode Informe1_Plan_SQAP_TravelBrain.tex

if [ -f "Informe1_Plan_SQAP_TravelBrain.pdf" ]; then
    echo "[OK] Informe 1 generado exitosamente"
else
    echo "[ERROR] No se generó Informe1_Plan_SQAP_TravelBrain.pdf"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# Compilar Informe 2
echo "[2/2] Compilando Informe 2: Diseño de Pruebas..."
echo ""
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex
if [ $? -ne 0 ]; then
    echo "[ERROR] Fallo en primera compilación de Informe 2"
    echo "Revisar archivo: Informe2_Diseno_Pruebas_TravelBrain.log"
    exit 1
fi

biber Informe2_Diseno_Pruebas_TravelBrain
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex
pdflatex -interaction=nonstopmode Informe2_Diseno_Pruebas_TravelBrain.tex

if [ -f "Informe2_Diseno_Pruebas_TravelBrain.pdf" ]; then
    echo "[OK] Informe 2 generado exitosamente"
else
    echo "[ERROR] No se generó Informe2_Diseno_Pruebas_TravelBrain.pdf"
    exit 1
fi

echo ""
echo "========================================"
echo "  COMPILACIÓN COMPLETADA"
echo "========================================"
echo ""
echo "PDFs generados:"
echo "  - Informe1_Plan_SQAP_TravelBrain.pdf"
echo "  - Informe2_Diseno_Pruebas_TravelBrain.pdf"
echo ""

# Limpiar archivos temporales (opcional)
read -p "¿Desea limpiar archivos temporales? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Limpiando archivos temporales..."
    rm -f *.aux *.log *.out *.toc *.bbl *.bcf *.blg *.run.xml
    echo "Limpieza completada."
fi

echo ""
echo "Compilación finalizada."
