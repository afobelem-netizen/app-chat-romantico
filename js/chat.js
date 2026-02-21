/**
 * LoveChat - Módulo do Chat
 * Versão: 1.0.0
 * Descrição: Gerencia toda a interface e interações da página de chat
 */

// ========================================
// INICIALIZAÇÃO DO CHAT
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('💬 Inicializando módulo do chat...');
    
    // Verificar se está na página de chat
    if (!window.location.pathname.includes('chat.html')) return;
    
    await initializeChat();
    setupChatEventListeners();
    loadUserData();
    startTypingIndicator();
});

// ========================================
// VARIÁVEIS GLOBAIS DO CHAT
// ========================================
let messagePollingInterval = null;
let typingTimeout = null;
let currentChatPartner = null;
let unreadMessages = new Set();
let messageCache = new Map();
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// ========================================
// INICIALIZAÇÃO
// ========================================
async function initializeChat() {
    showLoading(true);
    
    try {
        // Verificar usuário logado
        const user = await LoveChat.auth.checkAuth();
        if (!user) {
            window.location.href = '../login.html';
            return;
        }
        
        // Carregar dados iniciais
        await loadMessages();
        await loadUsers();
        await loadRanking();
        
        // Atualizar interface
        updateUserInterface();
        updateConnectionStatus();
        
        // Iniciar polling
        startMessagePolling();
        
        // Marcar como online
        LoveChat.api.updateUserStatus(user.id, true);
        
        console.log('✅ Chat inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar chat:', error);
        LoveChat.ui.showToast('Erro ao carregar o chat', 'error');
    } finally {
        showLoading(false);
    }
}

// ========================================
// CONFIGURAÇÃO DE EVENTOS
// ========================================
function setupChatEventListeners() {
    // Input de mensagem
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', handleMessageKeyPress);
        messageInput.addEventListener('input', handleMessageInput);
        messageInput.addEventListener('focus', () => handleTyping(true));
        messageInput.addEventListener('blur', () => handleTyping(false));
    }
    
    // Botão de enviar
    const sendBtn = document.getElementById('sendMessageBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Botões de mídia
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleMediaAction(action);
        });
    });
    
    // Botões de pontuação
    document.querySelectorAll('.presente-btn, .penalidade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const points = parseInt(e.currentTarget.dataset.points);
            const type = e.currentTarget.classList.contains('presente-btn') ? 'presente' : 'penalidade';
            handleScoreAction(points, type);
        });
    });
    
    // Menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleMenuAction(action);
        });
    });
    
    // Scroll infinito
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.addEventListener('scroll', handleInfiniteScroll);
    }
    
    // Drag and drop para arquivos
    setupDragAndDrop();
    
    // Atalhos de teclado
    setupKeyboardShortcuts();
}

