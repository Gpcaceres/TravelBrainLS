# 📄 Documentación SQAP - TravelBrain

Este directorio contiene los informes académicos del Plan de Aseguramiento de la Calidad (SQAP) para el sistema TravelBrain.

## ✅ Correcciones Aplicadas

### Problemas Resueltos
1. ✅ **Definición de lenguaje JavaScript** agregada al preámbulo de ambos documentos
2. ✅ **URLs protegidas** con comando `\url{}` en tablas  
3. ✅ **Comillas tipográficas** reemplazadas por comillas ASCII estándar (`"` en lugar de `""`)
4. ✅ **Logo integrado** correctamente desde `img/ESPE.png`

### Errores Corregidos
- ❌ ~~Package Listings Error: Couldn't load requested language~~ → ✅ JavaScript definido
- ❌ ~~Runaway argument / Extra alignment tab~~ → ✅ Comillas tipográficas eliminadas  
- ❌ ~~Missing } inserted / Misplaced \cr~~ → ✅ Caracteres especiales corregidos
- ⚠️  Biblatex warning (volume+number) → No crítico, PDF se genera correctamente

## 📋 Documentos Incluidos

### Informe 1: Plan Maestro de Pruebas, Metodología SCRUM y Herramientas
- **Archivo:** `Informe1_Plan_SQAP_TravelBrain.tex`
- **Contenido:**
  - Metodología SCRUM aplicada al proyecto
  - Plan de Aseguramiento de Calidad (SQAP)
  - Stack tecnológico de pruebas (Cypress, Jest, Postman, OWASP ZAP)
  - Gestión de riesgos
  - Cronograma del Sprint de 3 semanas
  - Criterios de entrada y salida

### Informe 2: Diseño de Casos de Prueba y Matrices de Rastreabilidad
- **Archivo:** `Informe2_Diseno_Pruebas_TravelBrain.tex`
- **Contenido:**
  - Requisitos funcionales completos
  - Matriz de rastreabilidad (Requisitos ↔ Casos de Prueba)
  - 87 casos de prueba diseñados (Unitarias, Integración, E2E, Seguridad)
  - Scripts automatizados (Jest, Cypress, Postman)
  - Plantilla de reporte de defectos
  - Métricas de cobertura

## 🔧 Requisitos para Compilación

