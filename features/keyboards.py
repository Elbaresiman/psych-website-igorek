from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

MAIN_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Пообщаться 💬"), KeyboardButton(text="Советы 🧘")],
        [KeyboardButton(text="История 📖"), KeyboardButton(text="Дневник настроения 🌸")],
        [KeyboardButton(text="Помощь 🆘")]
    ],
    resize_keyboard=True
)

ADVICE_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Техника дыхания 🌬️"), KeyboardButton(text="Метод 5-4-3-2-1 🌿")],
        [KeyboardButton(text="Медитация 🧘"), KeyboardButton(text="Массаж 💆")],
        [KeyboardButton(text="Совет по настроению ✨"), KeyboardButton(text="Экспресс-помощь 🆘")],
        [KeyboardButton(text="Назад ◀️")]
    ],
    resize_keyboard=True
)

CHAT_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Выход 🔙")]
    ],
    resize_keyboard=True
)

HISTORY_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Очистить историю 🧹"), KeyboardButton(text="Назад ◀️")]
    ],
    resize_keyboard=True
)

MOOD_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Записать настроение ✍️"), KeyboardButton(text="Посмотреть записи 📖")],
        [KeyboardButton(text="Статистика 📊"), KeyboardButton(text="Напоминания ⏰")],
        [KeyboardButton(text="Анализ настроения 🧠"), KeyboardButton(text="Назад ◀️")]
    ],
    resize_keyboard=True
)

NOTE_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Пропустить ⏭"), KeyboardButton(text="Выбрать смайлик заново ◀️")]
    ],
    resize_keyboard=True
)

EMOJI_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="😊"), KeyboardButton(text="🙂")],
        [KeyboardButton(text="😢"), KeyboardButton(text="😡")],
        [KeyboardButton(text="😴"), KeyboardButton(text="😌")]
    ],
    resize_keyboard=True
)

def admin_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats")],
        [InlineKeyboardButton(text="⏰ Напоминания", callback_data="admin_reminders")],
        [InlineKeyboardButton(text="💬 Диалоги", callback_data="admin_conversations")],
        [InlineKeyboardButton(text="✍️ Дневник настроения", callback_data="admin_diary")],
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="admin_broadcast")]
    ])

def breathing_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✨ Техника \"4-7-8\"", callback_data="breathing_one")],
        [InlineKeyboardButton(text="✨ Дыхание по квадрату", callback_data="breathing_two")],
        [InlineKeyboardButton(text="✨ Резонансное дыхание", callback_data="breathing_three")]
    ])

def help_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Главное меню 🌿", callback_data="main_instr")],
        [InlineKeyboardButton(text="Советы 🧘", callback_data="advice_instr")],
        [InlineKeyboardButton(text="Дневник настроения 🌸", callback_data="diary_instr")]
    ])

def diary_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Удалить все записи", callback_data="diary_delete_all")],
        [InlineKeyboardButton(text="Удалить последние 5 записей", callback_data="diary_delete_five")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin_home")]
    ])