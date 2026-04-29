document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '';
    const sessionId = localStorage.getItem('sessionId');
    
    const mainButtons = document.querySelectorAll('[data-target]');
    const backButtons = document.querySelectorAll('[id$="-back"]');
    const mainMenu = document.getElementById('main-buttons');
    const sections = document.querySelectorAll('.section');
    
    const diaryMainButton = document.getElementById('diary');

    if ('Notification' in window) {
        Notification.requestPermission();
    }
    setInterval(checkReminders, 60000);
    checkReminders();

    const surveyMainButton = document.getElementById('survey-floating-btn');
    if (surveyMainButton) {
        surveyMainButton.addEventListener('click', function() {
            switchToSection('survey-section');
        });
    }

    function switchToSection(targetSectionId) {
        mainMenu.classList.add('hidden');
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        const targetSection = document.getElementById(targetSectionId);
        targetSection.classList.remove('hidden');
        if (targetSectionId === 'chat-section') {
            loadChatInterface();
        } else if (targetSectionId === 'history-section') {
            loadHistory();
        } else if (targetSectionId === 'diary-section') {
            loadDiaryInterface();
        } else if (targetSectionId === 'survey-section') {
            loadSurveyInterface();
        } else if (targetSectionId === 'advice-section') {
            showAdviceMenu();
        }
    }
    
    function returnToMain() {
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        mainMenu.classList.remove('hidden');
        fetch(`${API_BASE}/api/chat/end/${sessionId}`, { method: 'POST' });
    }
    
    function loadChatInterface() {
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatExit = document.getElementById('chat-exit');
        
        if (chatMessages) chatMessages.innerHTML = '';
        
        const savedMessages = loadChatMessages();
        savedMessages.forEach(msg => { addMessage(msg.role, msg.content, false); });
        
        if (chatSend) {
            chatSend.addEventListener('click', () => sendMessage());
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        }
        if (chatExit) {
            chatExit.addEventListener('click', () => { returnToMain(); });
        }
        
        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message) return;
            addMessage('user', message);
            input.value = '';
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
                    addMessage('bot', '<i class="ti ti-alert-circle text-error"></i> Ошибка получения ответа');
                }
            } catch (error) {
                removeTypingIndicator(typingId);
                addMessage('bot', '<i class="ti ti-alert-triangle text-warning"></i> Ошибка соединения');
            }
        }
    }
    
    async function simulateTyping(fullText) {
        const messages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat chat-start message-enter';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'chat-bubble chat-bubble-secondary animate-pulse';
        bubbleDiv.textContent = '';
        messageDiv.appendChild(bubbleDiv);
        messages.appendChild(messageDiv);
        let currentText = '';
        for (let i = 0; i < fullText.length; i++) {
            currentText += fullText[i];
            bubbleDiv.textContent = currentText;
            messages.scrollTop = messages.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 18 + Math.random() * 18));
        }
        bubbleDiv.textContent = fullText;
        bubbleDiv.classList.remove('animate-pulse');
        const currentMessages = loadChatMessages();
        currentMessages.push({ role: 'bot', content: fullText });
        saveChatMessages(currentMessages);
    }

    function addMessage(role, content, save = true) {
        const messages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'chat chat-end message-enter' : 'chat chat-start message-enter';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = role === 'user' ? 'chat-bubble chat-bubble-primary' : 'chat-bubble chat-bubble-secondary';
        bubbleDiv.textContent = content;
        messageDiv.appendChild(bubbleDiv);
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
        typingDiv.className = 'chat chat-start';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'chat-bubble chat-bubble-secondary';
        bubbleDiv.innerHTML = '<span class="loading loading-dots loading-sm"></span>';
        typingDiv.appendChild(bubbleDiv);
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
        return id;
    }
    
    function removeTypingIndicator(id) {
        const element = document.getElementById(id);
        if (element) element.remove();
    }

    function saveChatMessages(messages) {
        localStorage.setItem('chat_' + sessionId, JSON.stringify(messages));
    }

    function loadChatMessages() {
        const saved = localStorage.getItem('chat_' + sessionId);
        return saved ? JSON.parse(saved) : [];
    }
    
    function clearChatMessages() {
        localStorage.removeItem('chat_' + sessionId);
    }

    const adviceButtons = {
        'advice-breathing': { 
            category: 'breathing',
            title: 'Техника дыхания',
            icon: 'ti-wind',
            multiPage: true,
            totalPages: 3
        },
        'advice-method': { 
            category: 'grounding',
            title: 'Метод 5-4-3-2-1',
            icon: 'ti-leaf',
            multiPage: false
        },
        'advice-meditation': { 
            category: 'meditation',
            title: 'Медитация',
            icon: 'ti-flower',
            multiPage: false
        },
        'advice-massage': { 
            category: 'massage',
            title: 'Массаж',
            icon: 'ti-hand-click',
            multiPage: true,
            totalPages: 5
        },
        'advice-help': { 
            category: 'emergency',
            title: 'Экспресс-помощь',
            icon: 'ti-alert-circle',
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
        const adviceSection = document.getElementById('advice-section');
        const adviceGrid = adviceSection.querySelector('.grid');
        
        Object.entries(adviceButtons).forEach(([buttonId, config]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', async () => {
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
                            
                            showAdviceContent(
                                config.category, 
                                config.title, 
                                config.icon,
                                content, 
                                1, 
                                totalPages
                            );
                            
                        } else {
                            const response = await fetch(`${API_BASE}/api/advice/${config.category}`);
                            const data = await response.json();
                            
                            showAdviceContent(
                                config.category,
                                config.title,
                                config.icon,
                                data.content,
                                1,
                                1
                            );
                        }
                    } catch (error) {
                        console.error('Error fetching advice:', error);
                        showInAppNotification('error', 'Ошибка при загрузке совета');
                    }
                });
            }
        });
        
        const adviceBackButton = document.getElementById('advice-back');
        if (adviceBackButton) {
            adviceBackButton.addEventListener('click', () => {
                showAdviceMenu();
            });
        }
    }

    function showAdviceContent(category, title, icon, content, page = 1, totalPages = 1) {
        const adviceSection = document.getElementById('advice-section');
        const adviceGrid = adviceSection.querySelector('.grid');
        
        currentAdviceState = {
            category,
            page,
            totalPages,
            content
        };
        
        let adviceHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        adviceHtml += '<div class="card-body p-8">';
        adviceHtml += '<div class="flex items-center gap-3 mb-6"><div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><i class="ti ' + icon + ' text-2xl text-primary"></i></div><h2 class="text-2xl font-bold">' + title + '</h2></div>';
        
        if (totalPages > 1) {
            adviceHtml += '<div class="text-sm text-base-content/60 mb-4"><span class="badge badge-ghost">Страница ' + page + ' из ' + totalPages + '</span></div>';
        }
        
        adviceHtml += '<div class="bg-base-200 rounded-xl p-6 prose max-w-none" id="advice-content">' + content + '</div>';
        adviceHtml += '<div class="flex justify-center gap-4 mt-6">';
        
        if (totalPages > 1) {
            if (page > 1) {
                adviceHtml += '<button id="advice-prev" class="btn btn-secondary gap-2"><i class="ti ti-arrow-left"></i> Предыдущая</button>';
            }
            if (page < totalPages) {
                adviceHtml += '<button id="advice-next" class="btn btn-primary gap-2">Следующая <i class="ti ti-arrow-right"></i></button>';
            }
        }
        
        adviceHtml += '</div>';
        adviceHtml += '<div class="mt-4"><button id="advice-back-to-menu" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> К списку советов</button></div>';
        adviceHtml += '</div></div>';
        
        if (adviceGrid) {
            adviceGrid.classList.add('hidden');
        }
        
        const existingContent = adviceSection.querySelector('#advice-content-view');
        if (existingContent) {
            existingContent.innerHTML = adviceHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'advice-content-view';
            contentDiv.innerHTML = adviceHtml;
            adviceSection.appendChild(contentDiv);
        }
        
        if (document.getElementById('advice-prev')) {
            document.getElementById('advice-prev').addEventListener('click', () => {
                navigateAdvicePage(category, page - 1);
            });
        }
        
        if (document.getElementById('advice-next')) {
            document.getElementById('advice-next').addEventListener('click', () => {
                navigateAdvicePage(category, page + 1);
            });
        }
        
        document.getElementById('advice-back-to-menu').addEventListener('click', () => {
            showAdviceMenu();
        });
    }

    function showAdviceMenu() {
        const adviceSection = document.getElementById('advice-section');
        const adviceGrid = adviceSection.querySelector('.grid');
        const adviceContentView = adviceSection.querySelector('#advice-content-view');
        
        if (adviceGrid) {
            adviceGrid.classList.remove('hidden');
        }
        if (adviceContentView) {
            adviceContentView.classList.add('hidden');
        }
    }

    async function navigateAdvicePage(category, newPage) {
        try {
            let response;
            if (category === 'massage') {
                response = await fetch(`${API_BASE}/api/advice/massage?page=` + newPage);
            } else if (category === 'breathing') {
                response = await fetch(`${API_BASE}/api/advice/breathing/` + (newPage - 1));
            }
            
            const data = await response.json();
            
            let title = category === 'massage' ? 'Массаж' : 'Техника дыхания';
            let icon = category === 'massage' ? 'ti-hand-click' : 'ti-wind';
            let content = data.content;
            let totalPages = category === 'massage' ? data.total_pages : 3;

            showAdviceContent(category, title, icon, content, newPage, totalPages);
        } catch (error) {
            console.error('Error navigating advice:', error);
        }
    }

    async function loadHistory() {
        try {
            const response = await fetch(`${API_BASE}/api/history/${sessionId}?limit=5`);
            const data = await response.json();
            
            const historyList = document.getElementById('history-list');
            const historyEmpty = document.getElementById('history-empty');
            
            historyList.innerHTML = '';
            
            if (data.history && data.history.length > 0) {
                if (historyEmpty) historyEmpty.classList.add('hidden');
                historyList.classList.remove('hidden');
                
                data.history.forEach((msg, index) => {
                    const item = document.createElement('div');
                    item.className = 'p-6 hover:bg-base-200/50 transition-colors group';
                    item.innerHTML = `
                        <div class="flex items-start gap-4">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0 border border-base-300">
                                <i class="ti ti-message-2 text-primary"></i>
                            </div>
                            <div class="flex-1 space-y-2">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="badge badge-primary badge-sm">Вы</span>
                                        <span class="font-medium">${msg.user}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 pl-16">
                                    <span class="badge badge-secondary badge-sm">Игорёк</span>
                                    <span class="text-base-content/80">${msg.bot}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    historyList.appendChild(item);
                });
            } else {
                if (historyEmpty) historyEmpty.classList.remove('hidden');
                historyList.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    const historyClean = document.getElementById('history-clean');
    if (historyClean) {
        historyClean.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/api/history/clear/${sessionId}`, { method: 'POST' });
                clearChatMessages();
                await loadHistory();
                const historyList = document.getElementById('history-list');
                if (historyList.innerHTML === '<p>История пуста</p>') {
                    showInAppNotification('info', 'Очищать нечего.');
                } else {
                    showInAppNotification('success', 'История очищена');
                }
            } catch (error) {
                console.error('Error clearing history:', error);
            }
        });
    }
    
    function loadDiaryInterface() {
        currentDiaryState = {step: 'menu', selectedEmoji: null, selectedMood: null}
        showDiaryMenu();

        fetch(`${API_BASE}/api/mood/entries/${sessionId}?limit=1&days=365`)
        .then(response => response.json())
        .then(data => {
            const entryCount = data.entries.length;
            const viewButton = document.getElementById('diary-view');
            if (viewButton && entryCount > 0) {
                viewButton.querySelector('h3').textContent = 'Посмотреть записи';
            }
        })
        .catch(err => console.log('Could not fetch entry count, ' + err));
    }
    
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

    const surveyClose = document.getElementById('survey-close');
    if (surveyClose) {
        surveyClose.addEventListener('click', returnToMain);
    }

    attachAdviceButtonListeners();
    attachDiaryMenuListeners();

    function showDiaryMenu() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        const diaryContentView = diarySection.querySelector('#diary-content-view');
        
        if (diaryGrid) {
            diaryGrid.classList.remove('hidden');
        }
        if (diaryContentView) {
            diaryContentView.classList.add('hidden');
        }
        
        currentDiaryState.step = 'menu';
    }
    
    function attachDiaryMenuListeners() {
        document.getElementById('diary-log')?.addEventListener('click', () => {
            showEmojiSelection();
        });
        document.getElementById('diary-view')?.addEventListener('click', () => {
            loadDiaryEntries();
        });
        document.getElementById('diary-statistics')?.addEventListener('click', () => {
            showDiaryStatistics();
        });
        document.getElementById('diary-analysis')?.addEventListener('click', () => {
            analyzeDiary();
        });
        document.getElementById('diary-advice')?.addEventListener('click', () => {
            getDiaryAdvice();
        });
        document.getElementById('diary-reminders')?.addEventListener('click', () => {
            showRemindersMenu();
        });
        document.getElementById('diary-back')?.addEventListener('click', returnToMain);
    }

    function showEmojiSelection() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        
        let emojiHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        emojiHtml += '<div class="card-body p-8 text-center">';
        emojiHtml += '<h3 class="text-2xl font-bold mb-8">Выберите ваше настроение:</h3>';
        emojiHtml += '<div class="flex flex-col gap-6 items-center mb-8">';
        
        EMOJI_KEYBOARD.forEach(row => {
            emojiHtml += '<div class="flex gap-6">';
            row.forEach(emoji => {
                emojiHtml += '<button class="btn btn-circle btn-lg text-5xl hover:scale-125 transition-transform shadow-sm" data-emoji="' + emoji + '">' + emoji + '</button>';
            });
            emojiHtml += '</div>';
        });
        
        emojiHtml += '</div>';
        emojiHtml += '<button id="emoji-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button>';
        emojiHtml += '</div></div>';
        
        if (diaryGrid) {
            diaryGrid.classList.add('hidden');
        }
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = emojiHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = emojiHtml;
            diarySection.appendChild(contentDiv);
        }
        
        document.querySelectorAll('[data-emoji]').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                currentDiaryState.selectedEmoji = emoji;
                currentDiaryState.selectedMood = MOODS[emoji];
                showNoteInput();
            });
        });
        
        document.getElementById('emoji-back').addEventListener('click', () => {
            showDiaryMenu();
        });
        
        currentDiaryState.step = 'emoji';
    }

    function showNoteInput() {
        const diarySection = document.getElementById('diary-section');
        
        let noteHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        noteHtml += '<div class="card-body p-8 text-center">';
        noteHtml += '<h3 class="text-2xl font-bold mb-6">Вы выбрали: ' + currentDiaryState.selectedEmoji + ' (' + currentDiaryState.selectedMood + ')</h3>';
        noteHtml += '<p class="mb-6 text-base-content/70 text-lg">Хотите добавить комментарий?</p>';
        noteHtml += '<textarea id="diary-note" placeholder="Напишите ваш комментарий здесь..." rows="6" class="textarea textarea-bordered textarea-lg w-full min-h-[150px] mb-6"></textarea>';
        noteHtml += '<div class="flex gap-4 justify-center mb-6">';
        noteHtml += '<button id="note-skip" class="btn btn-secondary gap-2"><i class="ti ti-player-skip-forward"></i> Пропустить</button>';
        noteHtml += '<button id="note-save" class="btn btn-primary gap-2"><i class="ti ti-device-floppy"></i> Сохранить</button>';
        noteHtml += '</div>';
        noteHtml += '<button id="note-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Выбрать другой смайлик</button>';
        noteHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = noteHtml;
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = noteHtml;
            diarySection.appendChild(contentDiv);
        }
        
        const diaryNote = document.getElementById('diary-note');
        if (diaryNote) {
            diaryNote.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.max(150, this.scrollHeight) + 'px';
            });
        }
        
        document.getElementById('note-skip').addEventListener('click', () => {
            saveMoodEntry(null);
        });
        
        document.getElementById('note-save').addEventListener('click', () => {
            const note = document.getElementById('diary-note').value.trim();
            saveMoodEntry(note || null);
        });
        
        document.getElementById('note-back').addEventListener('click', () => {
            showEmojiSelection();
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
                showSuccessMessage('<i class="ti ti-circle-check text-success"></i> Запись сохранена!');
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
        
        let msgHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        msgHtml += '<div class="card-body p-8 text-center">';
        msgHtml += '<div class="alert alert-success mb-6 shadow-sm"><span class="text-lg">' + message + '</span></div>';
        msgHtml += '<button id="message-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> В меню дневника</button>';
        msgHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = msgHtml;
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = msgHtml;
            diarySection.appendChild(contentDiv);
        }
        
        document.getElementById('message-back').addEventListener('click', () => {
            showDiaryMenu();
        });
    }

    function showErrorMessage(message) {
        const diarySection = document.getElementById('diary-section');
        
        let msgHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        msgHtml += '<div class="card-body p-8 text-center">';
        msgHtml += '<div class="alert alert-error mb-6 shadow-sm"><span class="text-lg"><i class="ti ti-alert-circle"></i> ' + message + '</span></div>';
        msgHtml += '<button id="message-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> В меню дневника</button>';
        msgHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = msgHtml;
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = msgHtml;
            diarySection.appendChild(contentDiv);
        }
        
        document.getElementById('message-back').addEventListener('click', () => {
            showDiaryMenu();
        });
    }

    async function loadDiaryEntries() {
        try {
            const response = await fetch(`${API_BASE}/api/mood/entries/${sessionId}?limit=50&days=365`);
            const data = await response.json();
            
            const diarySection = document.getElementById('diary-section');
            const diaryGrid = diarySection.querySelector('.grid');
            
            if (diaryGrid) {
                diaryGrid.classList.add('hidden');
            }
            
            let entriesHtml;
            
            if (!data.entries || data.entries.length === 0) {
                entriesHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden"><div class="card-body p-8 text-center"><p class="mb-6 text-xl text-base-content/60">Записей пока нет</p><button id="entries-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button></div></div>';
            } else {
                entriesHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden"><div class="card-body p-6"><h3 class="text-2xl font-bold mb-6 text-center">Ваши записи:</h3><div class="space-y-4 max-h-[600px] overflow-y-auto">';
                
                data.entries.reverse().forEach((entry, index) => {
                    const date = new Date(entry.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    entriesHtml += '<div class="bg-base-200 rounded-xl p-6 hover:shadow-md transition-shadow border border-base-300">';
                    entriesHtml += '<div class="flex items-start justify-between mb-4">';
                    entriesHtml += '<div class="flex items-center gap-3">';
                    entriesHtml += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shadow-sm">' + entry.emoji + '</div>';
                    entriesHtml += '<div><div class="font-semibold text-primary">' + entry.mood_state + '</div>';
                    entriesHtml += '<div class="text-sm text-base-content/60">' + date + '</div></div></div>';
                    if (entry.note) {
                        entriesHtml += '</div><div class="text-base-content/80 italic pt-4 border-t border-dashed border-base-content/30">' + entry.note;
                    }
                    entriesHtml += '</div></div>';
                });
                
                entriesHtml += '</div><div class="text-center mt-6"><button id="entries-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button></div></div></div>';
            }
            
            const existingContent = diarySection.querySelector('#diary-content-view');
            if (existingContent) {
                existingContent.innerHTML = entriesHtml;
                existingContent.classList.remove('hidden');
            } else {
                const contentDiv = document.createElement('div');
                contentDiv.id = 'diary-content-view';
                contentDiv.innerHTML = entriesHtml;
                diarySection.appendChild(contentDiv);
            }
            
            document.getElementById('entries-back').addEventListener('click', () => {
                showDiaryMenu();
            });
            
        } catch (error) {
            console.error('Error loading entries:', error);
            showErrorMessage('Ошибка при загрузке записей');
        }
    }

    async function showDiaryStatistics() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        
        if (diaryGrid) {
            diaryGrid.classList.add('hidden');
        }
        
        let statsHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        statsHtml += '<div class="card-body p-8">';
        statsHtml += '<h3 class="text-2xl font-bold mb-6 text-center">Статистика настроения</h3>';
        statsHtml += '<div id="chart-container" class="text-center min-h-[300px]"><p class="text-base-content/60 italic p-8">Загрузка графика...</p></div>';
        statsHtml += '<button id="stats-back" class="btn btn-ghost gap-2 mt-6"><i class="ti ti-arrow-left"></i> Назад</button>';
        statsHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = statsHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = statsHtml;
            diarySection.appendChild(contentDiv);
        }
        
        try {
            const chartResponse = await fetch(`${API_BASE}/api/mood/chart/${sessionId}`);
            
            if (chartResponse.ok) {
                const chartBlob = await chartResponse.blob();
                const chartUrl = URL.createObjectURL(chartBlob);
                
                document.getElementById('chart-container').innerHTML = '<img src="' + chartUrl + '" alt="Mood Statistics Chart" class="max-w-full rounded-lg shadow-sm">';
            } else {
                const entriesResponse = await fetch(`${API_BASE}/api/mood/entries/${sessionId}?days=7`);
                const entriesData = await entriesResponse.json();
                
                document.getElementById('chart-container').innerHTML = '<div class="text-center"><p class="mb-4 text-lg">За последнюю неделю у вас записей: <span class="font-bold text-primary">' + entriesData.entries.length + '</span></p><p class="text-base-content/60 mt-4 text-lg">Недостаточно данных для построения графика</p></div>';
            }
        } catch (error) {
            console.error('Error loading chart:', error);
            document.getElementById('chart-container').innerHTML = '<p class="text-error text-center text-lg">Ошибка при загрузке статистики</p>';
        }
        
        document.getElementById('stats-back').addEventListener('click', () => {
            showDiaryMenu();
        });
    }

    async function analyzeDiary() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        
        if (diaryGrid) {
            diaryGrid.classList.add('hidden');
        }
        
        let analysisHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        analysisHtml += '<div class="card-body p-8 text-center">';
        analysisHtml += '<h3 class="text-2xl font-bold mb-6">Анализ настроения</h3>';
        analysisHtml += '<p class="text-base-content/60 italic text-center p-8 text-lg">Анализирую ваши записи...</p>';
        analysisHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = analysisHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = analysisHtml;
            diarySection.appendChild(contentDiv);
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/mood/analyze/${sessionId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            analysisHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
            analysisHtml += '<div class="card-body p-8">';
            analysisHtml += '<h3 class="text-2xl font-bold mb-6 text-center">Анализ настроения</h3>';
            analysisHtml += '<div class="bg-base-200 rounded-xl p-6 mb-6 whitespace-pre-wrap text-base-content/80 leading-relaxed">' + data.analysis + '</div>';
            analysisHtml += '<button id="analysis-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button>';
            analysisHtml += '</div></div>';
            
            const existingContent2 = diarySection.querySelector('#diary-content-view');
            if (existingContent2) {
                existingContent2.innerHTML = analysisHtml;
            }
        } catch (error) {
            analysisHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
            analysisHtml += '<div class="card-body p-8 text-center">';
            analysisHtml += '<h3 class="text-2xl font-bold mb-6 text-error">Ошибка</h3>';
            analysisHtml += '<p class="text-center text-error text-lg">Не удалось выполнить анализ</p>';
            analysisHtml += '<button id="analysis-back" class="btn btn-ghost gap-2 mt-6"><i class="ti ti-arrow-left"></i> Назад</button>';
            analysisHtml += '</div></div>';
            
            const existingContent2 = diarySection.querySelector('#diary-content-view');
            if (existingContent2) {
                existingContent2.innerHTML = analysisHtml;
            }
        }
        
        document.getElementById('analysis-back')?.addEventListener('click', () => {
            showDiaryMenu();
        });
    }

    async function getDiaryAdvice() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        
        if (diaryGrid) {
            diaryGrid.classList.add('hidden');
        }
        
        let adviceHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        adviceHtml += '<div class="card-body p-8 text-center">';
        adviceHtml += '<h3 class="text-2xl font-bold mb-6">Совет по настроению</h3>';
        adviceHtml += '<p class="text-base-content/60 italic text-center p-8 text-lg">Думаю над советом...</p>';
        adviceHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = adviceHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = adviceHtml;
            diarySection.appendChild(contentDiv);
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/mood/advice/${sessionId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            adviceHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
            adviceHtml += '<div class="card-body p-8">';
            adviceHtml += '<h3 class="text-2xl font-bold mb-6 text-center">Совет по настроению</h3>';
            adviceHtml += '<div class="bg-base-200 rounded-xl p-6 mb-6 whitespace-pre-wrap text-base-content/80 leading-relaxed">' + data.advice + '</div>';
            adviceHtml += '<button id="mood-advice-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button>';
            adviceHtml += '</div></div>';
            
            const existingContent2 = diarySection.querySelector('#diary-content-view');
            if (existingContent2) {
                existingContent2.innerHTML = adviceHtml;
            }
        } catch (error) {
            adviceHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
            adviceHtml += '<div class="card-body p-8 text-center">';
            adviceHtml += '<h3 class="text-2xl font-bold mb-6 text-error">Ошибка</h3>';
            adviceHtml += '<p class="text-center text-error text-lg">Не удалось получить совет</p>';
            adviceHtml += '<button id="mood-advice-back" class="btn btn-ghost gap-2 mt-6"><i class="ti ti-arrow-left"></i> Назад</button>';
            adviceHtml += '</div></div>';
            
            const existingContent2 = diarySection.querySelector('#diary-content-view');
            if (existingContent2) {
                existingContent2.innerHTML = adviceHtml;
            }
        }
        
        document.getElementById('mood-advice-back')?.addEventListener('click', () => {
            showDiaryMenu();
        });
    }

    function showRemindersMenu() {
        const diarySection = document.getElementById('diary-section');
        const diaryGrid = diarySection.querySelector('.grid');
        
        if (diaryGrid) {
            diaryGrid.classList.add('hidden');
        }
        
        let remindersHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        remindersHtml += '<div class="card-body p-8 text-center">';
        remindersHtml += '<h3 class="text-2xl font-bold mb-8">Напоминания</h3>';
        remindersHtml += '<div class="flex flex-col gap-4 max-w-md mx-auto">';
        remindersHtml += '<button id="reminder-diary" class="btn btn-primary gap-3"><i class="ti ti-pencil"></i> Дневник</button>';
        remindersHtml += '<button id="reminder-meditation" class="btn btn-primary gap-3"><i class="ti ti-flower"></i> Медитация</button>';
        remindersHtml += '<button id="reminder-water" class="btn btn-primary gap-3"><i class="ti ti-droplet"></i> Пить воду</button>';
        remindersHtml += '<button id="reminder-sleep" class="btn btn-primary gap-3"><i class="ti ti-bed"></i> Сон</button>';
        remindersHtml += '<button id="reminder-stretch" class="btn btn-primary gap-3"><i class="ti ti-stretching"></i> Разминка</button>';
        remindersHtml += '<button id="reminders-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button>';
        remindersHtml += '</div></div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = remindersHtml;
            existingContent.classList.remove('hidden');
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = remindersHtml;
            diarySection.appendChild(contentDiv);
        }
        
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
            showDiaryMenu();
        });
    }

    function showTimeSelection(reminderType) {
        const diarySection = document.getElementById('diary-section');
        
        let hours = '';
        for (let i = 8; i <= 22; i++) {
            hours += '<button class="btn btn-outline" data-time="' + i + ':00">' + i + ':00</button>';
        }
        
        let timeHtml = '<div class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">';
        timeHtml += '<div class="card-body p-8 text-center">';
        timeHtml += '<h3 class="text-2xl font-bold mb-4">Выберите время для напоминания:</h3>';
        timeHtml += '<p class="text-base-content/60 text-sm mb-6">В это время мы отправим Вам уведомление</p>';
        timeHtml += '<div class="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto mb-6">' + hours + '</div>';
        timeHtml += '<button id="time-back" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> Назад</button>';
        timeHtml += '</div></div>';
        
        const existingContent = diarySection.querySelector('#diary-content-view');
        if (existingContent) {
            existingContent.innerHTML = timeHtml;
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.id = 'diary-content-view';
            contentDiv.innerHTML = timeHtml;
            diarySection.appendChild(contentDiv);
        }
        
        document.querySelectorAll('[data-time]').forEach(btn => {
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
                    
                    showSuccessMessage('Напоминание установлено на ' + time);

                    if (Notification.permission == 'granted') {
                        new Notification('Напоминание установлено', {
                            body: 'Мы напомним вам в ' + time,
                            icon: '/static/icon.png'
                        });
                    }
                } catch (error) {
                    showErrorMessage('Ошибка при установке напоминания');
                }
            });
        });
        
        document.getElementById('time-back').addEventListener('click', () => {
            showRemindersMenu();
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
            'diary': 'Дневник настроения',
            'meditation': 'Медитация',
            'drink_water': 'Напоминание',
            'sleep_reminder': 'Сон',
            'stretch': 'Разминка'
        };
        return titles[type] || 'Напоминание';
    }

    function showInAppPopup(type, message) {
        const existingPopup = document.getElementById('reminder-popup');
        if (existingPopup) existingPopup.remove();
        
        const popup = document.createElement('div');
        popup.id = 'reminder-popup';
        popup.className = 'fixed top-5 right-5 w-80 z-50 opacity-0 translate-x-full transition-all duration-300';
        popup.innerHTML = '<div class="alert alert-info shadow-lg"><div><span class="font-semibold">' + getReminderTitle(type) + '</span><span class="block text-sm">' + message + '</span></div><div class="flex gap-2"><button class="popup-btn-later btn btn-sm btn-ghost">Позже</button><button class="popup-btn-ok btn btn-sm btn-primary">Хорошо</button></div></div>';
        
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.classList.remove('opacity-0', 'translate-x-full');
        }, 10);
        
        popup.querySelector('.popup-btn-later')?.addEventListener('click', () => {
            closePopup(popup);
            setTimeout(() => {
                if (type === 'diary') {
                    showNotification(type, 'Время записать своё настроение');
                }
            }, 15 * 60 * 1000);
        });
        popup.querySelector('.popup-btn-ok')?.addEventListener('click', () => {
            closePopup(popup);
            if (type === 'diary') {
                switchToSection('diary-section');
                loadDiaryInterface();
            }
        });
    }

    function closePopup(popup) {
        popup.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => popup.remove(), 300);
    }

    function showInAppNotification(type, message) {
        const notification = document.createElement('div');
        notification.id = 'in-app-notification';
        notification.className = 'fixed top-5 right-5 w-80 z-50 transition-all duration-300 opacity-0 translate-x-full';
        
        let alertClass = 'alert-info';
        if (type === 'success') alertClass = 'alert-success';
        if (type === 'error') alertClass = 'alert-error';
        if (type === 'warning') alertClass = 'alert-warning';
        
        notification.innerHTML = '<div class="alert ' + alertClass + ' shadow-lg"><span>' + message + '</span></div>';
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.remove('opacity-0', 'translate-x-full');
        }, 10);
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

