from contextlib import contextmanager
from typing import Iterator, Tuple

from psycopg2 import pool
from psycopg2.extras import RealDictCursor

from app.config import settings

_db_pool: pool.SimpleConnectionPool | None = None


def init_db_pool(minconn: int = 1, maxconn: int = 8) -> None:
    global _db_pool
    if _db_pool is not None:
        return

    _db_pool = pool.SimpleConnectionPool(
        minconn=minconn,
        maxconn=maxconn,
        dsn=settings.DATABASE_URL,
    )


def close_db_pool() -> None:
    global _db_pool
    if _db_pool is None:
        return
    _db_pool.closeall()
    _db_pool = None


def ensure_schema() -> None:
    with get_db_cursor() as (_, cursor):
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS density_records (
                id SERIAL PRIMARY KEY,
                drone_id VARCHAR(50) REFERENCES drones(id),
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                person_count INTEGER DEFAULT 0,
                density_level DOUBLE PRECISION DEFAULT 0.0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_density_timestamp
            ON density_records (timestamp DESC)
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_density_drone_timestamp
            ON density_records (drone_id, timestamp DESC)
            """
        )


@contextmanager
def get_db_cursor(dict_rows: bool = False) -> Iterator[Tuple[object, object]]:
    if _db_pool is None:
        init_db_pool()

    assert _db_pool is not None
    conn = _db_pool.getconn()
    cursor = None

    try:
        cursor_factory = RealDictCursor if dict_rows else None
        cursor = conn.cursor(cursor_factory=cursor_factory)
        yield conn, cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        if cursor is not None:
            cursor.close()
        _db_pool.putconn(conn)
