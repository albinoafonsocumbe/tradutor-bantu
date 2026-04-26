import psycopg2

def conectar():
    conexao = psycopg2.connect(
        host="localhost",
        database="tradutor_bantu",
        user="postgres",
        password="0000"
    )
    return conexao
