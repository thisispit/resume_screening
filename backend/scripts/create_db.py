"""One-off: ensure the resume_screening database exists."""
import psycopg

URL = "postgresql://postgres:Megha%2312@localhost:5432/postgres"
with psycopg.connect(URL, autocommit=True) as conn:
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'resume_screening'")
    if cur.fetchone():
        print("database exists")
    else:
        cur.execute("CREATE DATABASE resume_screening")
        print("database created")
