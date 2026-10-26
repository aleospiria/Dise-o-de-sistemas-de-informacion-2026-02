#!/usr/bin/env python3
"""Validador de archivos draw.io (.drawio).

Uso: python validar_drawio.py [archivos o carpetas ...] [--salida ruta.txt]

Sin argumentos valida todos los *.drawio de docs/diagramas/ (carpeta del
script/..). Termina con exit 0 si no hay errores y 1 si hay alguno.
Las advertencias no hacen fallar la validación.
"""
from __future__ import annotations

import base64
import html
import math
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zlib
from dataclasses import dataclass, field
from pathlib import Path

ANCHO_CHAR = 7.0      # px por carácter con fontSize 12
ALTO_LINEA = 18.0     # px por línea con fontSize 12
TOLERANCIA = 2.0      # px de tolerancia en solapes
PADDING_H = 10.0      # margen horizontal interno aproximado


@dataclass
class Informe:
    """Errores y advertencias de una página."""
    errores: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)


@dataclass
class Celda:
    """Celda mxCell con sus atributos ya interpretados."""
    id: str
    value: str
    style: dict[str, str]
    parent: str | None
    source: str | None
    target: str | None
    vertex: bool
    edge: bool
    geo: ET.Element | None

    def rect(self) -> tuple[float, float, float, float] | None:
        """Devuelve (x, y, w, h) o None si la geometría no es numérica."""
        if self.geo is None:
            return None
        try:
            x = float(self.geo.get("x", "0"))
            y = float(self.geo.get("y", "0"))
            w = float(self.geo.get("width", ""))
            h = float(self.geo.get("height", ""))
        except ValueError:
            return None
        return x, y, w, h


# ---------------------------------------------------------------- carga

def parsear_estilo(texto: str | None) -> dict[str, str]:
    """Convierte 'a=1;b=2;text;' en {'a':'1','b':'2','text':''}."""
    estilo: dict[str, str] = {}
    for parte in (texto or "").split(";"):
        if not parte:
            continue
        clave, _, valor = parte.partition("=")
        estilo[clave.strip()] = valor.strip()
    return estilo


def descomprimir(contenido: str) -> ET.Element:
    """Descomprime el contenido base64+deflate de un <diagram>."""
    crudo = zlib.decompress(base64.b64decode(contenido.strip()), -15)
    return ET.fromstring(urllib.parse.unquote(crudo.decode("utf-8")))


def obtener_modelo(diagrama: ET.Element) -> ET.Element | None:
    """Obtiene <mxGraphModel> de un <diagram>, comprimido o no."""
    modelo = diagrama.find("mxGraphModel")
    if modelo is not None:
        return modelo
    texto = (diagrama.text or "").strip()
    if not texto:
        return None
    return descomprimir(texto)


def construir_celda(el: ET.Element) -> Celda:
    """Crea una Celda desde un elemento mxCell."""
    return Celda(
        id=el.get("id", ""), value=el.get("value", "") or "",
        style=parsear_estilo(el.get("style")), parent=el.get("parent"),
        source=el.get("source"), target=el.get("target"),
        vertex=el.get("vertex") == "1", edge=el.get("edge") == "1",
        geo=el.find("mxGeometry"),
    )


def celdas_de(modelo: ET.Element) -> tuple[list[Celda], list[str]]:
    """Devuelve las celdas de <root> y los errores estructurales."""
    raiz = modelo.find("root")
    if raiz is None:
        return [], ["mxGraphModel sin <root>"]
    # Los <object>/<UserObject> envuelven una mxCell con label y id propios.
    celdas: list[Celda] = []
    for el in raiz:
        if el.tag == "mxCell":
            celdas.append(construir_celda(el))
        elif el.tag in ("object", "UserObject"):
            interna = el.find("mxCell")
            if interna is not None:
                c = construir_celda(interna)
                c.id = el.get("id", "")
                c.value = el.get("label", "") or ""
                celdas.append(c)
    return celdas, []


# ------------------------------------------------------- comprobaciones

