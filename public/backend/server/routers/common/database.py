import psycopg2
from . import config
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(
        dbname=config.POSTGRES_DB,
        user=config.POSTGRES_USER,
        password=config.POSTGRES_PASSWORD,
        host=config.POSTGRES_HOST,
        port=config.POSTGRES_PORT,
        cursor_factory=RealDictCursor
    )