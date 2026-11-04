# ler/validar os mapas e o dataset

def mapa_input(path):
    # Lê o arquivo e retorna uma matriz de caracteres 

    with open(path, 'r') as file:
        lines = file.readlines()

    mapa = [] 

    for line in lines:
        line = line.strip()
        mapa.append(list(line))

    return mapa

def mapa_print(mapa):
    # Imprime a matriz de caracteres

    for row in mapa:
        print(''.join(row))