def comprobar_estructura(celdas: list[Celda], inf: Informe) -> dict[str, Celda]:
    """Ids únicos, celdas 0 y 1, referencias parent/source/target."""
    por_id: dict[str, Celda] = {}
    for c in celdas:
        if c.id in por_id:
            inf.errores.append(f"id duplicado: '{c.id}'")
        por_id[c.id] = c
    for ident in ("0", "1"):
        if ident not in por_id:
            inf.errores.append(f"falta la celda base '{ident}'")
    for c in celdas:
        for campo in ("parent", "source", "target"):
            ref = getattr(c, campo)
            if ref is not None and ref not in por_id:
                inf.errores.append(
                    f"celda '{c.id}': {campo}='{ref}' no existe")
    return por_id


def comprobar_geometria(celdas: list[Celda], inf: Informe) -> None:
    """Geometría de vértices y aristas."""
    for c in celdas:
        if c.vertex:
            r = c.rect()
            if r is None:
                inf.errores.append(
                    f"vértice '{c.id}': sin mxGeometry con x,y,width,height")
            elif r[2] <= 0 or r[3] <= 0:
                inf.errores.append(
                    f"vértice '{c.id}': width/height deben ser > 0")
        elif c.edge:
            comprobar_arista(c, inf)


def comprobar_arista(c: Celda, inf: Informe) -> None:
    """Una arista necesita geometría relativa y extremos."""
    if c.geo is None or c.geo.get("relative") != "1":
        inf.errores.append(f"arista '{c.id}': mxGeometry relative=\"1\" ausente")
    con_puntos = c.geo is not None and c.geo.find(".//mxPoint") is not None
    for campo in ("source", "target"):
        if getattr(c, campo) is None:
            msg = f"arista '{c.id}': sin {campo}"
            if con_puntos:
                inf.avisos.append(msg + " (usa puntos explícitos)")
            else:
                inf.errores.append(msg)


def texto_plano(valor: str, es_html: bool) -> str:
    """Quita etiquetas HTML y convierte saltos en '\\n'."""
    if es_html:
        valor = re.sub(r"(?i)<br\s*/?>|</div>|</p>|</li>", "\n", valor)
        valor = re.sub(r"<[^>]+>", "", valor)
        valor = html.unescape(valor)
    return valor.replace("&#xa;", "\n").strip()


def tamano_fuente(estilo: dict[str, str]) -> float:
    """fontSize del estilo (12 por defecto)."""
    try:
        return float(estilo.get("fontSize", "12"))
    except ValueError:
        return 12.0


def es_texto_puro(estilo: dict[str, str]) -> bool:
    """Estilo 'text;' sin borde propio."""
    return "text" in estilo and estilo.get("strokeColor", "none") == "none"


def revisar_texto(c: Celda, w: float, h: float, inf: Informe) -> None:
    """Heurística de texto cortado para un vértice con valor."""
    estilo = c.style
    texto = texto_plano(c.value, estilo.get("html") == "1")
    if not texto:
        return
    escala = tamano_fuente(estilo) / 12.0
    ancho_car, alto_lin = ANCHO_CHAR * escala, ALTO_LINEA * escala
    lineas = texto.split("\n")
    wrap = estilo.get("whiteSpace") == "wrap"
    destino = inf.avisos if es_texto_puro(estilo) else inf.errores
    etiqueta = f"texto posiblemente cortado en '{c.id}' ('{texto[:30]}')"
    if "swimlane" in estilo:
        # Solo se revisa el ancho del título horizontal.
        if estilo.get("horizontal") != "0":
            largo = max(len(x) for x in lineas) * ancho_car
            if w < 0.85 * largo:
                destino.append(etiqueta + ": título más ancho que el carril")
        return
    if wrap:
        util = max(w - PADDING_H, 1.0)
        n = sum(max(1, math.ceil(len(x) * ancho_car / util)) for x in lineas)
        if h < 0.8 * n * alto_lin:
            destino.append(f"{etiqueta}: alto {h:g} < {0.8 * n * alto_lin:g} "
                           f"({n} líneas estimadas)")
    else:
        largo = max(len(x) for x in lineas) * ancho_car
        if w < 0.85 * largo:
            destino.append(f"{etiqueta}: ancho {w:g} < {0.85 * largo:g}")
        if h < 0.8 * len(lineas) * alto_lin:
            destino.append(f"{etiqueta}: alto {h:g} insuficiente para "
                           f"{len(lineas)} líneas")


