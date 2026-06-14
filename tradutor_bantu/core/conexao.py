try:
    import psycopg2 as pg
except ImportError:
    import psycopg as pg


def conectar():
    conexao = pg.connect(
        host="localhost",
        database="tradutor_bantu",
        user="postgres",
        password="0000"
    )
    return conexao
