document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '';
    const sessionId = localStorage.getItem('sessionId');
    
    // Navigation logic
    const mainButtons = document.querySelectorAll('#main-buttons button.main');
    const backButtons = document.querySelectorAll('.back');
    const mainMenu = document.getElementById('main-buttons');
    const sections = document.querySelectorAll('.section');
    
    const diaryMainButton = document.getElementById('diary');
        if (diaryMainButton) {
            diaryMainButton.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                if (targetId === 'diary-section') {
                    switchToSection(targetId);
                    loadDiaryInterface();
                }
            });
        }

    if ('Notification' in window) {
        Notification.requestPermission();
    }
    setInterval(checkReminders, 60000);
    checkReminders();

    const surveyMainButton = document.getElementById('survey');
    if (surveyMainButton) {
        surveyMainButton.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (targetId === 'survey-section') {
                switchToSection(targetId);
            }
        });
    }

    function switchToSection(targetSectionId) {
        mainMenu.classList.remove('fade-in');
        mainMenu.classList.add('fade-out');
        
        sections.forEach(section => {
            section.classList.remove('fade-in');
            section.classList.add('fade-out');
        });
        
        const targetSection = document.getElementById(targetSectionId);
        setTimeout(() => {
            targetSection.classList.remove('fade-out');
            targetSection.classList.add('fade-in');
            
            if (targetSectionId === 'chat-section') {
                loadChatInterface();
            } else if (targetSectionId === 'history-section') {
                loadHistory();
            } else if (targetSectionId === 'diary-section') {
                loadDiaryInterface();
            }
        }, 50);
    }
    
    function returnToMain() {
        sections.forEach(section => {
            section.classList.remove('fade-in');
            section.classList.add('fade-out');
        });
        
        setTimeout(() => {
            mainMenu.classList.remove('fade-out');
            mainMenu.classList.add('fade-in');
        }, 50);
        
        fetch(`${API_BASE}/api/chat/end/${sessionId}`, { method: 'POST' });
    }
    
    // Chat functionality
    function loadChatInterface() {
        const chatSection = document.getElementById('chat-section');
        chatSection.innerHTML = `
            <div class="chat-container">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Напишите сообщение...">
                    <button id="chat-send">Отправить</button>
                </div>
                <button id="chat-exit" class="back">Выход 🔙</button>
            </div>
        `;
        
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatExit = document.getElementById('chat-exit');
        
        const savedMessages = loadChatMessages();
        savedMessages.forEach(msg => {
            addMessage(msg.role, msg.content, false);
        })

        chatSend.addEventListener('click', () => sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        chatExit.addEventListener('click', () => {
            returnToMain();
        });
        
        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            chatInput.value = '';
            
            const typingId = addTypingIndicator();
            
            try {
                const response = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, message })
                });
                
                const data = await response.json();
                removeTypingIndicator(typingId);
                
                if (data.success) {
                    await simulateTyping(data.response);
                } else {
                    addMessage('bot', '❌ Ошибка получения ответа');
                }
            } catch (error) {
                removeTypingIndicator(typingId);
                addMessage('bot', '⚠️ Ошибка соединения');
            }
        }
    }
    
    async function simulateTyping(fullText) {
        const messages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot typing-effect';
        messages.appendChild(messageDiv);

        let currentText = '';

        for (let i = 0; i < fullText.length; i++) {
            currentText += fullText[i];
            messageDiv.textContent = currentText;
            messages.scrollTop = messages.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 18 + Math.random() * 18));
        }

        messageDiv.textContent = fullText;
        messageDiv.classList.remove('typing-effect');
        messageDiv.classList.add('bot');

        const currentMessages = loadChatMessages();
        currentMessages.push({ role: 'bot', content: fullText });
        saveChatMessages(currentMessages);
    }

    function addMessage(role, content, save = true) {
        const messages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = content;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;

        if (save) {
            const currentMessages = loadChatMessages();
            currentMessages.push({ role, content });
            saveChatMessages(currentMessages);
        }
    }
    
    function addTypingIndicator() {
        const messages = document.getElementById('chat-messages');
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.className = 'message bot typing';
        typingDiv.textContent = '...';
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
        return id;
    }
    
    function removeTypingIndicator(id) {
        const element = document.getElementById(id);
        if (element) element.remove();
    }

    function saveChatMessages(messages) {
        localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    }

    function loadChatMessages() {
        const saved = localStorage.getItem(`chat_${sessionId}`);
        return saved ? JSON.parse(saved) : [];
    }
    
    function clearChatMessages() {
        localStorage.removeItem(`chat_${sessionId}`);
    }


    // Advice section
    const adviceButtons = {
        'advice-breathing': { 
            category: 'breathing',
            title: 'Техника дыхания 🌬️',
            multiPage: true,
            totalPages: 3
        },
        'advice-method': { 
            category: 'grounding',
            title: 'Метод 5-4-3-2-1 🌿',
            multiPage: false
        },
        'advice-meditation': { 
            category: 'meditation',
            title: 'Медитация 🧘',
            multiPage: false
        },
        'advice-massage': { 
            category: 'massage',
            title: 'Массаж 💆',
            multiPage: true,
            totalPages: 5
        },
        'advice-help': { 
            category: 'emergency',
            title: 'Экспресс-помощь 🆘',
            multiPage: false
        }
    };

    let currentAdviceState = {
        category: null,
        page: 1,
        totalPages: 1,
        content: ''
    };

    function attachAdviceButtonListeners() {
        Object.entries(adviceButtons).forEach(([buttonId, config]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.replaceWith(button.cloneNode(true));
                const newButton = document.getElementById(buttonId);
                
                newButton.addEventListener('click', async () => {
                    const adviceSection = document.getElementById('advice-section');
                    adviceSection.classList.remove('fade-in');
                    adviceSection.classList.add('fade-out');
                    
                    try {
                        if (config.multiPage) {
                            let response;
                            if (config.category === 'massage') {
                                response = await fetch(`${API_BASE}/api/advice/massage?page=1`);
                            } else if (config.category === 'breathing') {
                                response = await fetch(`${API_BASE}/api/advice/breathing/0`);
                            }
                            
                            const data = await response.json();
                            let content = config.category === 'massage' ? data.content : data.content;
                            let totalPages = config.category === 'massage' ? data.total_pages : config.totalPages;
                            
                            setTimeout(() => {
                                showAdviceContent(
                                    config.category, 
                                    config.title, 
                                    content, 
                                    1, 
                                    totalPages
                                );
                                adviceSection.classList.remove('fade-out');
                                adviceSection.classList.add('fade-in');
                            }, 150);
                            
                        } else {
                            const response = await fetch(`${API_BASE}/api/advice/${config.category}`);
                            const data = await response.json();
                            
                            setTimeout(() => {
                                showAdviceContent(
                                    config.category,
                                    config.title,
                                    data.content,
                                    1,
                                    1
                                );
                                adviceSection.classList.remove('fade-out');
                                adviceSection.classList.add('fade-in');
                            }, 150);
                        }
                    } catch (error) {
                        console.error('Error fetching advice:', error);
                        adviceSection.classList.remove('fade-out');
                        adviceSection.classList.add('fade-in');
                        alert('Ошибка при загрузке совета');
                    }
                });
            }
        });
        
        const adviceBackButton = document.getElementById('advice-back');
        if (adviceBackButton) {
            adviceBackButton.replaceWith(adviceBackButton.cloneNode(true));
            const newBackButton = document.getElementById('advice-back');
            newBackButton.addEventListener('click', returnToMain);
        }
    }

    function showAdviceContent(category, title, content, page = 1, totalPages = 1) {
        const adviceSection = document.getElementById('advice-section');
        
        currentAdviceState = {
            category,
            page,
            totalPages,
            content
        };
        
        let adviceHtml = `
            <div class="advice-container">
                <div class="advice-header">
                    <h2>${title}</h2>
        `;
        
        if (totalPages > 1) {
            adviceHtml += `<div class="page-indicator">Страница ${page} из ${totalPages}</div>`;
        }
        
        adviceHtml += `
                </div>
                <div class="advice-content" id="advice-content">
                    ${content}
                </div>
                <div class="advice-navigation">
        `;
        
        if (totalPages > 1) {
            if (page > 1) {
                adviceHtml += `<button id="advice-prev" class="advice-nav-btn">⬅️ Предыдущая</button>`;
            }
            if (page < totalPages) {
                adviceHtml += `<button id="advice-next" class="advice-nav-btn">Следующая ➡️</button>`;
            }
        }
        
        adviceHtml += `
                </div>
                <button id="advice-back-to-menu" class="back">◀️ К списку советов</button>
            </div>
        `;
        
        adviceSection.innerHTML = adviceHtml;
        
        adviceSection.classList.add('fade-in');
        
        if (document.getElementById('advice-prev')) {
            document.getElementById('advice-prev').addEventListener('click', () => {
                
                setTimeout(() => {
                    navigateAdvicePage(category, page - 1);
                }, 50);
            });
        }
        
        if (document.getElementById('advice-next')) {
            document.getElementById('advice-next').addEventListener('click', () => {
                
                setTimeout(() => {
                    navigateAdvicePage(category, page + 1);
                }, 50);
            });
        }
        
        document.getElementById('advice-back-to-menu').addEventListener('click', () => {
            adviceSection.classList.remove('fade-in');
            adviceSection.classList.add('fade-out');
            
            setTimeout(() => {
                showAdviceMenu();
                adviceSection.classList.remove('fade-out');
                adviceSection.classList.add('fade-in');
            }, 150);
        });
    }

    function showAdviceMenu() {
        const adviceSection = document.getElementById('advice-section');
        
        adviceSection.innerHTML = `
            <button id="advice-breathing">Техника дыхания 🌬️</button>
            <button id="advice-method">Метод 5-4-3-2-1 🌿</button>
            <button id="advice-meditation">Медитация 🧘</button>
            <button id="advice-massage">Массаж 💆</button>
            <button id="advice-help">Экспресс-помощь 🆘</button>
            <button id="advice-back" class="back">Назад ◀️</button>
        `;
        attachAdviceButtonListeners();
    }

    async function navigateAdvicePage(category, newPage) {
        try {
            let response;
            if (category === 'massage') {
                response = await fetch(`${API_BASE}/api/advice/massage?page=${newPage}`);
            } else if (category === 'breathing') {
                response = await fetch(`${API_BASE}/api/advice/breathing/${newPage - 1}`);
            }
            
            const data = await response.json();
            
            let title = category === 'massage' ? 'Массаж 💆' : 'Техника дыхания 🌬️';
            let content = data.content;
            let totalPages = category === 'massage' ? data.total_pages : 3;

            showAdviceContent(category, title, content, newPage, totalPages);
        } catch (error) {
            console.error('Error navigating advice:', error);
        }
    }

    // History section
    async function loadHistory() {
        try {
            const response = await fetch(`${API_BASE}/api/history/${sessionId}?limit=5`);
            const data = await response.json();
            
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
            
            if (data.history && data.history.length > 0) {
                data.history.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <strong>Вы:</strong> ${msg.user}<br>
                        <strong>Бот:</strong> ${msg.bot}
                        <hr>
                    `;
                    historyList.appendChild(item);
                });
            } else {
                historyList.innerHTML = '<p>История пуста</p>';
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    const historyList = document.getElementById('history-list');
    const historyClean = document.getElementById('history-clean');
    if (historyClean) {
        historyClean.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/api/history/clear/${sessionId}`, { method: 'POST' });
                clearChatMessages();
                await loadHistory();
                if (historyList.innerHTML === '<p>История пуста</p>') alert('Очищать нечего.');
                else alert('История очищена');
            } catch (error) {
                console.error('Error clearing history:', error);
            }
        });
    }
    
    // Diary section
    function loadDiaryInterface() {
        console.log('Diary section loaded');
    }
    
    mainButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                switchToSection(targetId);
            }
        });
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', returnToMain);
    });
    
    const helpButton = document.getElementById('help');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            switchToSection('help-section');
        });
    }

    attachAdviceButtonListeners();

    let currentDiaryState = {
        step: 'menu',
        selectedEmoji: null,
        selectedMood: null
    };

    const MOODS = {
        "😊": "весёлое",
        "🙂": "нейтральное",
        "😢": "грустное",
        "😡": "злое",
        "😴": "уставшее",
        "😌": "в спокойствии",
    };

    const EMOJI_KEYBOARD = [
        ['😊', '🙂', '😢'],
        ['😡', '😴', '😌']
    ];

    function loadDiaryInterface() {
        currentDiaryState = {step: 'menu', selectedEmoji: null, selectedMood: null}
        showDiaryMenu();

        fetch(`${API_BASE}/api/mood/entries/${sessionId}?limit=1&days=365`)
        .then(response => response.json())
        .then(data => {
            const entryCount = data.entries.length;
            const viewButton = document.getElementById('diary-view');
            if (viewButton && entryCount > 0) {
                viewButton.textContent = `Посмотреть записи 📖`;
            }
        })
        .catch(err => console.log(`Could not fetch entry count, ${err}`));
    }

    function showDiaryMenu() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <button id="diary-log">Записать настроение ✍️</button>
            <button id="diary-view">Посмотреть записи 📖</button>
            <button id="diary-statistics">Статистика 📊</button>
            <button id="diary-analysis">Анализ настроения 🧠</button>
            <button id="diary-advice">Совет по настроению ✨</button>
            <button id="diary-reminders">Напоминания ⏰</button>
            <button id="diary-back" class="back">Назад ◀️</button>
        `;
        
        attachDiaryMenuListeners();
        currentDiaryState.step = 'menu';
    }
    
    function attachDiaryMenuListeners() {
        document.getElementById('diary-log')?.addEventListener('click', () => {
            fadeAndShow(showEmojiSelection);
        });
        document.getElementById('diary-view')?.addEventListener('click', () => {
            fadeAndShow(loadDiaryEntries);
        });
        document.getElementById('diary-statistics')?.addEventListener('click', () => {
            fadeAndShow(showDiaryStatistics);
        });
        document.getElementById('diary-analysis')?.addEventListener('click', () => {
            fadeAndShow(analyzeDiary);
        });
        document.getElementById('diary-advice')?.addEventListener('click', () => {
            fadeAndShow(getDiaryAdvice);
        });
        document.getElementById('diary-reminders')?.addEventListener('click', () => {
            fadeAndShow(showRemindersMenu);
        });
        document.getElementById('diary-back')?.addEventListener('click', returnToMain);
    }

    function fadeAndShow(callback) {
        const diarySection = document.getElementById('diary-section');
        diarySection.classList.remove('fade-in');
        diarySection.classList.add('fade-out');
        
        setTimeout(() => {
            callback();
            diarySection.classList.remove('fade-out');
            diarySection.classList.add('fade-in');
        }, 150);
    }

    function showEmojiSelection() {
        const diarySection = document.getElementById('diary-section');
        
        let emojiHtml = `
            <div class="diary-emoji-container">
                <h3>Выберите ваше настроение:</h3>
                <div class="emoji-grid">
        `;
        
        EMOJI_KEYBOARD.forEach(row => {
            emojiHtml += '<div class="emoji-row">';
            row.forEach(emoji => {
                emojiHtml += `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`;
            });
            emojiHtml += '</div>';
        });
        
        emojiHtml += `
                </div>
                <button id="emoji-back" class="back">◀️ Назад</button>
            </div>
        `;
        
        diarySection.innerHTML = emojiHtml;
        
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                currentDiaryState.selectedEmoji = emoji;
                currentDiaryState.selectedMood = MOODS[emoji];
                showNoteInput();
            });
        });
        
        document.getElementById('emoji-back').addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
        
        currentDiaryState.step = 'emoji';
    }

    function showNoteInput() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-note-container">
                <h3>Вы выбрали: ${currentDiaryState.selectedEmoji} (${currentDiaryState.selectedMood})</h3>
                <p>Хотите добавить комментарий?</p>
                <textarea id="diary-note" placeholder="Напишите ваш комментарий здесь..." rows="4"></textarea>
                <div class="note-buttons">
                    <button id="note-skip">Пропустить ⏭️</button>
                    <button id="note-save">Сохранить 💾</button>
                </div>
                <button id="note-back" class="back">◀️ Выбрать другой смайлик</button>
            </div>
        `;
        
        document.getElementById('note-skip').addEventListener('click', () => {
            saveMoodEntry(null);
        });
        
        document.getElementById('note-save').addEventListener('click', () => {
            const note = document.getElementById('diary-note').value.trim();
            saveMoodEntry(note || null);
        });
        
        document.getElementById('note-back').addEventListener('click', () => {
            fadeAndShow(showEmojiSelection);
        });
        
        currentDiaryState.step = 'note';
    }

    async function saveMoodEntry(note) {
        try {
            const response = await fetch(`${API_BASE}/api/mood/entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    emoji: currentDiaryState.selectedEmoji,
                    note: note
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccessMessage('Запись сохранена! 🌸');
            } else {
                showErrorMessage('Ошибка при сохранении');
            }
        } catch (error) {
            console.error('Error saving mood:', error);
            showErrorMessage('Ошибка при сохранении');
        }
    }

    function showSuccessMessage(message) {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-message success">
                <p>${message}</p>
                <button id="message-back" class="back">◀️ В меню дневника</button>
            </div>
        `;
        
        document.getElementById('message-back').addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    function showErrorMessage(message) {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-message error">
                <p>❌ ${message}</p>
                <button id="message-back" class="back">◀️ В меню дневника</button>
            </div>
        `;
        
        document.getElementById('message-back').addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    async function loadDiaryEntries() {
        try {
            const response = await fetch(`${API_BASE}/api/mood/entries/${sessionId}?limit=50&days=365`);
            const data = await response.json();
            
            const diarySection = document.getElementById('diary-section');
            
            if (!data.entries || data.entries.length === 0) {
                diarySection.innerHTML = `
                    <div class="diary-entries">
                        <p>Записей пока нет 🌼</p>
                        <button id="entries-back" class="back">◀️ Назад</button>
                    </div>
                `;
            } else {
                let entriesHtml = '<div class="diary-entries"><h3>Ваши записи:</h3>';
                
                data.entries.reverse().forEach(entry => {
                    const date = new Date(entry.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    entriesHtml += `
                        <div class="diary-entry-card">
                            <div class="entry-header">
                                <span class="entry-emoji">${entry.emoji}</span>
                                <span class="entry-date">${date}</span>
                            </div>
                            <div class="entry-mood">${entry.mood_state}</div>
                            ${entry.note ? `<div class="entry-note">${entry.note}</div>` : ''}
                        </div>
                    `;
                });
                
                entriesHtml += `<button id="entries-back" class="back">◀️ Назад</button></div>`;
                diarySection.innerHTML = entriesHtml;
            }
            
            document.getElementById('entries-back').addEventListener('click', () => {
                fadeAndShow(showDiaryMenu);
            });
            
        } catch (error) {
            console.error('Error loading entries:', error);
            showErrorMessage('Ошибка при загрузке записей');
        }
    }

    async function showDiaryStatistics() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-stats">
                <h3>Статистика настроения</h3>
                <div id="chart-container" style="text-align: center; min-height: 300px;">
                    <p class="loading">Загрузка графика... 📊</p>
                </div>
                <button id="stats-back" class="back">◀️ Назад</button>
            </div>
        `;
        
        try {
            const chartResponse = await fetch(`${API_BASE}/api/mood/chart/${sessionId}`);
            
            if (chartResponse.ok) {
                const chartBlob = await chartResponse.blob();
                const chartUrl = URL.createObjectURL(chartBlob);
                
                document.getElementById('chart-container').innerHTML = `
                    <img src="${chartUrl}" alt="Mood Statistics Chart" style="max-width: 100%; border-radius: 10px;">
                `;
            } else {
                const entriesResponse = await fetch(`${API_BASE}/api/mood/entries/${sessionId}?days=7`);
                const entriesData = await entriesResponse.json();
                
                document.getElementById('chart-container').innerHTML = `
                    <p>За последнюю неделю у вас записей: ${entriesData.entries.length}</p>
                    <p style="color: #666; margin-top: 20px;">Недостаточно данных для построения графика 🌱</p>
                `;
            }
        } catch (error) {
            console.error('Error loading chart:', error);
            document.getElementById('chart-container').innerHTML = `
                <p>Ошибка при загрузке статистики</p>
            `;
        }
        
        document.getElementById('stats-back').addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    async function analyzeDiary() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-analysis">
                <h3>Анализ настроения</h3>
                <p class="loading">Анализирую ваши записи... 🧠</p>
            </div>
        `;
        
        try {
            const response = await fetch(`${API_BASE}/api/mood/analyze/${sessionId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            diarySection.innerHTML = `
                <div class="diary-analysis">
                    <h3>Анализ настроения</h3>
                    <div class="analysis-content">${data.analysis}</div>
                    <button id="analysis-back" class="back">◀️ Назад</button>
                </div>
            `;
        } catch (error) {
            diarySection.innerHTML = `
                <div class="diary-analysis">
                    <h3>Ошибка</h3>
                    <p>Не удалось выполнить анализ</p>
                    <button id="analysis-back" class="back">◀️ Назад</button>
                </div>
            `;
        }
        
        document.getElementById('analysis-back')?.addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    async function getDiaryAdvice() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="diary-advice">
                <h3>Совет по настроению</h3>
                <p class="loading">Думаю над советом... ✨</p>
            </div>
        `;
        
        try {
            const response = await fetch(`${API_BASE}/api/mood/advice/${sessionId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            diarySection.innerHTML = `
                <div class="diary-advice">
                    <h3>Совет по настроению</h3>
                    <div class="advice-content">${data.advice}</div>
                    <button id="mood-advice-back" class="back">◀️ Назад</button>
                </div>
            `;
        } catch (error) {
            diarySection.innerHTML = `
                <div class="diary-advice">
                    <h3>Ошибка</h3>
                    <p>Не удалось получить совет</p>
                    <button id="mood-advice-back" class="back">◀️ Назад</button>
                </div>
            `;
        }
        
        document.getElementById('mood-advice-back')?.addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    // Reminders menu
    function showRemindersMenu() {
        const diarySection = document.getElementById('diary-section');
        
        diarySection.innerHTML = `
            <div class="reminders-container">
                <h3>Напоминания ⏰</h3>
                <button id="reminder-diary" class="reminder-btn">Дневник 📝</button>
                <button id="reminder-meditation" class="reminder-btn">Медитация 🧘</button>
                <button id="reminder-water" class="reminder-btn">Пить воду 💧</button>
                <button id="reminder-sleep" class="reminder-btn">Сон 😴</button>
                <button id="reminder-stretch" class="reminder-btn">Разминка 🤸</button>
                <button id="reminders-back" class="back">◀️ Назад</button>
            </div>
        `;
        
        document.getElementById('reminder-diary')?.addEventListener('click', () => {
            showTimeSelection('diary');
        });
        
        document.getElementById('reminder-meditation')?.addEventListener('click', () => {
            showTimeSelection('meditation');
        });
        
        document.getElementById('reminder-water')?.addEventListener('click', () => {
            showTimeSelection('drink_water');
        });
        
        document.getElementById('reminder-sleep')?.addEventListener('click', () => {
            showTimeSelection('sleep_reminder');
        });
        
        document.getElementById('reminder-stretch')?.addEventListener('click', () => {
            showTimeSelection('stretch');
        });
        
        document.getElementById('reminders-back').addEventListener('click', () => {
            fadeAndShow(showDiaryMenu);
        });
    }

    function showTimeSelection(reminderType) {
        const diarySection = document.getElementById('diary-section');
        
        let hours = '';
        for (let i = 8; i <= 22; i++) {
            hours += `<button class="time-btn" data-time="${i}:00">${i}:00</button>`;
        }
        
        diarySection.innerHTML = `
            <div class="time-selection">
                <h3>Выберите время для напоминания:</h3>
                <p class="hint">В это время мы отправим Вам уведомление 🌿</p>
                <div class="time-grid">
                    ${hours}
                </div>
                <button id="time-back" class="back">◀️ Назад</button>
            </div>
        `;
        
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const time = btn.dataset.time;
                
                try {
                    await fetch(`${API_BASE}/api/reminders/set`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            session_id: sessionId,
                            reminder_type: reminderType,
                            time: time
                        })
                    });
                    
                    showSuccessMessage(`Напоминание установлено на ${time}`);

                    if (Notification.permission == 'granted') {
                        new Notification('✅ Напоминание установлено', {
                            body: `Мы напомним вам в ${time}`,
                            icon: '/static/icon.png'
                        });
                    }
                } catch (error) {
                    showErrorMessage('Ошибка при установке напоминания');
                }
            });
        });
        
        document.getElementById('time-back').addEventListener('click', () => {
            fadeAndShow(showRemindersMenu);
        });
    }

    async function checkReminders() {
        try {
            const response = await fetch(`${API_BASE}/api/reminders/check/${sessionId}`);
            const data = await response.json();
            
            if (data.due_reminders && data.due_reminders.length > 0) {
                data.due_reminders.forEach(reminder => {
                    showNotification(reminder.type, reminder.message);
                });
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }

    function showNotification(type, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = getReminderTitle(type);
            new Notification(title, {
                body: message,
                icon: '/static/icon.png',
                badge: '/static/badge.png'
            });
        }
        showInAppPopup(type, message);
    }

    function getReminderTitle(type) {
        const titles = {
            'diary': '📝 Дневник настроения',
            'meditation': '🧘 Медитация',
            'drink_water': '💧 Напоминание',
            'sleep_reminder': '😴 Сон',
            'stretch': '🤸 Разминка'
        };
        return titles[type] || 'Напоминание 🌿';
    }

    function showInAppPopup(type, message) {
        const existingPopup = document.getElementById('reminder-popup');
        if (existingPopup) existingPopup.remove();
        
        const popup = document.createElement('div');
        popup.id = 'reminder-popup';
        popup.className = 'reminder-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <span>${getReminderTitle(type)}</span>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <p>${message}</p>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn later">Напомнить позже</button>
                    <button class="popup-btn ok">Хорошо</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 10);
        
        popup.querySelector('.popup-close').addEventListener('click', () => closePopup(popup));
        popup.querySelector('.later').addEventListener('click', () => {
            closePopup(popup);
            setTimeout(() => {
                if (type === 'diary') {
                    showNotification(type, 'Время записать своё настроение 🌸');
                }
            }, 15 * 60 * 1000);
        });
        popup.querySelector('.ok').addEventListener('click', () => {
            closePopup(popup);
            if (type === 'diary') {
                switchToSection('diary-section');
                loadDiaryInterface();
            }
        });
    }

    function closePopup(popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }

    let surveyState = {
        isActive: false,
        role: null,
        currentSurvey: null,
        currentQuestionIndex: 0,
        questionsList: [],
        responses: {
            surveyOne: [],
            surveyTwo: [],
            surveyThree: []
        },
        completedSurveys: []
    };

    const surveyQuestions = {
        surveyOne: {
            title: 'Цифровая усталость',
            blocks: {
                'Блок A: Когнитивная цифровая усталость': [
                    'После длительной работы с устройствами мне трудно сконцентрироваться',
                    'Я чувствую «туман в голове» после видеоконференций или онлайн-обучения',
                    'Мне сложно запоминать информацию, полученную в цифровом формате',
                    'Я делаю больше ошибок при цифровой работе к концу дня',
                    'Мне требуется больше времени на выполнение цифровых задач, чем раньше'
                ],
                'Блок B: Эмоциональная цифровая усталость': [
                    'Я чувствую раздражение или тревогу от количества уведомлений',
                    'Мне надоело постоянное присутствие в онлайн-пространстве',
                    'Я чувствую эмоциональное истощение после соцсетей',
                    'Цифровое общение кажется мне поверхностным и утомительным',
                    'Я чувствую себя «выгоревшим» от цифровых коммуникаций'
                ],
                'Блок C: Физическая цифровая усталость': [
                    'У меня болят глаза после работы с экранами',
                    'Я испытываю головные боли, связанные с использованием устройств',
                    'У меня ухудшилась осанка из-за использования гаджетов',
                    'Я чувствую общую физическую усталость от цифровой работы',
                    'У меня нарушается сон из-за вечернего использования устройств'
                ],
                'Блок D: Поведенческие проявления': [
                    'Я откладываю проверку сообщений/почты',
                    'Я игнорирую уведомления намеренно',
                    'Я чувствую желание «сбежать» от всех устройств',
                    'Я использую устройства на автопилоте, без реальной необходимости',
                    'Я замечаю, что проверяю устройства даже в отпуске/выходные'
                ]
            }
        },
        surveyTwo: {
            title: 'Шкала Ликерта',
            main: [
                'Я умею эффективно формулировать запросы к ИИ (например, ChatGPT), чтобы получить точные ответы.',
                'Я знаю, как проверить достоверность ответа ИИ, сравнивая с надежными источниками.',
                'Я могу распознать предвзятость или ошибки в ответе ИИ.',
                'Я применяю ИИ для обучения, и это улучшает мое понимание материала.',
                'Я осознаю этические аспекты использования ИИ.',
                'При получении ответа от ИИ я всегда подтверждаю информацию дополнительными источниками.',
                'Я чувствую себя уверенно в использовании ИИ для решения задач, но не полагаюсь на него слепо.',
                'Я обсуждаю ответы ИИ с одногруппниками или преподавателями, чтобы проверить их точность.'
            ],
            student: [
                'Я получаю обучение по использованию ИИ в университете.',
                'ИИ помогает мне в учебе, но я боюсь злоупотреблений.',
                'Я могу самостоятельно определить, когда ответ ИИ неверен или предвзят.'
            ],
            teacher: [
                'Я обучаю студентов использованию ИИ в аудиториях.',
                'Студенты часто некритично используют ИИ.',
                'У нас в университете есть политики по интеграции ИИ в образование.'
            ]
        },
        surveyThree: {
            title: 'Опросник Чена',
            questions: [
                'Мне не раз говорили, что я провожу слишком много времени в Интернете.',
                'Я чувствую себя некомфортно, когда не бываю в Интернете в течение определенного периода времени.',
                'Я замечаю, что все больше и больше времени провожу в сети.',
                'Я чувствую беспокойство и раздражение, когда Интернет отключен или недоступен.',
                'Я чувствую себя полным сил, пребывая онлайн, несмотря на предварительную усталость.',
                'Я остаюсь в сети в течение более длительного времени, чем намеревался.',
                'Хотя использование Интернета негативно влияет на мои отношения с людьми, количество времени, потраченное на Интернет, остается неизменным.',
                'Несколько раз я спал меньше четырех часов из-за того, что "завис" в Интернете.',
                'За последние шесть месяцев я стал гораздо больше времени проводить в сети.',
                'Я переживаю или расстраиваюсь, если приходится прекратить пользоваться Интернетом.',
                'Мне не удается преодолеть желание зайти в сеть.',
                'Я замечаю, что выхожу в Интернет вместо личной встречи с друзьями.',
                'У меня болит спина или я испытываю какой-либо другой физический дискомфорт после сидения в Интернете.',
                'Мысль зайти в Интернет приходит мне первой, когда я просыпаюсь утром.',
                'Пребывание в Интернете привело к возникновению у меня определенных неприятностей в школе или на работе.',
                'Мое общение с членами семьи сокращается из-за использования Интернета.',
                'Я меньше отдыхаю из-за использования Интернета.',
                'Даже отключившись от Интернета после выполненной работы, у меня не получается справиться с желанием войти в Сеть снова.',
                'Моя жизнь была бы безрадостной, если бы не было Интернета.',
                'Пребывание в Интернете негативно повлияло на мое физическое самочувствие.',
                'Я стараюсь меньше тратить времени в Интернете, но безуспешно.',
                'Для меня становится обычным спать меньше, чтобы провести больше времени в Интернете.',
                'Мне необходимо проводить все больше времени в Интернете, чтобы получить то же удовлетворение, что и раньше.',
                'Иногда у меня не получается поесть в нужное время из-за того, что я сижу в Интернете.',
                'Я чувствую себя усталым днем из-за того, что просидел допоздна в Интернете.'
            ]
        }
    };

    // Survey section
    function loadSurveyInterface() {
        loadSurveyState();
        showRoleSelection();
    }

    function loadSurveyState() {
        const savedRole = localStorage.getItem('surveyRole');
        const savedCompleted = localStorage.getItem('surveyCompleted');

        if (savedRole) {
            surveyState.role = savedRole;
        }
        if (savedCompleted) {
            surveyState.completedSurveys = JSON.parse(savedCompleted);
        }

        updateSurveyButtonVisibility();
    }

    function saveSurveyRole(role) {
        surveyState.role = role;
        localStorage.setItem('surveyRole', role);
    }

    function saveCompletedSurveys() {
        localStorage.setItem('surveyCompleted', JSON.stringify(surveyState.completedSurveys));
        updateSurveyButtonVisibility();
    }

    function updateSurveyButtonVisibility() {
        const floatingBtn = document.getElementById('survey-floating-btn');
        if (floatingBtn) {
            if (surveyState.completedSurveys.length === 3) {
                floatingBtn.style.display = 'none';
            } else {
                floatingBtn.style.display = 'flex';
            }
        }
    }

    function showRoleSelection() {
        if (surveyState.role) {
            showSurveySelection();
            return;
        }
        const surveyContent = document.getElementById('survey-content');
        surveyContent.innerHTML = `
            <div class="survey-container">
                <div class="survey-header">
                    <h2>Тестирование по трём шкалам</h2>
                    <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                </div>
                <div class="roles">
                    <button id="role-teacher">Преподаватель</button>
                    <button id="role-student">Студент</button>
                </div>
            </div>
        `;
        
        document.getElementById('role-teacher').addEventListener('click', () => {
            surveyState.role = 'teacher';
            saveSurveyRole('teacher');
            showSurveySelection();
        });
        
        document.getElementById('role-student').addEventListener('click', () => {
            surveyState.role = 'student';
            saveSurveyRole('student');
            showSurveySelection();
        });
        
        document.getElementById('survey-close-top').addEventListener('click', () => {
            closeSurveySection();
        });
    }

    function showSurveySelection() {
        const surveyContent = document.getElementById('survey-content');

        if (surveyState.completedSurveys.length === 3) {
            surveyContent.innerHTML = `
                <div class="survey-container">
                    <div class="survey-header">
                        <h2>Тестирование по трём шкалам</h2>
                        <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                    </div>
                    <div class="completion-message">
                        <p>✅ Все опросы завершены!</p>
                        <p>Спасибо за участие!</p>
                    </div>
                </div>
            `;
            document.getElementById('survey-close-top')?.addEventListener('click', () => closeSurveySection());
            return;
        }

        let surveysHtml = `
            <div class="survey-container">
                <div class="survey-header">
                    <h2>Выберите опрос</h2>
                    <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                </div>
                <div class="survey-buttons">
        `;
        
        if (!surveyState.completedSurveys.includes('surveyOne')) {
            surveysHtml += `<button id="start-survey-one" class="survey-nav-btn">Цифровая усталость</button>`;
        }
        if (!surveyState.completedSurveys.includes('surveyTwo')) {
            surveysHtml += `<button id="start-survey-two" class="survey-nav-btn">Шкала Ликерта</button>`;
        }
        if (!surveyState.completedSurveys.includes('surveyThree')) {
            surveysHtml += `<button id="start-survey-three" class="survey-nav-btn">Опросник Чена</button>`;
        }
        
        if (surveyState.completedSurveys.length === 3) {
            surveysHtml += `<p style="text-align: center; margin-top: 20px;">✅ Все опросы завершены! Спасибо за участие!</p>`;
            document.getElementById('survey').style.display = 'none';
        }
        
        surveysHtml += `</div></div>`;
        surveyContent.innerHTML = surveysHtml;
        
        document.getElementById('start-survey-one')?.addEventListener('click', () => startSurvey('surveyOne'));
        document.getElementById('start-survey-two')?.addEventListener('click', () => startSurvey('surveyTwo'));
        document.getElementById('start-survey-three')?.addEventListener('click', () => startSurvey('surveyThree'));
        document.getElementById('survey-close-top')?.addEventListener('click', () => closeSurveySection());
    }

    function startSurvey(surveyKey) {
        surveyState.currentSurvey = surveyKey;
        surveyState.currentQuestionIndex = 0;
        
        if (surveyKey === 'surveyOne') {
            surveyState.questionsList = [];
            for (const block in surveyQuestions.surveyOne.blocks) {
                surveyState.questionsList.push(...surveyQuestions.surveyOne.blocks[block]);
            }
            showSurveyQuestion();
        } else if (surveyKey === 'surveyTwo') {
            surveyState.questionsList = [...surveyQuestions.surveyTwo.main];
            if (surveyState.role === 'student') {
                surveyState.questionsList.push(...surveyQuestions.surveyTwo.student);
            } else if (surveyState.role === 'teacher') {
                surveyState.questionsList.push(...surveyQuestions.surveyTwo.teacher);
            }
            showSurveyQuestion();
        } else if (surveyKey === 'surveyThree') {
            surveyState.questionsList = [...surveyQuestions.surveyThree.questions];
            showSurveyQuestion();
        }
    }

    function showSurveyQuestion() {
        const surveyContent = document.getElementById('survey-content');
        const question = surveyState.questionsList[surveyState.currentQuestionIndex];
        const progress = `${surveyState.currentQuestionIndex + 1}/${surveyState.questionsList.length}`;
        
        surveyContent.innerHTML = `
            <div class="survey-container">
                <div class="survey-header">
                    <h2>${surveyQuestions[surveyState.currentSurvey].title}</h2>
                    <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                </div>
                <div class="survey-progress">Вопрос ${progress}</div>
                <div class="survey-question">
                    <div class="question-text">${question}</div>
                    <div class="rating-buttons" id="rating-buttons"></div>
                </div>
                <button id="cancel-survey" class="back" style="margin-top: 20px;">◀️ Назад к опросам</button>
            </div>
        `;
        
        const ratingContainer = document.getElementById('rating-buttons');
        for (let i = 1; i <= 5; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'rating-btn';
            btn.addEventListener('click', () => storeResponse(i));
            ratingContainer.appendChild(btn);
        }
        
        document.getElementById('survey-close-top')?.addEventListener('click', () => closeSurveySection());
        document.getElementById('cancel-survey')?.addEventListener('click', () => {
            showSurveySelection();
        });
    }

    function storeResponse(value) {
        surveyState.responses[surveyState.currentSurvey].push(value);
        surveyState.currentQuestionIndex++;
        
        if (surveyState.currentQuestionIndex < surveyState.questionsList.length) {
            showSurveyQuestion();
        } else {
            completeSurvey();
        }
    }

    function completeSurvey() {
        if (!surveyState.completedSurveys.includes(surveyState.currentSurvey)) {
            surveyState.completedSurveys.push(surveyState.currentSurvey);
            saveCompletedSurveys();
        }

        const responses = surveyState.responses[surveyState.currentSurvey];
        saveSurveyToDatabase(surveyState.currentSurvey, responses);

        saveCompletedSurveys();
        
        console.log(`Responses for ${surveyState.currentSurvey}:`, surveyState.responses[surveyState.currentSurvey]);
        
        const surveyContent = document.getElementById('survey-content');
        
        if (surveyState.completedSurveys.length === 3) {
            surveyContent.innerHTML = `
                <div class="survey-container">
                    <div class="survey-header">
                        <h2>Тестирование по трём шкалам</h2>
                        <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                    </div>
                    <div class="completion-message">
                        <p>✅ Все опросы завершены!</p>
                        <p>Спасибо за участие!</p>
                    </div>
                </div>
            `;
            document.getElementById('survey-close-top')?.addEventListener('click', () => closeSurveySection());
        } else {
            surveyContent.innerHTML = `
                <div class="survey-container">
                    <div class="survey-header">
                        <h2>${surveyQuestions[surveyState.currentSurvey].title}</h2>
                        <button id="survey-close-top" class="survey-close-btn" style="width: 30px; height: 30px; position: static;">✖</button>
                    </div>
                    <div class="completion-message">
                        <p>✅ Опрос завершен!</p>
                        <p>Спасибо за ваши ответы!</p>
                        <button id="back-to-surveys" class="back">◀️ К списку опросов</button>
                    </div>
                </div>
            `;
            document.getElementById('back-to-surveys')?.addEventListener('click', () => {
                showSurveySelection();
            });
            document.getElementById('survey-close-top')?.addEventListener('click', () => closeSurveySection());
        }
    }

    function initSurveyFloatingButton() {
        const floatingBtn = document.getElementById('survey-floating-btn');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                switchToSection('survey-section');
            });
        }
    }

    function closeSurveySection() {
        const surveySection = document.getElementById('survey-section');
        surveySection.classList.remove('fade-in');
        surveySection.classList.add('fade-out');
        
        setTimeout(() => {
            const mainMenu = document.getElementById('main-buttons');
            mainMenu.classList.remove('fade-out');
            mainMenu.classList.add('fade-in');
        }, 300);
    }

    function switchToSection(targetSectionId) {
        mainMenu.classList.remove('fade-in');
        mainMenu.classList.add('fade-out');
        
        sections.forEach(section => {
            section.classList.remove('fade-in');
            section.classList.add('fade-out');
        });
        
        const targetSection = document.getElementById(targetSectionId);
        setTimeout(() => {
            targetSection.classList.remove('fade-out');
            targetSection.classList.add('fade-in');
            
            if (targetSectionId === 'chat-section') {
                loadChatInterface();
            } else if (targetSectionId === 'history-section') {
                loadHistory();
            } else if (targetSectionId === 'diary-section') {
                loadDiaryInterface();
            } else if (targetSectionId === 'survey-section') {
                loadSurveyInterface();
            }
        }, 50);
    }

    loadSurveyState();
    initSurveyFloatingButton();

    async function saveSurveyToDatabase(surveyKey, responses) {
        try {
            const response = await fetch(`${API_BASE}/api/survey/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    role: surveyState.role,
                    survey_key: surveyKey,
                    responses: responses
                })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error saving survey:', error);
            return false;
        }
    }
});