async function checkUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/user/profile/${sessionId}`);
        const data = await response.json();
        return data.profile !== null;
    } catch (error) {
        console.error('Error checking profile:', error);
        return false;
    }
}

function showSurveySelection() {
    const surveyContent = document.getElementById('survey-content');
    
    if (!surveyState.sessionId) {
        surveyState.sessionId = localStorage.getItem('session_id');

        if (!surveyState.sessionId) {
            surveyState.sessionId = crypto.randomUUID();
            localStorage.setItem('session_id', surveyState.sessionId);
        }
    }

    checkUserProfile().then(hasProfile => {
        if (!hasProfile) {
            let formButtonHtml = `
                <div class="text-center">
                    <div class="alert alert-info shadow-lg mb-6">
                        <i class="ti ti-info-circle"></i>
                        <span>Для участия в опросах необходимо сначала заполнить анкету</span>
                    </div>
                    <div class="card bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/30 shadow-lg mb-8">
                        <div class="card-body p-6">
                            <div class="flex flex-col md:flex-row items-center gap-6">
                                <div class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                                    <i class="ti ti-user-plus text-2xl text-accent"></i>
                                </div>
                                <div class="flex-1 text-center md:text-left">
                                    <h3 class="text-xl font-bold mb-2">Заполните анкету</h3>
                                    <p class="text-base-content/70">Расскажите немного о себе, чтобы мы могли лучше подобрать рекомендации</p>
                                </div>
                                <button id="show-profile-form" class="btn btn-accent btn-lg gap-2">
                                    <i class="ti ti-pencil"></i>
                                    Заполнить анкету
                                    <i class="ti ti-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            surveyContent.innerHTML = formButtonHtml;
            document.getElementById('show-profile-form')?.addEventListener('click', () => {
                showProfileForm();
            });
            return;
        }
        
        const allCompleted = surveyState.completedSurveys.length === 3;
        
        if (allCompleted) {
            surveyContent.innerHTML = `
                <div class="text-center py-8">
                    <i class="ti ti-circle-check text-6xl text-success mb-4 block"></i>
                    <h2 class="text-2xl font-bold mb-4">Все опросы завершены!</h2>
                    <p class="text-base-content/70 mb-6">Спасибо за участие! Ваши ответы помогут нам стать лучше.</p>
                    <button id="back-to-main" class="btn btn-primary mt-6">Вернуться в главное меню</button>
                </div>
            `;
            document.getElementById('back-to-main')?.addEventListener('click', returnToMain);
            return;
        }
        
        let surveysHtml = `
            <div class="text-center">
                <div class="alert alert-success shadow-sm mb-6">
                    <i class="ti ti-check-circle"></i>
                    <span>Анкета заполнена! Вы можете пройти опросы ниже.</span>
                </div>
                
                <!-- Edit Profile Button -->
                <button id="edit-profile-btn" class="btn btn-ghost btn-sm gap-2 mb-6">
                    <i class="ti ti-edit"></i>
                    Редактировать анкету
                </button>
                
                <h2 class="text-2xl font-bold mb-6">Выберите опрос</h2>
                <div class="flex flex-col gap-4 items-center max-w-md mx-auto">
        `;
        
        const surveyOneCompleted = surveyState.completedSurveys.includes('surveyOne');
        surveysHtml += `
            <div class="w-full">
                <button id="start-survey-one" 
                        class="btn w-full justify-between ${surveyOneCompleted ? 'btn-success btn-outline' : 'btn-accent'} btn-lg gap-3"
                        ${surveyOneCompleted ? 'disabled' : ''}>
                    <span class="flex items-center gap-3">
                        <i class="ti ti-battery-eco"></i>
                        Цифровая усталость
                    </span>
                    ${surveyOneCompleted ? '<i class="ti ti-check-circle text-xl"></i>' : '<i class="ti ti-arrow-right"></i>'}
                </button>
                ${surveyOneCompleted ? '<p class="text-xs text-success mt-1 text-left"><i class="ti ti-check"></i> Опрос пройден</p>' : ''}
            </div>
        `;
        
        const surveyTwoCompleted = surveyState.completedSurveys.includes('surveyTwo');
        surveysHtml += `
            <div class="w-full">
                <button id="start-survey-two" 
                        class="btn w-full justify-between ${surveyTwoCompleted ? 'btn-success btn-outline' : 'btn-accent'} btn-lg gap-3"
                        ${surveyTwoCompleted ? 'disabled' : ''}>
                    <span class="flex items-center gap-3">
                        <i class="ti ti-list"></i>
                        Шкала Ликерта
                    </span>
                    ${surveyTwoCompleted ? '<i class="ti ti-check-circle text-xl"></i>' : '<i class="ti ti-arrow-right"></i>'}
                </button>
                ${surveyTwoCompleted ? '<p class="text-xs text-success mt-1 text-left"><i class="ti ti-check"></i> Опрос пройден</p>' : ''}
            </div>
        `;
        
        const surveyThreeCompleted = surveyState.completedSurveys.includes('surveyThree');
        surveysHtml += `
            <div class="w-full">
                <button id="start-survey-three" 
                        class="btn w-full justify-between ${surveyThreeCompleted ? 'btn-success btn-outline' : 'btn-accent'} btn-lg gap-3"
                        ${surveyThreeCompleted ? 'disabled' : ''}>
                    <span class="flex items-center gap-3">
                        <i class="ti ti-clipboard-check"></i>
                        Опросник Чена
                    </span>
                    ${surveyThreeCompleted ? '<i class="ti ti-check-circle text-xl"></i>' : '<i class="ti ti-arrow-right"></i>'}
                </button>
                ${surveyThreeCompleted ? '<p class="text-xs text-success mt-1 text-left"><i class="ti ti-check"></i> Опрос пройден</p>' : ''}
            </div>
        `;
        
        const completedCount = surveyState.completedSurveys.length;
        surveysHtml += `
            <div class="w-full mt-6 pt-4 border-t border-base-300">
                <div class="flex items-center justify-between text-sm mb-2">
                    <span>Прогресс</span>
                    <span class="font-semibold">${completedCount}/3 опросов</span>
                </div>
                <progress class="progress progress-success w-full" value="${completedCount}" max="3"></progress>
            </div>
        `;
        
        surveysHtml += '</div></div>';
        surveyContent.innerHTML = surveysHtml;
        
        if (!surveyOneCompleted) {
            document.getElementById('start-survey-one')?.addEventListener('click', () => startSurvey('surveyOne'));
        }
        if (!surveyTwoCompleted) {
            document.getElementById('start-survey-two')?.addEventListener('click', () => startSurvey('surveyTwo'));
        }
        if (!surveyThreeCompleted) {
            document.getElementById('start-survey-three')?.addEventListener('click', () => startSurvey('surveyThree'));
        }
        
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            showProfileForm(true);
        });
    });
}