def comprobar_textos(celdas: list[Celda], por_id: dict[str, Celda],
                     inf: Informe) -> None:
    """Aplica la heurística de texto a los vértices elegibles."""
    for c in celdas:
        r = c.rect()
        if not c.vertex or r is None or r[2] <= 0 or r[3] <= 0:
            continue
        padre = por_id.get(c.parent or "")
        if padre is not None and padre.edge:
            continue
        if "rhombus" in c.style and r[2] < 60:
            continue
        revisar_texto(c, r[2], r[3], inf)


def contiene(a: tuple[float, float, float, float],
             b: tuple[float, float, float, float]) -> bool:
    """True si el rectángulo a contiene completamente a b."""
    t = TOLERANCIA
    return (a[0] - t <= b[0] and a[1] - t <= b[1]
            and a[0] + a[2] + t >= b[0] + b[2]
            and a[1] + a[3] + t >= b[1] + b[3])


def interseccion(a: tuple[float, float, float, float],
                 b: tuple[float, float, float, float]) -> bool:
    """True si los rectángulos se solapan más que la tolerancia."""
    ancho = min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])
    alto = min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1])
    return ancho > TOLERANCIA and alto > TOLERANCIA


def es_contenedor(c: Celda, r: tuple[float, float, float, float],
                  hermanos: list[tuple[Celda, tuple[float, float, float, float]]]
                  ) -> bool:
    """Swimlane, container=1, fondo sin relleno o que contiene a otro."""
    e = c.style
    if "swimlane" in e or e.get("container") == "1":
        return True
    if e.get("fillColor") == "none" and "text" not in e:
        return True
    return any(o is not c and contiene(r, ro) for o, ro in hermanos)


def comprobar_solapes(celdas: list[Celda], inf: Informe) -> None:
    """Detecta solapes parciales entre vértices hermanos."""
    grupos: dict[str, list[tuple[Celda, tuple[float, float, float, float]]]] = {}
    for c in celdas:
        r = c.rect()
        if c.vertex and r is not None and r[2] > 0 and r[3] > 0:
            grupos.setdefault(c.parent or "", []).append((c, r))
    for hermanos in grupos.values():
        for i, (a, ra) in enumerate(hermanos):
            for b, rb in hermanos[i + 1:]:
                if not interseccion(ra, rb):
                    continue
                if contiene(ra, rb) or contiene(rb, ra):
                    continue
                if es_contenedor(a, ra, hermanos) or es_contenedor(b, rb, hermanos):
                    continue
                inf.errores.append(
                    f"solape parcial entre '{a.id}' y '{b.id}'")


def valores(celdas: list[Celda]) -> list[str]:
    """Valores de texto plano de todos los vértices."""
    return [texto_plano(c.value, True) for c in celdas if c.vertex]


def comprobar_c4(celdas: list[Celda], inf: Informe) -> None:
    """Título '[Nivel', leyenda y etiquetas de relaciones."""
    textos = valores(celdas)
    if not any("[Nivel" in t for t in textos):
        inf.errores.append("falta título con '[Nivel'")
    if not any("leyenda" in t.lower() for t in textos):
        inf.errores.append("falta leyenda ('Leyenda')")
    for c in celdas:
        if c.edge and not texto_plano(c.value, True):
            inf.avisos.append(f"arista '{c.id}' sin etiqueta")


def comprobar_actividad(celdas: list[Celda], inf: Informe) -> None:
    """Avisa si faltan nodo inicial o final."""
    vertices = [c for c in celdas if c.vertex]
    inicio = any(c.value.strip().lower() == "inicio" or (
        "ellipse" in c.style and c.style.get("fillColor", "").lower()
        in ("#000000", "black") and not c.value.strip()) for c in vertices)
    final = any(c.value.strip().lower() in ("fin", "final") or (
        "ellipse" in c.style and "endArrow" not in c.style
        and c.style.get("fillColor", "").lower() not in ("", "none")
        and c.style.get("shape") == "endState") for c in vertices)
    final = final or any(c.style.get("shape") == "endState" for c in vertices)
    if not inicio:
        inf.avisos.append("no se encontró nodo inicial")
    if not final:
        inf.avisos.append("no se encontró nodo final")


