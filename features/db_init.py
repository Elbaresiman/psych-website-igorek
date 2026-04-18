from features.f_config import get_db

def init_mood_table():
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS mood_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            emoji VARCHAR(10) NOT NULL,
            mood_state VARCHAR(50) NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.commit()
    db.close()

def init_reminder_table():
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_reminders (
            user_id BIGINT NOT NULL,
            remind_type VARCHAR(50),
            remind_time TIME NOT NULL,
            PRIMARY KEY (user_id, remind_type)
        )
    """)
    db.commit()
    db.close()

def init_chat_logs_table():
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            user_message TEXT,
            bot_response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.commit()
    db.close()

def init_all_tables():
    init_mood_table()
    init_reminder_table()
    init_chat_logs_table()