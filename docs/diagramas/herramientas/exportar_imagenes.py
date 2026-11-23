#!/usr/bin/env python3
"""Exporta los diagramas .drawio de docs/diagramas/ a PNG usando draw.io Desktop.

Genera una imagen por página en docs/diagramas/img/ con el mismo nombre del
archivo .drawio (los diagramas de varias páginas añaden un sufijo).

Uso:
    python exportar_imagenes.py                # exporta todo
    python exportar_imagenes.py c4-1-contexto  # exporta solo ese diagrama

Nota: la opción -p de draw.io cuenta páginas desde 1 (0 equivale a la primera).
Nota: draw.io Desktop (Electron) falla con rutas absolutas que contienen
caracteres como "ñ", por eso se ejecuta con cwd = docs/diagramas y rutas
relativas.
"""
import os
import subprocess
import sys
from pathlib import Path

DIRECTORIO = Path(__file__).resolve().parent.parent  # docs/diagramas
ESCALA = "2"
POSIBLES_EJECUTABLES = [
    r"C:\Program Files\draw.io\draw.io.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\draw.io\draw.io.exe"),
]

# archivo .drawio (sin extensión) -> lista de nombres de salida, uno por página
DIAGRAMAS = {
    "c4-1-contexto": ["c4-1-contexto"],
    "c4-2-contenedores": ["c4-2-contenedores"],
    "c4-3-componentes": ["c4-3-componentes"],
    "c4-4-codigo": ["c4-4-codigo-4a-dominio", "c4-4-codigo-4b-persistencia"],
    "actividad-hu-01-registro": ["actividad-hu-01-registro"],
    "actividad-hu-02-inicio-sesion": ["actividad-hu-02-inicio-sesion"],
    "actividad-hu-03-consultar-disponibilidad": ["actividad-hu-03-consultar-disponibilidad"],
    "actividad-hu-04-solicitar-prestamo": ["actividad-hu-04-solicitar-prestamo"],
    "actividad-hu-05-gestion-inventario": ["actividad-hu-05-gestion-inventario"],
    "actividad-hu-06-entrega-devolucion": ["actividad-hu-06-entrega-devolucion"],
}


def encontrar_drawio() -> str:
    for ruta in POSIBLES_EJECUTABLES:
        if os.path.exists(ruta):
            return ruta
    sys.exit("No se encontró draw.io Desktop.")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ejecutable = encontrar_drawio()
    filtro = set(sys.argv[1:])
    (DIRECTORIO / "img").mkdir(exist_ok=True)
    errores = 0
    for archivo, salidas in DIAGRAMAS.items():
        if filtro and archivo not in filtro:
            continue
        for indice, nombre in enumerate(salidas):
            destino = f"img/{nombre}.png"
            comando = [ejecutable, "-x", "-f", "png", "-s", ESCALA,
                       "-p", str(indice + 1), "-o", destino, f"{archivo}.drawio"]
            resultado = subprocess.run(comando, cwd=DIRECTORIO, capture_output=True, text=True)
            existe = (DIRECTORIO / destino).exists()
            estado = "OK" if resultado.returncode == 0 and existe else "ERROR"
            if estado == "ERROR":
                errores += 1
            print(f"[{estado}] {archivo}.drawio (página {indice}) -> {destino}")
            if estado == "ERROR":
                print(resultado.stdout, resultado.stderr)
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
