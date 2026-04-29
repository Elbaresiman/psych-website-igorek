from f_config import get_db

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


def init_users_table():
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            status ENUM('student','teacher','employee') NOT NULL,
            age INT NOT NULL,
            field VARCHAR(100) NOT NULL,
            field_other VARCHAR(255) DEFAULT NULL,
            student_course INT DEFAULT NULL,
            student_education_level VARCHAR(50) DEFAULT NULL,
            teacher_experience INT DEFAULT NULL,
            employee_experience INT DEFAULT NULL,
            form_completed TINYINT(1) DEFAULT 0,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY session_id (session_id),
            KEY idx_session_id (session_id)
        )
    """)
    db.commit()
    db.close()

def init_all_tables():
    init_mood_table()
    init_reminder_table()
    init_chat_logs_table()
    init_users_table()

init_all_tables()