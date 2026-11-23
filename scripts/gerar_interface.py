"""python scripts/gerar_interface.py"""
from pathlib import Path
import sys
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from src.graphs.resultados import gerar_html_interativo

out = root / 'out' / 'parte1'
destino = gerar_html_interativo(out)
(root / 'frontend' / 'public' / 'labirinto_interativo.html').write_text(
    destino.read_text(encoding='utf-8'), encoding='utf-8'
)
print('HTML gerado:', destino.stat().st_size, 'bytes')
