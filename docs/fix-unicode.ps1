# Script para corregir caracteres Unicode invalidos
$filePath = "Informe2_Diseno_Pruebas_TravelBrain.tex"

# Leer como bytes y convertir a string
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Lista de reemplazos contextuales comunes
$replacements = @{
    't�cnicas' = 'técnicas'
    'dise�ados' = 'diseñados'
    'dise�adas' = 'diseñadas'
    'ejecuci�n' = 'ejecución'
    'a�n' = 'aún'
    'metodol�gica' = 'metodológica'
    'cr�ticas' = 'críticas'
    'dise�' = 'diseñ'
    'Dise�o' = 'Diseño'
    'integraci�n' = 'integración'
    'Integraci�n' = 'Integración'
    'funci�n' = 'función'
    'funci�' = 'funció'
    'protecci�n' = 'protección'
    'Protecci�n' = 'Protección'
    'autenticaci�n' = 'autenticación'
    'Autenticaci�n' = 'Autenticación'
    'validaci�n' = 'validación'
    'Validaci�n' = 'Validación'
    'extracci�n' = 'extracción'
    'Extracci�n' = 'Extracción'
    'v�lido' = 'válido'
    'v�lidos' = 'válidos'
    'v�lida' = 'válida'
    'v�lidas' = 'válidas'
    'inv�lido' = 'inválido'
    'inv�lidos' = 'inválidos'
    'inv�lida' = 'inválida'
    'M�todo' = 'Método'
    'm�todo' = 'método'
    'Cr�tica' = 'Crítica'
    'cr�tica' = 'crítica'
    'autom�ticamente' = 'automáticamente'
    'B�squeda' = 'Búsqueda'
    'b�squeda' = 'búsqueda'
    'estimaci�n' = 'estimación'
    'Estimaci�n' = 'Estimación'
    'priorizaci�n' = 'priorización'
    'Priorizaci�n' = 'Priorización'
    'Ejecuci�n' = 'Ejecución'
    'configuraci�n' = 'configuración'
    'Configuraci�n' = 'Configuración'
    'm�rgenes' = 'márgenes'
    'p�gina' = 'página'
    'c�digo' = 'código'
    'bibliograf�a' = 'bibliografía'
    'servir�n' = 'servirán'
    'gu�a' = 'guía'
}

foreach ($key in $replacements.Keys) {
    $text = $text.Replace($key, $replacements[$key])
}

# Guardar con UTF-8 sin BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $text, $utf8NoBom)

Write-Host "Correccion completada" -ForegroundColor Green
