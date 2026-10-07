import os
from peewee import SqliteDatabase

DB_PATH = os.path.join(os.path.dirname(__file__), "formflow.db")
db = SqliteDatabase(DB_PATH)

def get_db():
    try:
        if db.is_closed():
            db.connect()
        yield db
    finally:
        if not db.is_closed():
            db.close()
