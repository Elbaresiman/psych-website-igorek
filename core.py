import re
import logging
import requests
import json
import asyncio
import aiohttp
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import random, io
from features.f_config import get_db
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.offsetbox import OffsetImage, AnnotationBbox

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from config import OLLAMA_API_URL
from features.advice import advice, massage, help as help_texts
from features.sanitize_responses import sanitize_response, sanitize_response_mood
from rag.rag_search import search_relevant_chunks
from rag.template import build_techniques_prompt, build_simple_prompt
from features.dicts import MOODS, REMINDER_TYPES, DIARY_PHRASES, MEDITATION_PHRASES, WATER_PHRASES

user_conversations: Dict[int, Dict] = {}
user_states: Dict[int, Dict] = {}
user_mood_entries: Dict[int, List] = {}
user_reminders: Dict[int, List] = {}

class PsychologyBotCore:
    
    @staticmethod
    def compress_context(user_msg: str, bot_response: str) -> str:
        """Compress conversation context"""
        try:
            prompt = f"""Сожми диалог в одну краткую строку на русском языке, сохранив суть.
Пользователь: {user_msg}
Ассистент: {bot_response}
Сжатый контекст:"""
            response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": "llama3",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {"temperature": 0.5, "max_tokens": 100}
                },
                timeout=10
            )
            if response.status_code != 200:
                return ""
            response_data = response.json()
            compressed = response_data.get("message", {}).get("content", "")
            compressed = compressed.replace("Сжатый контекст:", "").strip()
            compressed = re.sub(r'(</?\|?im_(?:start|end)\|?>|</?>)', '', compressed)
            compressed = re.sub(r'\([A-Za-z\s:.,;!?\'"-]+\)', '', compressed)
            compressed = re.sub(r"(?m)^[ \t]*[A-Za-z']{1,}.*$", '', compressed)
            return compressed
        except Exception as e:
            logger.error(f"Ошибка сжатия: {str(e)}")
            return f"{user_msg[:50]}... → {bot_response[:50]}..."

    @staticmethod
    async def async_search_techniques(query: str, top_k: int = 2):
        return search_relevant_chunks(query, top_k=top_k)

    @staticmethod
    async def build_chat_history(user_id: int, new_message: str) -> list:
        history = user_conversations.get(user_id, {}).get("history", [])
        context = user_conversations.get(user_id, {}).get("context", "")
        
        techniques = []
        try:
            techniques = await asyncio.wait_for(
                PsychologyBotCore.async_search_techniques(new_message), 
                timeout=1.5
            )
        except asyncio.TimeoutError:
            logger.warning("Поиск техник занял слишком много времени")
            techniques = []
        
        if techniques:
            prompt = build_techniques_prompt(techniques, new_message, context)
        else:
            prompt = build_simple_prompt(context)

        messages = [{
            "role": "system",
            "content": prompt
        }]
        for msg in history[-3:]:
            messages.append({"role": "user", "content": msg['user']})
            messages.append({"role": "assistant", "content": msg['bot']})
        
        messages.append({"role": "user", "content": new_message})
        return messages

    @staticmethod
    async def query_ollama(user_id: int, message: str) -> str:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    OLLAMA_API_URL,
                    json={
                        "model": "llama3",
                        "messages": await PsychologyBotCore.build_chat_history(user_id, message),
                        "stream": True,
                        "options": {
                            "temperature": 0.65,
                            "top_k": 40,
                            "top_p": 0.8,
                            "max_tokens": 120,
                            "repeat_penalty": 1.1
                        }
                    },
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status != 200:
                        text = await response.text()
                        logger.error(f"Ollama error {response.status}: {text}")
                        return "🚫 Ошибка при подключении к ИИ"
                    
                    full_response = []
                    async for line in response.content:
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line.decode('utf-8'))
                            if chunk.get('done', False):
                                break
                            full_response.append(chunk.get('message', {}).get('content', ''))
                        except Exception:
                            continue
                    raw = ''.join(full_response).strip()
                    result = sanitize_response(raw)
                    return result.strip() or "🚫 Не получилось сформировать ответ"
        except Exception as e:
            logger.error(f"Ошибка запроса: {str(e)}")
            return "⚠️ Ошибка соединения с ИИ"

    @staticmethod
    def update_history(user_id: int, user_msg: str, bot_response: str):
        """Update conversation history"""
        if user_id not in user_conversations:
            user_conversations[user_id] = {"history": [], "context": ""}
        
        user_conversations[user_id]["history"].append({"user": user_msg, "bot": bot_response})
        new_context = PsychologyBotCore.compress_context(user_msg, bot_response)
        user_conversations[user_id]["context"] = (
            user_conversations[user_id]["context"] + "\n" + new_context
        )[-2000:]
        
        if len(user_conversations[user_id]["history"]) > 7:
            user_conversations[user_id]["history"] = user_conversations[user_id]["history"][-7:]

    @staticmethod
    def clear_history(user_id: int):
        """Clear user's conversation history"""
        if user_id in user_conversations:
            user_conversations[user_id] = {"history": [], "context": ""}

    @staticmethod
    def get_history(user_id: int, limit: int = 5):
        """Get user's conversation history"""
        data = user_conversations.get(user_id, {})
        return {
            "history": data.get("history", [])[-limit:],
            "context": data.get("context", "")
        }

    @staticmethod
    def get_advice_by_category(category: str, page: int = 1):
        """Get advice by category"""
        if category == "massage":
            total_pages = len(massage)
            if page < 1 or page > total_pages:
                page = 1
            return {
                "category": "massage",
                "page": page,
                "total_pages": total_pages,
                "content": massage[page - 1]
            }
        elif category == "breathing":
            from features.advice import breathing
            return {
                "category": "breathing",
                "content": breathing
            }
        elif category == "grounding":
            return {
                "category": "grounding",
                "content": advice[0] if advice else "Метод заземления 5-4-3-2-1"
            }
        elif category == "meditation":
            return {
                "category": "meditation",
                "content": advice[1] if len(advice) > 1 else "Медитация"
            }
        elif category == "emergency":
            return {
                "category": "emergency",
                "content": help_texts[0] if help_texts else "Экстренная помощь"
            }
        return None

    @staticmethod
    def add_mood_entry(user_id: int, emoji: str, mood_state: str, note: Optional[str] = None):
        """Add a mood entry"""
        db = get_db()
        cur = db.cursor()
        cur.execute(
            "INSERT INTO mood_entries (user_id, emoji, mood_state, note) VALUES (%s, %s, %s, %s)",
            (user_id, emoji, mood_state, note)
        )
        db.commit()
        entry_id = cur.lastrowid
        db.close()

        return {
            "id": entry_id,
            "emoji": emoji,
            "mood_state": mood_state,
            "note": note,
            "created_at": datetime.now().isoformat()
        }

    @staticmethod
    def get_mood_entries(user_id: int, limit: int = 50, days: int = None):
        """Get user's mood entries"""
        db = get_db()
        cur = db.cursor(dictionary=True)

        if days:
            week_ago = datetime.now() - timedelta(days=days)
            cur.execute("""
                SELECT id, emoji, mood_state, note, created_at 
                FROM mood_entries 
                WHERE user_id = %s AND created_at >= %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, week_ago, limit))
        else:
            cur.execute("""
                SELECT id, emoji, mood_state, note, created_at 
                FROM mood_entries 
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, limit))
        
        rows = cur.fetchall()
        db.close()
        
        result = []
        for row in rows:
            if isinstance(row, dict):
                row['created_at'] = row['created_at'].isoformat()
                result.append(row)
            else:
                result.append({
                    'id': row[0],
                    'emoji': row[1],
                    'mood_state': row[2],
                    'note': row[3],
                    'created_at': row[4].isoformat()
                })
        return rows

    @staticmethod
    def get_mood_stats(user_id: int, days: int = 7):
        """Get mood statistics for chart generation"""
        db = get_db()
        cur = db.cursor()
        
        week_ago = datetime.now() - timedelta(days=days)
        cur.execute("""
            SELECT mood_state, COUNT(*) AS count
            FROM mood_entries
            WHERE user_id = %s AND created_at >= %s
            GROUP BY mood_state
        """, (user_id, week_ago))
        
        rows = cur.fetchall()
        db.close()
        
        result = []
        for row in rows:
            if row[0] is not None:
                result.append({
                    'mood_state': row[0],
                    'count': row[1]
                })
        
        return result

    @staticmethod
    def generate_mood_chart(user_id: int) -> bytes:
        """Generate mood statistics chart (from your original code)"""
        from features.dicts import MOOD_COLORS
        
        rows = PsychologyBotCore.get_mood_stats(user_id)
        
        if not rows:
            return None
        
        moods = [r["mood_state"].replace("_", " ").capitalize() for r in rows]
        counts = [r["count"] for r in rows]
        max_count = max(counts)
        
        final_colors = []
        golden_assigned = False
        img = mpimg.imread("static/sparkle.png")
        
        for r in rows:
            if not golden_assigned and r["count"] == max_count:
                final_colors.append("#CAB558")
                golden_assigned = True
            else:
                final_colors.append(MOOD_COLORS.get(r["mood_state"], "#CCCCCC"))
        
        plt.figure(figsize=(7.3, 5), facecolor="#818EAA")
        ax = plt.subplot()
        bars = plt.bar(moods, counts, color=final_colors, linewidth=0.4, edgecolor="black")
        
        for bar, count in zip(bars, counts):
            plt.text(bar.get_x() + bar.get_width() / 2, count, str(count),
                    ha="center", va="bottom", fontsize=10, fontweight="bold", color="#232D42")
        
        if golden_assigned:
            try:
                imagebox = OffsetImage(img, zoom=0.1)
                max_index = counts.index(max_count)
                x_pos = bars[max_index].get_x() + bars[max_index].get_width() / 2
                y_pos = bars[max_index].get_height()
                
                ab = AnnotationBbox(imagebox, (x_pos, y_pos),
                                  xybox=(0, -30),
                                  xycoords='data',
                                  boxcoords="offset points",
                                  pad=0.1,
                                  frameon=False)
                ax.add_artist(ab)
            except:
                pass
        
        ax.set_facecolor("#5D6686")
        ax.set_title("Статистика настроения за неделю", fontsize=18,
                    color="white", backgroundcolor="#4E5F83", pad=13)
        ax.set_xlabel("Состояние", fontsize=14, color="white", labelpad=9)
        ax.set_ylabel("Количество записей", fontsize=14, color="white", labelpad=9)
        plt.xticks(fontsize=12, color="#232D42")
        plt.yticks(np.arange(0, max(counts) + 1, 1), color="#1F1F30")
        plt.subplots_adjust(bottom=0.14)
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        
        return buf.getvalue()

    @staticmethod
    def analyze_mood_entries(entries: List[Dict]) -> str:
        """Analyze mood entries using LLM"""
        if not entries:
            return "Нет записей для анализа"
        
        try:
            text_entries = "\n".join([f"{e['emoji']} {e.get('note', '')}" for e in entries])
            prompt = f"""
Ты — эмпатичный психологический ассистент. Проанализируй следующие записи дневника настроения пользователя
и сделай краткий анализ и рекомендации для него на русском языке. Используй эмодзи (например, 🌿, 🌺, 😊)

Записи:
{text_entries}

Твоя задача:
Сначала определи общий эмоциональный фон по имеющимся записям.
Если в записях наблюдаются изменения в настроении, опиши их.
После этого предложи 2–3 персональные рекомендации (мягкие, поддерживающие) на основе записей.
В конце сделай общий вывод.

Важно:
Не повторяй список записей, просто дай вывод.
Не предлагай сложные и длинные рекомендации - придерживайся краткости и простоты.
Не упоминай изменения в настроении, если их нет.

Формат ответа:
Анализ: ...
Рекомендации: ...
"""
            response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": "llama3",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "max_tokens": 500
                    }
                },
                timeout=60
            )

            if response.status_code != 200:
                logger.error(f"Ollama returned status {response.status_code}")
                return "Не удалось получить анализ 😔"

            data = response.json()
            raw_output = data.get("message", {}).get("content", "").strip()
            return sanitize_response_mood(raw_output)

        except Exception as e:
            logger.error(f"Ошибка анализа дневника: {str(e)}")
            return "Произошла ошибка при анализе дневника 😢"

    @staticmethod
    def give_mood_advice(entries: List[Dict]) -> str:
        """Give advice based on mood entries"""
        if not entries:
            return "Нет записей для анализа"
        
        try:
            text_entries = "\n".join([f"{e['emoji']} {e.get('note', '')}" for e in entries])
            prompt = f"""
Ты — эмпатичный психологический ассистент. Проанализируй следующие записи дневника настроения пользователя
и на основе анализа дай пользователю совет. Используй эмодзи (например, 🌿, 🌺, 😊)

Записи:
{text_entries}

Правила:
1. Определи общий эмоциональный фон и главную проблему пользователя.
2. Дай один совет, который больше всего будет походить пользователю (например, предложи технику дыхания, заняться медитацией и т.п.).
3. Давай совет по ситуации, не советуй случайные техники. 
4. Если предложенная техника состоит из нескольких шагов, составь подробную и понятную инструкцию.
5. Используй только проверенные техники, не придумывай свои.

Формат ответа:
Анализ: ...
Совет: ...

Пример инструкции:
✨ Диафрагмальное дыхание ✨
1. 🧘 Прими удобное положение, закрой глаза и положи одну руку на грудь, а другую — на живот (чуть ниже ребер).
2. 👃 С делай глубокий вдох через нос, стараясь, чтобы живот поднимался, а рука на груди оставалась неподвижной.
3. 🕯️ Медленно выдыхай через рот, втягивая живот, как будто задуваешь свечу.
4. 🌿 Сосредоточься на ритме и глубине дыхания, повторяя цикл несколько раз. 
"""
            response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": "llama3",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "max_tokens": 500
                    }
                },
                timeout=60
            )

            if response.status_code != 200:
                logger.error(f"Ollama returned status {response.status_code}")
                return "Не удалось получить совет 😔"

            data = response.json()
            raw_output = data.get("message", {}).get("content", "").strip()
            return sanitize_response_mood(raw_output)

        except Exception as e:
            logger.error(f"Ошибка получения совета: {str(e)}")
            return "Произошла ошибка при получении совета 😢"

    @staticmethod
    def set_reminder(user_id: int, reminder_type: str, time_str: str):
        """Set a reminder for user"""
        if user_id not in user_reminders:
            user_reminders[user_id] = []
        
        user_reminders[user_id] = [r for r in user_reminders[user_id] if r["type"] != reminder_type]
        
        reminder = {
            "type": reminder_type,
            "time": time_str,
            "active": True
        }
        user_reminders[user_id].append(reminder)
        return reminder

    @staticmethod
    def cancel_reminder(user_id: int, reminder_type: str):
        """Cancel a reminder"""
        if user_id in user_reminders:
            user_reminders[user_id] = [r for r in user_reminders[user_id] if r["type"] != reminder_type]
        return True

    @staticmethod
    def get_reminders(user_id: int):
        """Get user's reminders"""
        return user_reminders.get(user_id, [])

    @staticmethod
    def get_reminder_phrase(reminder_type: str) -> str:
        """Get a random phrase for reminder type"""
        if reminder_type == "diary":
            return random.choice(DIARY_PHRASES)
        elif reminder_type == "meditation":
            return random.choice(MEDITATION_PHRASES)
        elif reminder_type == "drink_water":
            return random.choice(WATER_PHRASES)
        else:
            return "Напоминание 🌿"
        

    @staticmethod
    def save_key_results(user_id: int, role: str, survey_key: str, responses: List[int]):
        """Save survey results to database"""
        db = get_db()
        cur = db.cursor()

        responses_json = json.dumps(responses)

        cur.execute("""
            INSERT INTO survey_results (user_id, role, survey_key, responses)
            VALUES (%s, %s, %s, %s)
        """, (user_id, role, survey_key, responses_json))

        db.commit()
        db.close()
        return True

    @staticmethod
    def get_user_surveys(user_id: int):
        """Get all surveys completed by user"""
        db = get_db()
        cur = db.cursor(dictionary=True)

        cur.execute("""
            SELECT survey_key, responses, completed_at
            FROM survey_results
            WHERE user_id = %s
            ORDER BY completed_at DESC
        """, (user_id,))

        rows = cur.fetchall()
        db.close()

        return rows

bot_core = PsychologyBotCore()