async function showProfileForm(editMode = false) {
    const surveyContent = document.getElementById('survey-content');
    
    let existingData = null;
    if (editMode) {
        try {
            const response = await fetch(`${API_BASE}/api/user/profile/${sessionId}`);
            const data = await response.json();
            if (data.profile) {
                existingData = data.profile;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }
    
    const educationOptions = {
        'spo_9': 'СПО на базе 9 классов',
        'spo_11': 'СПО на базе 11 классов',
        'bachelor': 'Бакалавриат',
        'master': 'Магистратура',
        'postgraduate': 'Аспирантура'
    };

    let formHtml = `
        <div class="max-w-2xl mx-auto">
            <h3 class="text-xl md:text-2xl font-bold mb-6 text-center">${editMode ? 'Редактирование анкеты' : 'Анкета участника'}</h3>
            <form id="profile-form" class="space-y-6">
                <!-- Status -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold text-base">Статус <span class="text-error">*</span></span>
                    </label>
                    <select id="profile-status" class="select select-bordered w-full" required>
                        <option value="">Выберите статус</option>
                        <option value="student" ${existingData?.status === 'student' ? 'selected' : ''}>Студент</option>
                        <option value="teacher" ${existingData?.status === 'teacher' ? 'selected' : ''}>Преподаватель</option>
                        <option value="employee" ${existingData?.status === 'employee' ? 'selected' : ''}>Сотрудник</option>
                    </select>
                </div>
                
                <!-- Age -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold text-base">Возраст <span class="text-error">*</span></span>
                    </label>
                    <input type="number" id="profile-age" class="input input-bordered w-full" placeholder="Введите ваш возраст" min="16" max="100" required value="${existingData?.age || ''}">
                    <span id="age-hint" class="text-xs text-base-content/60 mt-1"></span>
                </div>
                
                <!-- Field -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold text-base">Сфера деятельности <span class="text-error">*</span></span>
                    </label>
                    <select id="profile-field" class="select select-bordered w-full" required>
                        <option value="">Выберите сферу</option>
                        <option value="it" ${existingData?.field === 'it' ? 'selected' : ''}>ИТ-технологии</option>
                        <option value="law" ${existingData?.field === 'law' ? 'selected' : ''}>Юриспруденция</option>
                        <option value="tourism" ${existingData?.field === 'tourism' ? 'selected' : ''}>Туризм</option>
                        <option value="management" ${existingData?.field === 'management' ? 'selected' : ''}>Менеджмент</option>
                        <option value="psychology" ${existingData?.field === 'psychology' ? 'selected' : ''}>Психология</option>
                        <option value="medicine" ${existingData?.field === 'medicine' ? 'selected' : ''}>Медицина</option>
                        <option value="economics" ${existingData?.field === 'economics' ? 'selected' : ''}>Экономика</option>
                        <option value="logistics" ${existingData?.field === 'logistics' ? 'selected' : ''}>Логистика</option>
                        <option value="other" ${existingData?.field === 'other' ? 'selected' : ''}>Другое</option>
                    </select>
                </div>
                
                <!-- Other field input -->
                <div id="other-field-container" class="form-control ${existingData?.field === 'other' ? '' : 'hidden'}">
                    <label class="label">
                        <span class="label-text font-semibold text-base">Укажите сферу</span>
                    </label>
                    <input type="text" id="profile-field-other" class="input input-bordered w-full" placeholder="Введите вашу сферу деятельности" value="${existingData?.field_other || ''}">
                </div>
                
                <!-- Education Level (only for students) -->
                <div id="education-level-container" class="form-control ${existingData?.status === 'student' ? '' : 'hidden'}">
                    <label class="label">
                        <span class="label-text font-semibold text-base">Уровень образования <span class="text-error">*</span></span>
                    </label>
                    <select id="profile-education-level" class="select select-bordered w-full">
                        <option value="">Выберите уровень образования</option>
                        <option value="spo_9" ${existingData?.student_education_level === 'spo_9' ? 'selected' : ''}>СПО на базе 9 классов</option>
                        <option value="spo_11" ${existingData?.student_education_level === 'spo_11' ? 'selected' : ''}>СПО на базе 11 классов</option>
                        <option value="bachelor" ${existingData?.student_education_level === 'bachelor' ? 'selected' : ''}>Бакалавриат</option>
                        <option value="master" ${existingData?.student_education_level === 'master' ? 'selected' : ''}>Магистратура</option>
                        <option value="postgraduate" ${existingData?.student_education_level === 'postgraduate' ? 'selected' : ''}>Аспирантура</option>
                    </select>
                </div>

                <!-- Dynamic field based on status -->
                <div id="dynamic-field-container" class="form-control ${existingData?.status ? '' : 'hidden'}">
                    <label id="dynamic-label" class="label">
                        <span class="label-text font-semibold text-base"></span>
                    </label>
                    <input type="number" id="dynamic-value" class="input input-bordered w-full" placeholder="">
                </div>
                
                <div class="alert alert-info shadow-sm">
                    <i class="ti ti-info-circle"></i>
                    <span>Все данные конфиденциальны и будут использованы только для статистики</span>
                </div>
                
                <div class="flex gap-4 justify-end">
                    <button type="button" id="cancel-profile" class="btn btn-ghost">Отмена</button>
                    <button type="submit" class="btn btn-primary">${editMode ? 'Обновить' : 'Сохранить и продолжить'}</button>
                </div>
            </form>
        </div>
    `;
    
    surveyContent.innerHTML = formHtml;
    
    const ageInput = document.getElementById('profile-age');
    const ageHint = document.getElementById('age-hint');
    const statusSelect = document.getElementById('profile-status');
    const dynamicContainer = document.getElementById('dynamic-field-container');
    const dynamicLabel = document.getElementById('dynamic-label');
    const dynamicValue = document.getElementById('dynamic-value');
    const educationContainer = document.getElementById('education-level-container');
    const educationSelect = document.getElementById('profile-education-level');

    surveyState.role = statusSelect.value;
    localStorage.setItem('user_role', statusSelect.value);

    function updateAgeHint() {
        const status = statusSelect.value;
        if (status === 'student') {
            ageInput.min = 16;
            ageHint.textContent = 'Минимальный возраст для студентов: 16 лет';
        } else {
            ageInput.min = 18;
            ageHint.textContent = 'Минимальный возраст: 18 лет';
        }
        if (ageInput.value && parseInt(ageInput.value) < ageInput.min) {
            ageInput.value = ageInput.min;
        }
    }
    
    if (existingData) {
        if (existingData.status === 'student' && existingData.student_course) {
            dynamicValue.value = existingData.student_course;
        } else if (existingData.status === 'teacher' && existingData.teacher_experience) {
            dynamicValue.value = existingData.teacher_experience;
        } else if (existingData.status === 'employee' && existingData.employee_experience) {
            dynamicValue.value = existingData.employee_experience;
        }
    }
    
    statusSelect.addEventListener('change', (e) => {
        const status = e.target.value;
        updateAgeHint();

        if (status === 'student') {
            dynamicLabel.innerHTML = '<span class="label-text font-semibold text-base">Курс <span class="text-error">*</span></span>';
            dynamicValue.placeholder = 'Введите номер курса (1-4)';
            dynamicValue.min = 1;
            dynamicValue.max = 4;
            dynamicContainer.classList.remove('hidden');
            educationContainer.classList.remove('hidden');
            if (educationSelect) educationSelect.required = true;
        } else if (status === 'teacher') {
            dynamicLabel.innerHTML = '<span class="label-text font-semibold text-base">Педагогический стаж (лет) <span class="text-error">*</span></span>';
            dynamicValue.placeholder = 'Введите количество лет стажа';
            dynamicValue.min = 0;
            dynamicValue.max = 60;
            dynamicContainer.classList.remove('hidden');
            educationContainer.classList.add('hidden');
            if (educationSelect) educationSelect.required = false;
        } else if (status === 'employee') {
            dynamicLabel.innerHTML = '<span class="label-text font-semibold text-base">Опыт работы в образовательной организации (лет) <span class="text-error">*</span></span>';
            dynamicValue.placeholder = 'Введите количество лет';
            dynamicValue.min = 0;
            dynamicValue.max = 50;
            dynamicContainer.classList.remove('hidden');
            educationContainer.classList.add('hidden');
            if (educationSelect) educationSelect.required = false;
        } else {
            dynamicContainer.classList.add('hidden');
            educationContainer.classList.add('hidden');
            if (educationSelect) educationSelect.required = false;
        }
    });
    
    if (existingData?.status) {
        statusSelect.dispatchEvent(new Event('change'));
        updateAgeHint();
    }
    
    const fieldSelect = document.getElementById('profile-field');
    const otherContainer = document.getElementById('other-field-container');
    
    fieldSelect.addEventListener('change', (e) => {
        if (e.target.value === 'other') {
            otherContainer.classList.remove('hidden');
        } else {
            otherContainer.classList.add('hidden');
        }
    });
    
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const status = statusSelect.value;
        const age = parseInt(document.getElementById('profile-age').value);
        const field = fieldSelect.value;
        const fieldOther = field === 'other' ? document.getElementById('profile-field-other').value : null;
        const educationLevel = status === 'student' ? educationSelect?.value : null;
        
        let dynamicValue_num = null;
        if (status === 'student') {
            dynamicValue_num = parseInt(dynamicValue.value);
        } else if (status === 'teacher') {
            dynamicValue_num = parseInt(dynamicValue.value);
        } else if (status === 'employee') {
            dynamicValue_num = parseInt(dynamicValue.value);
        }
        
        if (!status || !age || !field) {
            showInAppNotification('error', 'Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        const minAge = status === 'student' ? 16 : 18;
        if (age < minAge) {
            showInAppNotification('error', `Возраст должен быть не менее ${minAge} лет для выбранного статуса`);
            return;
        }

        if (status === 'student') {
            if (!educationLevel) {
                showInAppNotification('error', 'Пожалуйста, выберите уровень образования');
                return;
            }
            if (dynamicValue_num < 1 || dynamicValue_num > 4) {
                showInAppNotification('error', 'Курс должен быть от 1 до 4');
                return;
            }
        }
        
        if (status === 'teacher' && dynamicValue_num < 0) {
            showInAppNotification('error', 'Введите корректный стаж');
            return;
        }
        
        if (status === 'employee' && dynamicValue_num < 0) {
            showInAppNotification('error', 'Введите корректный опыт работы');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    status: status,
                    age: age,
                    field: field,
                    field_other: fieldOther,
                    student_course: status === 'student' ? dynamicValue_num : null,
                    student_education_level: status === 'student' ? educationLevel : null,
                    teacher_experience: status === 'teacher' ? dynamicValue_num : null,
                    employee_experience: status === 'employee' ? dynamicValue_num : null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                surveyState.role = status;
                localStorage.setItem('user_role', status);
                showInAppNotification('success', editMode ? 'Анкета обновлена!' : 'Анкета успешно сохранена!');
                showSurveySelection();
            } else {
                showInAppNotification('error', 'Ошибка при сохранении анкеты');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showInAppNotification('error', 'Ошибка соединения');
        }
    });
    
    document.getElementById('cancel-profile').addEventListener('click', () => {
        showSurveySelection();
    });
}

    let surveyState = {
        isActive: false,
        role: null,
        currentSurvey: null,
        currentQuestionIndex: 0,
        questionsList: [],
        hasOpenEnded: false,
        openEndedQuestions: [],
        responses: {
            surveyOne: [],
            surveyTwo: [],
            surveyThree: []
        },
        openEndedResponses: [],
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
            baseQuestions: [
                'Я умею эффективно формулировать запросы к ИИ (например, ChatGPT), чтобы получить точные ответы.',
                'Я знаю, как проверить достоверность ответа ИИ, сравнивая с надежными источниками.',
                'Я могу распознать предвзятость или ошибки в ответе ИИ.',
                'Я применяю ИИ для обучения, и это улучшает мое понимание материала.',
                'Я осознаю этические аспекты использования ИИ.',
                'При получении ответа от ИИ я всегда подтверждаю информацию дополнительными источниками.',
                'Я чувствую себя уверенно в использовании ИИ для решения задач, но не полагаюсь на него слепо.',
                'Я обсуждаю ответы ИИ с одногруппниками или преподавателями, чтобы проверить их точность.'
            ],
            studentQuestions: [
                'Я получаю обучение по использованию ИИ в университете.',
                'ИИ помогает мне в учебе, но я боюсь злоупотреблений.',
                'Я могу самостоятельно определить, когда ответ ИИ неверен или предвзят.'
            ],
            studentOpenEnded: [
                'Опишите случай, когда вы использовали ИИ для учебной задачи и могли ли верифицировать ответ.',
                'Какие барьеры мешают вам лучше использовать ИИ этично?'
            ],
            teacherQuestions: [
                'Я обучаю студентов использованию ИИ в аудиториях.',
                'Студенты часто некритично используют ИИ.',
                'У нас в университете есть политики по интеграции ИИ в образование.'
            ],
            teacherOpenEnded: [
                'Как вы оцениваете риски ИИ в образовании (например, снижение критического мышления)?',
                'Какие ресурсы нужны для обучения студентов цифровому сознанию?'
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
                'Мне необходимо проводить все больше времени в Интернете, чтобы получить то же удовлетворение, что и раньше.',
                'Иногда у меня не получается поесть в нужное время из-за того, что я сижу в Интернете.',
                'Я чувствую себя усталым днем из-за того, что просидел допоздна в Интернете.'
            ]
        }
    };

    function loadSurveyInterface() {
        loadSurveyState();
        checkUserProfile().then(hasProfile => {
            if (!hasProfile) {
                showProfileForm(false);
            } else {
                showSurveySelection();
            }
        });
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

    const surveyMainBtn = document.getElementById('survey-main-btn');
    if (surveyMainBtn) {
        surveyMainBtn.addEventListener('click', function() {
            switchToSection('survey-section');
        });
    }

    async function checkUserRole() {
        try {
            const response = await fetch(`${API_BASE}/api/user/profile/${sessionId}`);
            const data = await response.json();
            if (data.profile && data.profile.status) {
                return data.profile.status;
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
        return 'student';
    }

    function startSurvey(surveyKey) {
        surveyState.currentSurvey = surveyKey;
        surveyState.currentQuestionIndex = 0;
        
        if (surveyKey === 'surveyOne') {
            surveyState.questionsList = [];
            for (const block in surveyQuestions.surveyOne.blocks) {
                surveyState.questionsList.push(...surveyQuestions.surveyOne.blocks[block]);
            }
            surveyState.hasOpenEnded = false;
            showSurveyQuestion();
        } else if (surveyKey === 'surveyTwo') {
            surveyState.questionsList = [...surveyQuestions.surveyTwo.baseQuestions];
            checkUserRole().then(userRole => {
                surveyState.role = userRole;
                if (userRole === 'student') {
                    surveyState.questionsList = [
                        ...surveyQuestions.surveyTwo.baseQuestions,
                        ...surveyQuestions.surveyTwo.studentQuestions,
                        ...surveyQuestions.surveyTwo.studentOpenEnded.map(q => ({
                            text: q,
                            type: 'open'
                        }))
                    ];
                } else {
                    surveyState.questionsList = [
                        ...surveyQuestions.surveyTwo.baseQuestions,
                        ...surveyQuestions.surveyTwo.teacherQuestions,
                        ...surveyQuestions.surveyTwo.teacherOpenEnded.map(q => ({
                            text: q,
                            type: 'open'
                        }))
                    ];
                }

                surveyState.currentQuestionIndex = 0;
                surveyState.openEndedResponses = [];
                showSurveyQuestion();
            })
        } else if (surveyKey === 'surveyThree') {
            surveyState.questionsList = [...surveyQuestions.surveyThree.questions];
            surveyState.hasOpenEnded = false;
            showSurveyQuestion();
        }
    }

    function showSurveyQuestion() {
        const surveyContent = document.getElementById('survey-content');
        const current = surveyState.questionsList[surveyState.currentQuestionIndex];
        const totalQuestions = surveyState.questionsList.length;
        const isOpenEnded = typeof current === 'object' && current.type === 'open';
        const questionText = isOpenEnded ? current.text : current;

        if (surveyState.currentQuestionIndex >= totalQuestions) {
            completeSurvey();
            return;
        }

        const progress = (surveyState.currentQuestionIndex + 1) + '/' + (surveyState.questionsList.length + surveyState.openEndedQuestions.length);

        if (isOpenEnded) {
            surveyContent.innerHTML = `
                <div class="text-center max-w-2xl mx-auto">
                    <h2 class="text-3xl font-bold mb-2">${surveyQuestions[surveyState.currentSurvey].title}</h2>
                    <div class="mb-6">
                        <progress class="progress progress-accent w-full max-w-md mx-auto" value="${(surveyState.currentQuestionIndex / (surveyState.questionsList.length + surveyState.openEndedQuestions.length) * 100)}" max="100"></progress>
                        <div class="text-sm text-base-content/60 mt-2">Вопрос ${progress}</div>
                    </div>
                    <div class="mb-8">
                        <div class="text-xl mb-8 font-medium text-left">${questionText}</div>
                        <div class="form-control">
                            <textarea id="open-ended-answer" class="textarea textarea-bordered textarea-lg w-full min-h-[150px]" placeholder="Введите ваш развернутый ответ..."></textarea>
                        </div>
                    </div>
                    <div class="flex justify-center gap-4 flex-wrap">
                        <button id="submit-open-ended" class="btn btn-primary btn-lg gap-2">
                            <i class="ti ti-device-floppy"></i>
                            Далее
                        </button>
                        <button id="prev-question" class="btn btn-outline">
                            Назад
                        </button>
                        <button id="cancel-survey" class="btn btn-ghost gap-2">
                            <i class="ti ti-arrow-left"></i> 
                            Назад к опросам
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('prev-question')?.addEventListener('click', () => {
                if (surveyState.currentQuestionIndex > 0) {
                    surveyState.currentQuestionIndex--;

                    if (surveyState.responses[surveyState.currentSurvey]?.length) {
                        surveyState.responses[surveyState.currentSurvey].pop();
                    }

                    if (surveyState.openEndedResponses?.length) {
                        surveyState.openEndedResponses.pop();
                    }
                    showSurveyQuestion();
                }
            });

            document.getElementById('submit-open-ended')?.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;

                const answer = document.getElementById('open-ended-answer')?.value.trim();
                if (!answer) {
                    showInAppNotification('warning', 'Пожалуйста, введите ответ перед продолжением');
                    btn.disabled = false;
                    return;
                }

                surveyState.openEndedResponses.push(answer);
                surveyState.currentQuestionIndex++;

                showSurveyQuestion();
            });
            
        } else {
            const question = surveyState.questionsList[surveyState.currentQuestionIndex];
            const totalQuestions = surveyState.questionsList.length + (surveyState.openEndedQuestions?.length || 0);
            const progress = (surveyState.currentQuestionIndex + 1) + '/' + totalQuestions;
            
            surveyContent.innerHTML = `
                <div class="text-center max-w-2xl mx-auto">
                    <h2 class="text-3xl font-bold mb-2">${surveyQuestions[surveyState.currentSurvey].title}</h2>
                    <div class="mb-6">
                        <progress class="progress progress-accent w-full max-w-md mx-auto" value="${(surveyState.currentQuestionIndex / totalQuestions * 100)}" max="100"></progress>
                        <div class="text-sm text-base-content/60 mt-2">Вопрос ${progress}</div>
                    </div>
                    <div class="mb-8">
                        <div class="text-xl mb-8 font-medium">${question}</div>
                        <div class="flex justify-center gap-3 flex-wrap" id="rating-buttons">
                            <div class="w-full text-center mb-4">
                                <div class="flex justify-center gap-2 text-sm text-base-content/60">
                                    <span>Совсем не согласен</span>
                                    <span class="mx-4">→</span>
                                    <span>Полностью согласен</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button id="prev-question" class="btn btn-outline">
                        Назад
                    </button>
                    <button id="cancel-survey" class="btn btn-ghost gap-2">
                        <i class="ti ti-arrow-left"></i> 
                        Назад к опросам
                    </button>
                </div>
            `;
            
            document.getElementById('prev-question')?.addEventListener('click', () => {
                if (surveyState.currentQuestionIndex > 0) {
                    surveyState.currentQuestionIndex--;

                    if (surveyState.responses[surveyState.currentSurvey]?.length) {
                        surveyState.responses[surveyState.currentSurvey].pop();
                    }

                    if (surveyState.openEndedResponses?.length) {
                        surveyState.openEndedResponses.pop();
                    }
                    showSurveyQuestion();
                }
            });

            const ratingContainer = document.getElementById('rating-buttons');
            
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-circle btn-lg btn-accent text-xl hover:scale-110 transition-transform';
                btn.textContent = i;

                btn.addEventListener('click', () => {
                    surveyState.responses[surveyState.currentSurvey].push(i);
                    surveyState.currentQuestionIndex++;
                    showSurveyQuestion();
                });

                ratingContainer.appendChild(btn);
            }
            if (!surveyState.role) {
                surveyState.role = localStorage.getItem('user_role');
            }
        }

        document.getElementById('cancel-survey')?.addEventListener('click', () => {
            showSurveySelection();
        });
    }

    function getRatingLabel(value) {
        const labels = {
            1: 'Совсем не согласен',
            2: 'Не согласен',
            3: 'Нейтрально',
            4: 'Согласен',
            5: 'Полностью согласен'
        };
        return labels[value];
    }

    function storeResponse(value) {
        if (!surveyState.responses[surveyState.currentSurvey]) {
            surveyState.responses[surveyState.currentSurvey] = [];
        }
        surveyState.responses[surveyState.currentSurvey].push(value);
        surveyState.currentQuestionIndex++;
        
        if (surveyState.currentQuestionIndex < surveyState.questionsList.length + (surveyState.openEndedQuestions?.length || 0)) {
            showSurveyQuestion();
        } else {
            completeSurvey();
        }
    }

    function storeOpenEndedResponse(answer) {
        if (!surveyState.openEndedResponses) {
            surveyState.openEndedResponses = [];
        }
        surveyState.openEndedResponses.push(answer);
        surveyState.currentQuestionIndex++;
        
        if (surveyState.currentQuestionIndex < surveyState.questionsList.length + (surveyState.openEndedQuestions?.length || 0)) {
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
        const openEndedResponses = surveyState.openEndedResponses || [];
        saveSurveyToDatabase(surveyState.currentSurvey, responses, openEndedResponses);

        surveyState.openEndedResponses = [];
        
        console.log('Responses for ' + surveyState.currentSurvey + ':', responses);
        console.log('Open-ended responses:', openEndedResponses);

        const surveyContent = document.getElementById('survey-content');
        
        const completedCount = surveyState.completedSurveys.length;
        const allCompleted = completedCount == 3;

        if (allCompleted) {
            surveyContent.innerHTML = '<div class="text-center"><h2 class="text-3xl font-bold mb-6">Тестирование по трём шкалам</h2><div class="alert alert-success mb-6 shadow-sm"><span class="text-lg"><i class="ti ti-circle-check"></i> Все опросы завершены! Спасибо за участие!</span></div></div>';
        } else {
            surveyContent.innerHTML = '<div class="text-center"><h2 class="text-3xl font-bold mb-4">' + surveyQuestions[surveyState.currentSurvey].title + '</h2><div class="alert alert-success mb-6 shadow-sm"><span class="text-lg"><i class="ti ti-circle-check"></i> Опрос завершен! Спасибо за ваши ответы!</span></div><button id="back-to-surveys" class="btn btn-ghost gap-2"><i class="ti ti-arrow-left"></i> К списку опросов</button></div>';
            document.getElementById('back-to-surveys')?.addEventListener('click', () => {
                showSurveySelection();
            });
        }
    }

    loadSurveyState();

    async function saveSurveyToDatabase(surveyKey, responses, openEndedResponses = []) {
        let currentRole = surveyState.role;
        
        if (!currentRole || currentRole === '') {
            try {
                const profileRes = await fetch(`${API_BASE}/api/user/profile/${sessionId}`);
                const profileData = await profileRes.json();
                if (profileData.profile && profileData.profile.status) {
                    currentRole = profileData.profile.status;
                    surveyState.role = currentRole;
                    localStorage.setItem('user_role', currentRole);
                }
            } catch (e) {
                console.warn("Could not fetch role from profile, using fallback");
                currentRole = localStorage.getItem('user_role') || 'student';
            }
        }

        try {
            const response = await fetch(`${API_BASE}/api/survey/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    role: currentRole,
                    survey_key: surveyKey,
                    responses: responses,
                    open_ended_responses: openEndedResponses
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
