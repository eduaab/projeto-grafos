"""Exporta a exploração para o frontend ou recebe uma grade por stdin."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.exploracao import explorar
from src.graphs.io import mapa_input


def main():
    if '--stdin' in sys.argv:
        pedido = json.load(sys.stdin)
        mapa = [list(linha) for linha in pedido['mapa']]
        dados = explorar(mapa, fonte_consumivel=bool(pedido.get('fonte_consumivel')))
        json.dump(dados, sys.stdout, ensure_ascii=True, separators=(',', ':'))
        return
    mapas = sorted(arquivo for pasta in ('mapas', 'mapas_grupo', 'mapas_criados')
                   for arquivo in (ROOT / 'data' / pasta).glob('*.txt')
                   if arquivo.name != 'sobre.txt')
    destino = ROOT / 'out' / 'parte1' / 'exploracao.json'
    fontes = mapas + [Path(__file__), ROOT / 'src' / 'exploracao.py']
    fontes += list((ROOT / 'src' / 'graphs').glob('*.py'))
    if destino.exists() and destino.stat().st_mtime >= max(p.stat().st_mtime for p in fontes):
        return
    dados = {}
    for arquivo in mapas:
        if arquivo.stem in dados:
            raise ValueError(f'Nome de mapa repetido: {arquivo.stem}')
        dados[arquivo.stem] = explorar(mapa_input(arquivo))
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(dados, ensure_ascii=True, separators=(',', ':')), encoding='utf-8')
    print(f'Exploração exportada para {len(dados)} mapas.')


if __name__ == '__main__':
    main()