def validar_celdas(celdas: list[Celda], nombre: str) -> Informe:
    """Ejecuta todas las comprobaciones sobre una página."""
    inf = Informe()
    por_id = comprobar_estructura(celdas, inf)
    comprobar_geometria(celdas, inf)
    comprobar_textos(celdas, por_id, inf)
    comprobar_solapes(celdas, inf)
    base = nombre.lower()
    if base.startswith("c4-"):
        comprobar_c4(celdas, inf)
    elif base.startswith("actividad-"):
        comprobar_actividad(celdas, inf)
    return inf


# -------------------------------------------------------------- archivos

def validar_archivo(ruta: Path) -> list[tuple[str, Informe]]:
    """Valida un .drawio y devuelve (página, informe) por diagrama."""
    try:
        raiz = ET.parse(ruta).getroot()
    except ET.ParseError as e:
        inf = Informe(errores=[f"XML mal formado: {e}"])
        return [("(archivo)", inf)]
    if raiz.tag != "mxfile":
        return [("(archivo)", Informe(errores=["la raíz no es <mxfile>"]))]
    diagramas = raiz.findall("diagram")
    if not diagramas:
        return [("(archivo)", Informe(errores=["sin elementos <diagram>"]))]
    resultados = []
    for i, d in enumerate(diagramas, 1):
        nombre = d.get("name") or f"página {i}"
        resultados.append((nombre, validar_pagina(d, ruta.name)))
    return resultados


def validar_pagina(diagrama: ET.Element, archivo: str) -> Informe:
    """Valida un <diagram> (comprimido o no)."""
    try:
        modelo = obtener_modelo(diagrama)
    except Exception as e:  # base64/zlib/XML inválido
        return Informe(errores=[f"contenido comprimido ilegible: {e}"])
    if modelo is None:
        return Informe(errores=["<diagram> sin mxGraphModel"])
    celdas, errores = celdas_de(modelo)
    if errores:
        return Informe(errores=errores)
    return validar_celdas(celdas, archivo)


def reunir_archivos(entradas: list[str]) -> list[Path]:
    """Expande carpetas a sus *.drawio (recursivo)."""
    archivos: list[Path] = []
    for e in entradas:
        p = Path(e)
        if p.is_dir():
            archivos.extend(sorted(p.rglob("*.drawio")))
        else:
            archivos.append(p)
    return archivos


def formatear(ruta: Path, paginas: list[tuple[str, Informe]]) -> list[str]:
    """Líneas del informe de un archivo."""
    lineas = [f"== {ruta}"]
    for nombre, inf in paginas:
        estado = "ERROR" if inf.errores else "OK"
        lineas.append(f"  [{estado}] {nombre}")
        lineas += [f"    ERROR: {m}" for m in inf.errores]
        lineas += [f"    AVISO: {m}" for m in inf.avisos]
    return lineas


def main(argv: list[str]) -> int:
    """Punto de entrada; devuelve el código de salida."""
    salida: str | None = None
    entradas: list[str] = []
    it = iter(argv)
    for a in it:
        if a == "--salida":
            salida = next(it, None)
        else:
            entradas.append(a)
    if not entradas:
        entradas = [str(Path(__file__).resolve().parent.parent)]
    archivos = reunir_archivos(entradas)
    lineas: list[str] = []
    n_err = n_avisos = 0
    for ruta in archivos:
        if not ruta.is_file():
            lineas += [f"== {ruta}", "    ERROR: archivo no encontrado"]
            n_err += 1
            continue
        paginas = validar_archivo(ruta)
        lineas += formatear(ruta, paginas)
        n_err += sum(len(i.errores) for _, i in paginas)
        n_avisos += sum(len(i.avisos) for _, i in paginas)
    lineas.append(f"Resumen: {len(archivos)} archivo(s), "
                  f"{n_err} error(es), {n_avisos} aviso(s)")
    texto = "\n".join(lineas)
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except AttributeError:
        pass
    print(texto)
    if salida:
        Path(salida).write_text(texto + "\n", encoding="utf-8")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
