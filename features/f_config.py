import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
import mysql.connector
# from config import TOKEN

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# bot = Bot(token=TOKEN)
dp = Dispatcher(storage=MemoryStorage())

PAGE_SIZE = 5
PAGE_SIZE_CONV = 3

def get_db():
    return mysql.connector.connect(host='localhost', user='root', password='', database='bot')