### Opción 1: Overleaf (Recomendado)
1. Crear cuenta en [Overleaf](https://www.overleaf.com/)
2. Subir los archivos `.tex` al proyecto
3. Compilar automáticamente

### Opción 2: LaTeX Local

#### Windows
Instalar MiKTeX:
```powershell
# Descargar e instalar desde https://miktex.org/download
winget install MiKTeX.MiKTeX
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install texlive-full texlive-lang-spanish
sudo apt-get install texlive-bibtex-extra biber
```

#### macOS
```bash
brew install --cask mactex
```

## 📝 Compilación de los Documentos

### Método Rápido: Scripts Automatizados (Recomendado)

#### Windows
```powershell
cd docs
.\compilar.bat
```

#### Linux/macOS
```bash
cd docs
chmod +x compilar.sh
./compilar.sh
```

Estos scripts:
- ✅ Verifican que pdflatex y biber estén instalados
- ✅ Compilan ambos informes automáticamente
- ✅ Generan los PDFs finales
- ✅ Ofrecen limpiar archivos temporales

### Método 1: pdflatex + biber (Manual)

```bash
# Compilar Informe 1
cd docs
pdflatex Informe1_Plan_SQAP_TravelBrain.tex
biber Informe1_Plan_SQAP_TravelBrain
pdflatex Informe1_Plan_SQAP_TravelBrain.tex
pdflatex Informe1_Plan_SQAP_TravelBrain.tex

# Compilar Informe 2
pdflatex Informe2_Diseno_Pruebas_TravelBrain.tex
biber Informe2_Diseno_Pruebas_TravelBrain
pdflatex Informe2_Diseno_Pruebas_TravelBrain.tex
pdflatex Informe2_Diseno_Pruebas_TravelBrain.tex
```

**¿Por qué 3 veces?**
1. Primera compilación: Genera índices y referencias
2. Segunda compilación: Resuelve referencias cruzadas
3. Tercera compilación: Finaliza numeración y TOC

### Método 2: latexmk (Automatizado)

```bash
# Compilar Informe 1
latexmk -pdf -bibtex Informe1_Plan_SQAP_TravelBrain.tex

# Compilar Informe 2
latexmk -pdf -bibtex Informe2_Diseno_Pruebas_TravelBrain.tex
```

### Método 3: VS Code + LaTeX Workshop

1. Instalar extensión: **LaTeX Workshop** by James Yu
2. Abrir archivo `.tex`
3. Presionar `Ctrl+Alt+B` o usar botón "Build LaTeX project"

## 📦 Archivos Generados

Después de compilar, se generarán:
- ✅ `Informe1_Plan_SQAP_TravelBrain.pdf`
- ✅ `Informe2_Diseno_Pruebas_TravelBrain.pdf`
- `*.aux`, `*.log`, `*.toc`, `*.out` (archivos temporales)

## 🖼️ Requisitos de Imágenes

### Logo ESPE
Los documentos requieren un logo de la universidad:
- **Archivo esperado:** `logo_espe.png`
- **Ubicación:** Mismo directorio que los `.tex`
- **Dimensiones recomendadas:** 500x500 px (formato PNG con transparencia)

**Si no tienes el logo:**
```latex
% Comentar esta línea en ambos documentos:
% \includegraphics[width=0.3\textwidth]{logo_espe.png}
```

## 🎨 Personalización

### Cambiar Colores
```latex
% En el preámbulo de cada documento
\definecolor{primarycolor}{RGB}{17, 175, 47}  % Verde TravelBrain
```

### Agregar Más Casos de Prueba
Editar sección correspondiente en `Informe2_Diseno_Pruebas_TravelBrain.tex`:
```latex
\subsubsection{TC-XXX-YYY: Nombre del Caso}

\begin{table}[H]
...
\end{table}
```

## 📚 Referencias Bibliográficas

Las referencias están incluidas inline en cada documento usando formato IEEE:
- IEEE 829 (Estándar de documentación de pruebas)
- ISO/IEC/IEEE 29119 (Estándar de pruebas de software)
- Pressman (Ingeniería de Software)
- Schwaber & Sutherland (Scrum Guide)

## 🐛 Solución de Problemas

### Error: "File not found: logo_espe.png"
**Solución:** Comentar línea de imagen o agregar archivo PNG

### Error: "Undefined control sequence \printbibliography"
**Solución:** Instalar paquete biblatex:
```bash
# MiKTeX
mpm --install=biblatex

# Linux
sudo apt-get install texlive-bibtex-extra
```
### Warning: "Macro 'volume+number' undefined" (biblatex-ieee)
**Solución:** Este warning es normal con biblatex-ieee y no impide la compilación. El PDF se generará correctamente. Para eliminarlo:
```bash
# Actualizar paquetes LaTeX
# Windows (MiKTeX Console)
mpm --update-all

# Linux
sudo tlmgr update --all

# O simplemente ignorar el warning (no afecta el resultado)
```

### Error: "Package Listings Error: Couldn't load requested language"
**Solución:** Ya está corregido. Los archivos incluyen definiciones de JavaScript y JSON en el preámbulo.

### Error: "File img/ESPE.png not found"
**Solución:**
```bash
# Verificar que el logo existe en la ruta correcta
ls docs/img/ESPE.png

# Si no existe, crear carpeta y colocar el logo
mkdir -p docs/img
```
### Error: "Package babel Error: Unknown option 'spanish'"
**Solución:** Instalar paquetes de idioma español:
```bash
sudo apt-get install texlive-lang-spanish
```

### Compilación muy lenta
**Solución:** Usar `pdflatex -interaction=nonstopmode` para modo batch

## 📊 Estructura de los Documentos

### Informe 1 (Plan Maestro)
```
1. Introducción
2. Metodología SCRUM
   - Roles y responsabilidades
   - Sprint de 3 semanas
   - Gestión con Trello
3. Plan de Aseguramiento de Calidad
   - Alcance
   - Estrategia de pruebas
   - Criterios de entrada/salida
4. Stack Tecnológico
   - Cypress, Jest, Postman, OWASP ZAP
   - Configuraciones
5. Gestión de Riesgos
6. Recursos y Cronograma
7. Métricas de Calidad
```

### Informe 2 (Diseño de Pruebas)
```
1. Requisitos Funcionales
2. Matriz de Rastreabilidad
3. Casos de Prueba Unitarias (Jest)
4. Casos de Prueba de Integración (Postman)
5. Casos de Prueba E2E (Cypress)
6. Casos de Prueba de Seguridad (OWASP ZAP)
7. Matriz Resumen (87 casos)
8. Plantilla de Reporte de Defectos
9. Métricas de Cobertura
```

## 📄 Formato de Entrega

### Para Entrega Académica
1. Compilar ambos PDFs
2. Verificar portadas con información correcta
3. Revisar numeración y tabla de contenidos
4. Exportar a PDF/A (archivo permanente):
   ```bash
   gs -dPDFA -dBATCH -dNOPAUSE -sProcessColorModel=DeviceCMYK \
      -sDEVICE=pdfwrite -dPDFACompatibilityPolicy=1 \
      -sOutputFile=Informe1_PDFA.pdf Informe1_Plan_SQAP_TravelBrain.pdf
   ```

### Información de Portada
- **Universidad:** Universidad de las Fuerzas Armadas ESPE
- **Departamento:** Ciencias de la Computación
- **NRC:** 27886
- **Asignatura:** Aseguramiento de la Calidad del Software
- **Estudiantes:** Cáceres Germán, Anthony Villareal
- **Docente:** Ing. Diego Gamboa, Mgs.
- **Fecha:** 21 de enero de 2026

## 🔄 Actualización de Documentos

Si necesitas actualizar contenido:
1. Editar archivo `.tex` correspondiente
2. Recompilar con `pdflatex + biber` (3 veces)
3. Verificar cambios en PDF generado

## 📧 Contacto

Para dudas sobre estos documentos:
- **Scrum Master:** Cáceres Germán
- **Development Team:** Anthony Villareal
- **Product Owner:** Ing. Diego Gamboa

---

**Nota:** Estos documentos fueron generados para cumplir con los objetivos del proyecto final de Aseguramiento de la Calidad del Software, demostrando capacidad de planificación, documentación y diseño de pruebas siguiendo estándares IEEE 829 e ISO/IEC/IEEE 29119.
