"""python scripts/exportar_parte1.py"""
from pathlib import Path
import sys
root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root))
from src.graphs.resultados import generate
maps=[root/'data'/'mapas',root/'data'/'mapas_grupo',root/'data'/'mapas_criados']
res=generate(maps,root/'out'/'parte1')
print(f'Exportados resultados para {len(res)} mapas')
