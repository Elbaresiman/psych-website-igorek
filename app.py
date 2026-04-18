from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import logging
from datetime import datetime
from core import bot_core, user_states
from features.dicts import REMINDER_TYPES, MOODS

app = FastAPI(title="Psychology Bot Web Interface")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
web_sessions = {}

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    success: bool

class MoodEntryRequest(BaseModel):
    session_id: str
    emoji: str
    note: Optional[str] = None

class ReminderRequest(BaseModel):
    session_id: str
    reminder_type: str
    time: str

class SurveySaveRequest(BaseModel):
    session_id: str
    role: str
    survey_key: str
    responses: List[int]

def get_user_id(session_id: str) -> int:
    """Get or create user_id for session"""
    if session_id not in web_sessions:
        import hashlib
        hash_object = hashlib.md5(session_id.encode())
        user_id = int(hash_object.hexdigest()[:8], 16) % 1000000

        web_sessions[session_id] = {
            "user_id": user_id,
            "chat_mode": False
        }
    return web_sessions[session_id]["user_id"]

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page"""
    with open("templates/website.html", "r", encoding="utf-8") as f:
        return f.read()


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Handle chat messages"""
    try:
        user_id = get_user_id(request.session_id)
        web_sessions[request.session_id]["chat_mode"] = True
        user_states[user_id] = "chat_mode"

        response = await bot_core.query_ollama(user_id, request.message)
        bot_core.update_history(user_id, request.message, response)
        
        return ChatResponse(
            response=response,
            success=True
        )
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/end/{session_id}")
async def end_chat(session_id: str):
    """End chat session"""
    if session_id in web_sessions:
        web_sessions[session_id]["chat_mode"] = False
        user_id = get_user_id(session_id)
        if user_id in user_states:
            user_states[user_id] = None
    return {"success": True}

@app.get("/api/advice/categories")
async def get_advice_categories():
    """Get all advice categories"""
    return {
        "breathing": "Техника дыхания 🌬️",
        "grounding": "Метод 5-4-3-2-1 🌿",
        "meditation": "Медитация 🧘",
        "massage": "Массаж 💆",
        "emergency": "Экспресс-помощь 🆘"
    }

@app.get("/api/advice/{category}")
async def get_advice(category: str, page: int = 1):
    """Get advice by category"""
    result = bot_core.get_advice_by_category(category, page)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return result

@app.get("/api/advice/breathing/{index}")
async def get_breathing_technique(index: int):
    """Get specific breathing technique"""
    from features.advice import breathing
    if index < 0 or index >= len(breathing):
        raise HTTPException(status_code=404, detail="Technique not found")
    return {
        "index": index,
        "content": breathing[index]
    }

@app.post("/api/mood/entry")
async def add_mood_entry(request: MoodEntryRequest):
    """Add a mood entry"""
    try:
        user_id = get_user_id(request.session_id)
        
        if request.emoji not in MOODS:
            raise HTTPException(status_code=400, detail="Invalid emoji")
        
        entry = bot_core.add_mood_entry(
            user_id=user_id,
            emoji=request.emoji,
            mood_state=MOODS[request.emoji],
            note=request.note
        )
        return {"success": True, "entry": entry}
    except Exception as e:
        logging.error(f"Mood entry error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mood/entries/{session_id}")
async def get_mood_entries(session_id: str, limit: int = 5, days: int = 7):
    """Get user's mood entries"""
    user_id = get_user_id(session_id)
    entries = bot_core.get_mood_entries(user_id, limit, days)
    return {"entries": entries}

@app.post("/api/mood/analyze/{session_id}")
async def analyze_mood(session_id: str):
    """Analyze user's mood entries"""
    user_id = get_user_id(session_id)
    entries = bot_core.get_mood_entries(user_id, days=7)
    
    if not entries:
        return {"analysis": "За последнюю неделю записей нет 🌱"}
    
    analysis = bot_core.analyze_mood_entries(entries)
    return {"analysis": analysis}

@app.post("/api/mood/advice/{session_id}")
async def get_mood_advice(session_id: str):
    """Get advice based on mood entries"""
    user_id = get_user_id(session_id)
    entries = bot_core.get_mood_entries(user_id, days=7)
    
    if not entries:
        return {"advice": "За последнюю неделю записей нет 🌱"}
    
    advice = bot_core.give_mood_advice(entries)
    return {"advice": advice}

@app.get("/api/history/{session_id}")
async def get_history(session_id: str, limit: int = 5):
    """Get chat history"""
    user_id = get_user_id(session_id)
    history = bot_core.get_history(user_id, limit)
    return history

@app.post("/api/history/clear/{session_id}")
async def clear_history(session_id: str):
    """Clear chat history"""
    user_id = get_user_id(session_id)
    bot_core.clear_history(user_id)
    return {"success": True}

@app.get("/api/reminders/types")
async def get_reminder_types():
    """Get available reminder types"""
    return REMINDER_TYPES

@app.get("/api/reminders/{session_id}")
async def get_reminders(session_id: str):
    """Get user's reminders"""
    user_id = get_user_id(session_id)
    reminders = bot_core.get_reminders(user_id)
    return {"reminders": reminders}

@app.post("/api/reminders/set")
async def set_reminder(request: ReminderRequest):
    """Set a reminder"""
    user_id = get_user_id(request.session_id)
    reminder = bot_core.set_reminder(
        user_id=user_id,
        reminder_type=request.reminder_type,
        time_str=request.time
    )
    return {"success": True, "reminder": reminder}

@app.post("/api/reminders/cancel/{session_id}/{reminder_type}")
async def cancel_reminder(session_id: str, reminder_type: str):
    """Cancel a reminder"""
    user_id = get_user_id(session_id)
    bot_core.cancel_reminder(user_id, reminder_type)
    return {"success": True}

from fastapi.responses import Response

@app.get("/api/mood/chart/{session_id}")
async def get_mood_chart(session_id: str):
    """Get mood statistics chart"""
    user_id = get_user_id(session_id)
    chart_bytes = bot_core.generate_mood_chart(user_id)
    
    if not chart_bytes:
        raise HTTPException(status_code=404, detail="No data for chart")
    
    return Response(content=chart_bytes, media_type="image/png")

@app.get("/api/reminders/check/{session_id}")
async def check_reminders(session_id: str):
    """Check for due reminders"""
    user_id = get_user_id(session_id)
    reminders = bot_core.get_reminders(user_id)
    
    current_time = datetime.now().strftime("%H:%M")
    due_reminders = []
    
    reminder_messages = {
        'diary': '🌸 Пора записать своё настроение в дневник!',
        'meditation': '🧘 Сделайте небольшую медитацию для расслабления',
        'drink_water': '💧 Не забудьте выпить воды!',
        'sleep_reminder': '😴 Пора готовиться ко сну',
        'stretch': '🤸 Сделайте небольшую разминку'
    }
    
    for reminder in reminders:
        if reminder['time'] == current_time and reminder.get('active', True):
            due_reminders.append({
                'type': reminder['type'],
                'message': reminder_messages.get(reminder['type'], 'Напоминание 🌿')
            })
    return {"due_reminders": due_reminders}

@app.post("/api/survey/save")
async def save_survey(request: SurveySaveRequest):
    """Save survey results to database"""
    try:
        user_id = get_user_id(request.session_id)
        bot_core.save_key_results(
            user_id=user_id,
            role=request.role,
            survey_key=request.survey_key,
            responses=request.responses
        )
        return {"success": True}
    except Exception as e:
        logging.error(f"Save survey error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)