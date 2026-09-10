import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database", "womens_health.db")
os.makedirs(os.path.dirname(DATABASE), exist_ok=True)

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

        LifeStage TEXT NOT NULL,

        FailedAttempts INTEGER DEFAULT 0

    );
    """)
    cursor.execute("""

    CREATE TABLE IF NOT EXISTS Cycle(

    CycleID INTEGER PRIMARY KEY AUTOINCREMENT,
    StartDate TEXT NOT NULL,
    UserID INTEGER,
    PeriodLength INTEGER,
    CycleLength INTEGER CHECK (CycleLength BETWEEN 15 AND 60),
    FOREIGN KEY(UserID) REFERENCES User(UserID)

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
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Appointment(
        AppointmentID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER,
        AppointmentDate TEXT NOT NULL,
        Title TEXT NOT NULL,
        Location TEXT,
        Time TEXT,
        FOREIGN KEY(UserID) REFERENCES User(UserID)
    );
    """)

    conn.commit()

    conn.close()

def execute_query(query, values=()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
    finally:
        conn.close()

def fetch_query(query, values=()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, values)
        return cursor.fetchall()
    finally:
        conn.close()