// ========================================
// FUNÇÕES DE MENSAGEM
// ========================================
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
        LoveChat.ui.showToast('Digite uma mensagem', 'warning');
        return;
    }
    
    if (text.length > 1000) {
        LoveChat.ui.showToast('Mensagem muito longa (máx. 1000 caracteres)', 'error');
        return;
    }
    
    // Desabilitar input temporariamente
    input.disabled = true;
    
    try {
        const message = await LoveChat.chat.sendMessage(text, 'text');
        
        if (message) {
            input.value = '';
            handleTyping(false);
            
            // Scroll para a nova mensagem
            scrollToBottom();
            
            // Feedback visual
            LoveChat.ui.showToast('Mensagem enviada', 'success', 1500);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        LoveChat.ui.showToast('Erro ao enviar mensagem', 'error');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

async function loadMessages() {
    try {
        const messages = await LoveChat.api.getMessages(50);
        
        const messagesArea = document.getElementById('messagesArea');
        if (!messagesArea) return;
        
        messagesArea.innerHTML = '';
        
        messages.forEach(message => {
            displayMessage(message);
        });
        
        scrollToBottom();
        
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function displayMessage(message) {
    const messagesArea = document.getElementById('messagesArea');
    if (!messagesArea) return;
    
    // Verificar se mensagem já existe
    if (document.querySelector(`[data-message-id="${message.id}"]`)) return;
    
    const isOwn = message.userId === LoveChat.getState().currentUser?.id;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwn ? 'sent' : 'received'}`;
    messageElement.dataset.messageId = message.id;
    messageElement.dataset.userId = message.userId;
    
    // Adicionar animação de entrada
    messageElement.style.animation = 'slideIn 0.3s ease';
    
    let content = '';
    const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    switch (message.type) {
        case 'text':
            content = `<p class="message-text">${escapeHtml(message.content)}</p>`;
            break;
            
        case 'image':
            content = `
                <div class="message-image-container">
                    <img src="${message.content}" 
                         alt="Imagem" 
                         class="message-image"
                         onclick="openImageModal('${message.content}')"
                         loading="lazy">
                </div>
            `;
            break;
            
        case 'video':
            content = `
                <div class="message-video-container">
                    <video controls class="message-video">
                        <source src="${message.content}" type="video/mp4">
                        Seu navegador não suporta vídeo.
                    </video>
                </div>
            `;
            break;
            
        case 'audio':
            content = `
                <div class="message-audio-container">
                    <audio controls class="message-audio">
                        <source src="${message.content}" type="audio/mpeg">
                        Seu navegador não suporta áudio.
                    </audio>
                </div>
            `;
            break;
    }
    
    // Adicionar nome do remetente para mensagens recebidas
    const senderName = !isOwn ? `
        <div class="message-sender">
            <img src="${message.userPhoto}" alt="${message.userName}" class="sender-avatar">
            <span class="sender-name">${escapeHtml(message.userName)}</span>
        </div>
    ` : '';
    
    // Status da mensagem (apenas para mensagens próprias)
    const status = isOwn ? `
        <span class="message-status">
            ${message.read ? '✓✓' : '✓'}
        </span>
    ` : '';
    
    messageElement.innerHTML = `
        ${senderName}
        ${content}
        <div class="message-footer">
            <span class="message-time">${time}</span>
            ${status}
        </div>
    `;
    
    // Adicionar opções de mensagem (apenas para mensagens próprias)
    if (isOwn) {
        addMessageOptions(messageElement, message);
    }
    
    messagesArea.appendChild(messageElement);
    
    // Verificar se mensagem foi lida
    if (!isOwn && !message.read) {
        markMessageAsRead(message.id);
    }
}

function addMessageOptions(messageElement, message) {
    const options = document.createElement('div');
    options.className = 'message-options';
    options.innerHTML = `
        <button class="message-option" onclick="deleteMessage(${message.id})" title="Excluir">
            <i class="fas fa-trash"></i>
        </button>
        <button class="message-option" onclick="copyMessage('${message.id}')" title="Copiar">
            <i class="fas fa-copy"></i>
        </button>
    `;
    
    messageElement.appendChild(options);
    
    // Mostrar opções ao passar o mouse
    messageElement.addEventListener('mouseenter', () => {
        options.style.display = 'flex';
    });
    
    messageElement.addEventListener('mouseleave', () => {
        options.style.display = 'none';
    });
}

async function deleteMessage(messageId) {
    if (!confirm('Deseja excluir esta mensagem?')) return;
    
    try {
        await LoveChat.api.deleteMessage(messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
        
        LoveChat.ui.showToast('Mensagem excluída', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        LoveChat.ui.showToast('Erro ao excluir mensagem', 'error');
    }
}

function copyMessage(messageId) {
    const message = document.querySelector(`[data-message-id="${messageId}"] .message-text`);
    if (message) {
        navigator.clipboard.writeText(message.textContent);
        LoveChat.ui.showToast('Mensagem copiada', 'success');
    }
}

async function markMessageAsRead(messageId) {
    try {
        await LoveChat.api.updateMessage(messageId, { read: true });
    } catch (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
    }
}

// ========================================
// FUNÇÕES DE MÍDIA
// ========================================
function handleMediaAction(action) {
    switch (action) {
        case 'image':
            openFileSelector('image/*');
            break;
        case 'video':
            openFileSelector('video/*');
            break;
        case 'audio':
            startAudioRecording();
            break;
        case 'camera':
            openCamera();
            break;
    }
}

function openFileSelector(accept) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = false;
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tamanho
        if (file.size > 10 * 1024 * 1024) {
            LoveChat.ui.showToast('Arquivo muito grande (máx. 10MB)', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            let type = '';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            
            await LoveChat.chat.sendFile(file, type);
            
        } catch (error) {
            console.error('Erro ao enviar arquivo:', error);
            LoveChat.ui.showToast('Erro ao enviar arquivo', 'error');
        } finally {
            showLoading(false);
        }
    };
    
    input.click();
}

async function startAudioRecording() {
    if (isRecording) {
        stopAudioRecording();
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Criar preview
            showAudioPreview(audioUrl);
            
            // Limpar
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Atualizar UI
        updateRecordingUI(true);
        
        // Auto-stop após 2 minutos
        setTimeout(() => {
            if (isRecording) {
                stopAudioRecording();
            }
        }, 120000);
        
    } catch (error) {
        console.error('Erro ao gravar áudio:', error);
        LoveChat.ui.showToast('Erro ao acessar microfone', 'error');
    }
}

function stopAudioRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        updateRecordingUI(false);
    }
}

function showAudioPreview(audioUrl) {
    const preview = document.createElement('div');
    preview.className = 'audio-preview';
    preview.innerHTML = `
        <div class="audio-preview-header">
            <span>Preview do áudio</span>
            <button onclick="this.closest('.audio-preview').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <audio controls src="${audioUrl}"></audio>
        <div class="audio-preview-actions">
            <button class="btn btn-success" onclick="sendAudio('${audioUrl}')">
                Enviar
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.audio-preview').remove()">
                Cancelar
            </button>
        </div>
    `;
    
    document.querySelector('.message-input-area').appendChild(preview);
}

async function sendAudio(audioUrl) {
    try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        await LoveChat.chat.sendFile(blob, 'audio');
        
        // Remover preview
        document.querySelector('.audio-preview')?.remove();
        
    } catch (error) {
        console.error('Erro ao enviar áudio:', error);
        LoveChat.ui.showToast('Erro ao enviar áudio', 'error');
    }
}

function updateRecordingUI(isRecording) {
    const recordBtn = document.querySelector('[data-action="audio"]');
    if (recordBtn) {
        if (isRecording) {
            recordBtn.classList.add('recording');
            recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        } else {
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

function openCamera() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Tirar Foto</h2>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <video id="camera-preview" autoplay playsinline style="width: 100%; border-radius: 10px;"></video>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;">
                    <button class="btn btn-primary" onclick="capturePhoto()">
                        <i class="fas fa-camera"></i> Capturar
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Iniciar câmera
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            const video = document.getElementById('camera-preview');
            video.srcObject = stream;
            
            // Parar câmera ao fechar modal
            modal.querySelector('.modal-close').onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                modal.remove();
            };
        })
        .catch(error => {
            console.error('Erro ao acessar câmera:', error);
            LoveChat.ui.showToast('Erro ao acessar câmera', 'error');
            modal.remove();
        });
}

async function capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
        try {
            await LoveChat.chat.sendFile(blob, 'image');
            
            // Fechar modal e parar câmera
            const modal = document.querySelector('.modal.active');
            const stream = video.srcObject;
            stream.getTracks().forEach(track => track.stop());
            modal.remove();
            
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            LoveChat.ui.showToast('Erro ao enviar foto', 'error');
        }
    }, 'image/jpeg', 0.9);
}

// ========================================
// FUNÇÕES DE PONTUAÇÃO
// ========================================
async function handleScoreAction(points, type) {
    const reasons = {
        presente: {
            1: '😊 Carinho',
            5: '❤️ Amor',
            10: '👑 Momento especial'
        },
        penalidade: {
            1: '😞 Esquecimento',
            3: '😠 Atraso',
            5: '💀 Falha grave'
        }
    };
    
    const reason = reasons[type][points] || `${type} de ${Math.abs(points)} pontos`;
    
    // Confirmar ação
    if (!confirm(`Deseja ${type === 'presente' ? 'dar' : 'aplicar'} ${Math.abs(points)} pontos?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        await LoveChat.score.addPoints(
            LoveChat.getState().currentUser.id,
            type === 'presente' ? points : -points,
            reason
        );
        
        // Feedback visual
        const btn = event.currentTarget;
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
        
    } catch (error) {
        console.error('Erro ao processar pontuação:', error);
        LoveChat.ui.showToast('Erro ao processar pontuação', 'error');
    } finally {
        showLoading(false);
    }
}

// ========================================
// FUNÇÕES DE POLLING
// ========================================
function startMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    messagePollingInterval = setInterval(async () => {
        await checkNewMessages();
    }, 3000);
}

async function checkNewMessages() {
    try {
        const messages = await LoveChat.api.getMessages(50);
        const currentMessages = document.querySelectorAll('[data-message-id]');
        const currentIds = new Set(Array.from(currentMessages).map(el => el.dataset.messageId));
        
        messages.forEach(message => {
            if (!currentIds.has(message.id.toString())) {
                displayMessage(message);
                
                // Notificar se não for mensagem própria
                if (message.userId !== LoveChat.getState().currentUser?.id) {
                    notifyNewMessage(message);
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao verificar novas mensagens:', error);
    }
}

function notifyNewMessage(message) {
    // Atualizar contador de não lidas
    unreadMessages.add(message.id);
    updateUnreadCount();
    
    // Notificação do navegador
    if (document.hidden && Notification.permission === 'granted') {
        new Notification('💬 Nova mensagem', {
            body: `${message.userName}: ${message.type === 'text' ? message.content : 'Enviou uma mídia'}`,
            icon: message.userPhoto,
            silent: false
        });
    }
    
    // Som de notificação
    playNotificationSound();
}

function playNotificationSound() {
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

function updateUnreadCount() {
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        const count = unreadMessages.size;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ========================================
// FUNÇÕES DE DIGITAÇÃO
// ========================================
function handleTyping(isTyping) {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    if (isTyping) {
        showTypingIndicator(true);
        
        typingTimeout = setTimeout(() => {
            showTypingIndicator(false);
        }, 3000);
    } else {
        showTypingIndicator(false);
    }
}

function showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        if (show) {
            indicator.innerHTML = '<i class="fas fa-pencil-alt"></i> Digitando...';
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }
}

// ========================================
// FUNÇÕES DE INTERFACE
// ========================================
function updateUserInterface() {
    const user = LoveChat.getState().currentUser;
    if (!user) return;
    
    // Foto de perfil
    const photoElements = document.querySelectorAll('[data-profile-photo]');
    photoElements.forEach(el => {
        el.src = user.foto;
    });
    
    // Nome
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = user.nome;
    });
    
    // Score
    const scoreElements = document.querySelectorAll('[data-user-score]');
    scoreElements.forEach(el => {
        el.textContent = user.score || 0;
    });
    
    // Preencher formulário de configurações
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = user.nome;
    }
    if (document.getElementById('profileEmail')) {
        document.getElementById('profileEmail').value = user.email;
    }
}

function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        const isOnline = navigator.onLine;
        statusEl.textContent = isOnline ? 'Online' : 'Offline';
        statusEl.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    }
}

function showLoading(show) {
    const loader = document.getElementById('chatLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.scrollTo({
            top: messagesArea.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function handleInfiniteScroll() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea.scrollTop === 0) {
        loadMoreMessages();
    }
}

async function loadMoreMessages() {
    // Implementar paginação se necessário
    console.log('Carregar mais mensagens...');
}

// ========================================
// FUNÇÕES DE RANKING
// ========================================
async function loadRanking() {
    try {
        const ranking = await LoveChat.score.getRanking();
        renderRanking(ranking);
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

function renderRanking(users) {
    const container = document.getElementById('rankingContainer');
    if (!container) return;
    
    const currentUser = LoveChat.getState().currentUser;
    
    container.innerHTML = `
        <div class="ranking-widget">
            <div class="ranking-header">
                <h3>🏆 Ranking do Casal</h3>
                <span class="total-score">Total: ${users.reduce((acc, u) => acc + (u.score || 0), 0)} pts</span>
            </div>
            <div class="ranking-list">
                ${users.slice(0, 5).map((user, index) => `
                    <div class="ranking-item ${user.id === currentUser?.id ? 'current' : ''}">
                        <div class="ranking-position ${getRankingClass(index)}">
                            ${index + 1}
                        </div>
                        <img src="${user.foto}" alt="${user.nome}" class="ranking-avatar">
                        <span class="ranking-name">${user.nome}</span>
                        <span class="ranking-score">${user.score || 0} pts</span>
                    </div>
                `).join('')}
            </div>
            ${users.length > 5 ? `
                <button class="btn btn-link" onclick="showFullRanking()">
                    Ver todos (${users.length})
                </button>
            ` : ''}
        </div>
    `;
}

function getRankingClass(index) {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
}

function showFullRanking() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>🏆 Ranking Completo</h2>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="ranking-full" id="fullRanking"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Carregar ranking completo
    LoveChat.score.getRanking().then(users => {
        const container = document.getElementById('fullRanking');
        const currentUser = LoveChat.getState().currentUser;
        
        container.innerHTML = users.map((user, index) => `
            <div class="ranking-item ${user.id === currentUser?.id ? 'current' : ''}">
                <div class="ranking-position ${getRankingClass(index)}">
                    ${index + 1}
                </div>
                <img src="${user.foto}" alt="${user.nome}" class="ranking-avatar">
                <span class="ranking-name">${user.nome}</span>
                <span class="ranking-score">${user.score || 0} pts</span>
            </div>
        `).join('');
    });
}

// ========================================
// FUNÇÕES DE USUÁRIO
// ========================================
async function loadUsers() {
    try {
        const users = await LoveChat.api.getUsers();
        renderOnlineUsers(users);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderOnlineUsers(users) {
    const container = document.getElementById('onlineUsers');
    if (!container) return;
    
    const onlineUsers = users.filter(u => u.online);
    
    container.innerHTML = `
        <div class="online-users-header">
            <i class="fas fa-circle" style="color: #4caf50;"></i>
            <span>${onlineUsers.length} online</span>
        </div>
        <div class="online-users-list">
            ${onlineUsers.map(user => `
                <div class="online-user-item">
                    <img src="${user.foto}" alt="${user.nome}" class="online-user-avatar">
                    <span class="online-user-name">${user.nome}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ========================================
// FUNÇÕES DE MENU
// ========================================
function handleMenuAction(action) {
    switch (action) {
        case 'profile':
            openProfile();
            break;
        case 'ranking':
            showFullRanking();
            break;
        case 'settings':
            openSettings();
            break;
        case 'logout':
            handleLogout();
            break;
    }
}

function openProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('active');
        
        // Carregar configurações
        loadSettings();
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function loadSettings() {
    // Carregar configurações do usuário
    const user = LoveChat.getState().currentUser;
    
    document.getElementById('notificationSound').checked = 
        StorageService.load('notificationSound', true);
    document.getElementById('darkMode').checked = 
        StorageService.load('darkMode', false);
    document.getElementById('autoSave').checked = 
        StorageService.load('autoSave', true);
}

function saveSettings() {
    const settings = {
        notificationSound: document.getElementById('notificationSound').checked,
        darkMode: document.getElementById('darkMode').checked,
        autoSave: document.getElementById('autoSave').checked
    };
    
    StorageService.save('settings', settings);
    
    // Aplicar dark mode se necessário
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    LoveChat.ui.showToast('Configurações salvas', 'success');
    closeSettings();
}

// ========================================
// FUNÇÕES DE LOGOUT
// ========================================
function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        showLoading(true);
        
        // Parar polling
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        
        // Fazer logout
        LoveChat.auth.logout();
    }
}

// ========================================
// UTILITÁRIOS
// ========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.innerHTML = `
        <span class="modal-close" style="color: white; font-size: 40px; position: absolute; top: 20px; right: 30px;">&times;</span>
        <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
    `;
    
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

function setupDragAndDrop() {
    const dropZone = document.querySelector('.chat-main');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFileDrop(files[0]);
        }
    }
}

async function handleFileDrop(file) {
    // Validar tipo
    let type = '';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    else {
        LoveChat.ui.showToast('Tipo de arquivo não suportado', 'error');
        return;
    }
    
    // Validar tamanho
    if (file.size > 10 * 1024 * 1024) {
        LoveChat.ui.showToast('Arquivo muito grande (máx. 10MB)', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await LoveChat.chat.sendFile(file, type);
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        LoveChat.ui.showToast('Erro ao enviar arquivo', 'error');
    } finally {
        showLoading(false);
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter para enviar
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        
        // Esc para cancelar ações
        if (e.key === 'Escape') {
            if (isRecording) {
                stopAudioRecording();
            }
        }
        
        // Ctrl + F para focar no input
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('messageInput').focus();
        }
    });
}

function handleMessageKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleMessageInput(e) {
    const input = e.target;
    const charCount = input.value.length;
    
    // Atualizar contador de caracteres
    const counter = document.getElementById('charCounter');
    if (counter) {
        counter.textContent = `${charCount}/1000`;
        
        if (charCount > 900) {
            counter.style.color = '#f44336';
        } else {
            counter.style.color = '';
        }
    }
    
    // Ajustar altura do input
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
}

// ========================================
// EXPOR FUNÇÕES GLOBAIS
// ========================================
window.sendMessage = sendMessage;
window.handleScoreAction = handleScoreAction;
window.openImageModal = openImageModal;
window.deleteMessage = deleteMessage;
window.copyMessage = copyMessage;
window.showFullRanking = showFullRanking;
window.openProfile = openProfile;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.startAudioRecording = startAudioRecording;
window.capturePhoto = capturePhoto;

// ========================================
// CLEANUP
// ========================================
window.addEventListener('beforeunload', () => {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    if (isRecording) {
        stopAudioRecording();
    }
    
    // Marcar como offline
    const user = LoveChat.getState().currentUser;
    if (user) {
        LoveChat.api.updateUserStatus(user.id, false);
    }
});

console.log('✅ chat.js carregado com sucesso');
