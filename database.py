import sqlite3

DATABASE = "database/womens_health.db"


def get_db_connection():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


def create_tables():

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS User(

        UserID INTEGER PRIMARY KEY AUTOINCREMENT,

        Username TEXT NOT NULL,

        PIN TEXT NOT NULL,

        LifeStage TEXT NOT NULL

    );
    """)
    cursor.execute("""

    CREATE TABLE IF NOT EXISTS Cycle(

        StartDate TEXT PRIMARY KEY,

        UserID INTEGER,

        PeriodLength INTEGER,

        CycleLength INTEGER,

        FOREIGN KEY(UserID)

        REFERENCES User(UserID)

    );

    """)
    cursor.execute("""

    CREATE TABLE IF NOT EXISTS Symptom(

        SymptomID INTEGER PRIMARY KEY AUTOINCREMENT,

        UserID INTEGER,

        Date TEXT,

        Symptom TEXT,

        FOREIGN KEY(UserID)

        REFERENCES User(UserID)

    );

    """)    
    cursor.execute("""

    CREATE TABLE IF NOT EXISTS Medication(

        MedicationID INTEGER PRIMARY KEY AUTOINCREMENT,

        UserID INTEGER,

        MedicationName TEXT,

        ReminderTime TEXT,

        Active BOOLEAN,

        FOREIGN KEY(UserID)

        REFERENCES User(UserID)

    );

    """)
    conn.commit()

    conn.close()

def execute_query(query, values=()):

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute(query, values)

    conn.commit()

    conn.close()

def fetch_query(query, values=()):

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute(query, values)

    results = cursor.fetchall()

    conn.close()

    return results
def fetch_query(query, values=()):

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute(query, values)

    results = cursor.fetchall()

    conn.close()

    return results