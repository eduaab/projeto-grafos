import pytest

from src.graphs.io import mapa_input, validar_mapa, MapaInvalidoError


def escrever_mapa(tmp_path, nome, linhas):
    caminho = tmp_path / nome
    caminho.write_text('\n'.join(linhas) + '\n', encoding='utf-8')
    return caminho


def test_mapa_valido_e_lido_como_matriz_de_caracteres(tmp_path):
    caminho = escrever_mapa(tmp_path, 'm.txt', ['#####', '#S.G#', '#####'])
    mapa = mapa_input(caminho)
    assert mapa == [list('#####'), list('#S.G#'), list('#####')]


def test_linhas_de_comentario_sao_descartadas(tmp_path):
    caminho = escrever_mapa(tmp_path, 'm.txt', [
        '; comentario no topo', '#####', '#S.G#', '; outro comentario', '#####',
    ])
    mapa = mapa_input(caminho)
    assert mapa == [list('#####'), list('#S.G#'), list('#####')]


def test_mapa_nao_retangular_gera_erro_claro(tmp_path):
    caminho = escrever_mapa(tmp_path, 'm.txt', ['#####', '#S.G#', '####'])
    with pytest.raises(MapaInvalidoError) as excinfo:
        mapa_input(caminho)
    assert 'colunas' in str(excinfo.value)


def test_mapa_com_dois_inicios_gera_erro_claro():
    mapa = [list('#####'), list('#SSG#'), list('#####')]
    with pytest.raises(MapaInvalidoError, match='um inicio'):
        validar_mapa(mapa)


def test_mapa_sem_saida_gera_erro_claro():
    mapa = [list('#####'), list('#S..#'), list('#####')]
    with pytest.raises(MapaInvalidoError, match='saida'):
        validar_mapa(mapa)


def test_mapa_com_simbolo_desconhecido_gera_erro_claro():
    mapa = [list('#####'), list('#S?G#'), list('#####')]
    with pytest.raises(MapaInvalidoError, match="Símbolo"):
        validar_mapa(mapa)


def test_mapa_vazio_gera_erro():
    with pytest.raises(MapaInvalidoError):
        validar_mapa([])


def test_varios_erros_sao_reportados_juntos():
    # dois inicios e nenhuma saida ao mesmo tempo: as duas mensagens devem aparecer
    mapa = [list('#####'), list('#SS.#'), list('#####')]
    with pytest.raises(MapaInvalidoError) as excinfo:
        validar_mapa(mapa)
    erros = excinfo.value.erros
    assert len(erros) == 2
