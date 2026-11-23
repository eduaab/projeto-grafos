from src.graphs.estados import (
    ALVO, criar_estado_inicial, custo_entrada, gerar_movimentos, criar_grafo_estados,
)

MAPA_MINIMO = [
    list("#####"),
    list("#S.G#"),
    list("#a#.#"),
    list("#v#.#"),
    list("#####"),
]


def test_criar_estado_inicial_encontra_o_s_sem_chaves_nem_bonus():
    assert criar_estado_inicial(MAPA_MINIMO) == (1, 1, '', ())


def test_custo_entrada_tabela_de_simbolos():
    assert custo_entrada(MAPA_MINIMO, (1, 2), ()) == 1  # chao
    mapa_terreno = [list("###"), list("#,#"), list("#~#"), list("###")]
    assert custo_entrada(mapa_terreno, (1, 1), ()) == 3  # lama
    assert custo_entrada(mapa_terreno, (2, 1), ()) == 5  # agua


def test_custo_entrada_bonus_so_vale_uma_vez():
    mapa_bonus = [list("###"), list("#+#"), list("###")]
    bonus_cell = (1, 1)
    assert custo_entrada(mapa_bonus, bonus_cell, ()) == -4
    assert custo_entrada(mapa_bonus, bonus_cell, (bonus_cell,)) == 1


def test_custo_entrada_fonte_so_consome_com_a_flag():
    mapa_fonte = [list("###"), list("#*#"), list("###")]
    fonte = (1, 1)
    assert custo_entrada(mapa_fonte, fonte, (), fonte_consumivel=False) == -2
    assert custo_entrada(mapa_fonte, fonte, (fonte,), fonte_consumivel=False) == -2
    assert custo_entrada(mapa_fonte, fonte, (), fonte_consumivel=True) == -2
    assert custo_entrada(mapa_fonte, fonte, (fonte,), fonte_consumivel=True) == 1


def test_gerar_movimentos_porta_fechada_sem_a_chave():
    mapa = [list("####"), list("#SA#"), list("####")]
    sem_chave = (1, 1, '', ())
    com_chave = (1, 1, 'a', ())
    assert gerar_movimentos(mapa, sem_chave) == []
    assert gerar_movimentos(mapa, com_chave) == [((1, 2, 'a', ()), 1)]


def test_gerar_movimentos_respeita_direcao_da_esteira():
    mapa = [list("###"), list("#>#"), list("###")]
    estado = (1, 1, '', ())
    movimentos = gerar_movimentos(mapa, estado)
    assert movimentos == []  # '>' aponta para fora da grade: nenhum movimento valido


def test_gerar_movimentos_g_nao_tem_saida_so_vai_para_alvo():
    mapa = [list("###"), list("#G#"), list("###")]
    estado = (1, 1, '', ())
    assert gerar_movimentos(mapa, estado) == [(ALVO, 0)]


def test_coletar_chave_muda_a_camada_do_estado():
    grafo = criar_grafo_estados(MAPA_MINIMO)
    antes = (1, 1, '', ())
    depois = (1, 1, 'a', ())
    assert antes in grafo and depois in grafo
    assert antes != depois  # mesma casa, camada (conjunto de chaves) diferente


def test_esteira_apontando_para_parede_gera_estado_sem_saida():
    grafo = criar_grafo_estados(MAPA_MINIMO)
    estado_beco = (3, 1, 'a', ())
    assert estado_beco in grafo
    assert grafo[estado_beco] == []


def test_mapa_minimo_numero_de_estados_e_arcos_bate_com_a_mao():
    grafo = criar_grafo_estados(MAPA_MINIMO)
    estados = len(grafo) - 1  # exclui o no virtual ALVO
    arcos = sum(1 for u, adjs in grafo.items() if u != ALVO for v, _ in adjs if v != ALVO)
    assert estados == 8
    assert arcos == 10
