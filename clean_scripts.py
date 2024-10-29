import os
import re
from bs4 import BeautifulSoup

# Ruta a la carpeta donde guardaste los guiones
carpeta_guiones = "./scripts"

# Crear una carpeta para almacenar los guiones limpios
carpeta_limpia = "./clean_scripts"
os.makedirs(carpeta_limpia, exist_ok=True)

def limpiar_html(texto):
    """Elimina etiquetas HTML usando BeautifulSoup."""
    soup = BeautifulSoup(texto, "lxml")
    return soup.get_text()

def limpiar_texto(texto):
    """Elimina caracteres especiales y espacios innecesarios."""
    # Elimina caracteres no alfanuméricos excepto espacios y saltos de línea
    texto = re.sub(r"[^\w\s]", "", texto)
    # Reemplaza múltiples espacios o saltos de línea por uno solo
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto

def procesar_guion(archivo):
    """Limpia y guarda el guion en formato limpio."""
    with open(archivo, "r", encoding="utf-8") as f:
        contenido = f.read()

    # Limpia HTML y caracteres especiales
    contenido_limpio = limpiar_html(contenido)
    contenido_limpio = limpiar_texto(contenido_limpio)

    # Guarda el archivo limpio en la nueva carpeta
    nombre_archivo = os.path.basename(archivo)
    ruta_salida = os.path.join(carpeta_limpia, nombre_archivo)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        f.write(contenido_limpio)

# Procesa cada guion en la carpeta original
for archivo in os.listdir(carpeta_guiones):
    if archivo.endswith(".txt"):
        procesar_guion(os.path.join(carpeta_guiones, archivo))

print("Guiones procesados y guardados en la carpeta 'guiones_limpios'.")
