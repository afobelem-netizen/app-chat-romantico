/**
 * LoveChat - Aplicativo Principal
 * Versão: 1.0.0
 * Descrição: Chat romântico com sistema de pontuação e mídia
 */

// ========================================
// CONFIGURAÇÕES GLOBAIS
// ========================================
const CONFIG = {
    appName: 'LoveChat',
    version: '1.0.0',
    maxMessages: 100,
    maxMessageLength: 1000,
    pollingInterval: 3000, // 3 segundos
    heartbeatInterval: 30000, // 30 segundos
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    dateFormat: 'DD/MM/YYYY HH:mm',
    theme: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#4caf50',
        danger: '#f44336'
    }
};

// ========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================================
const AppState = {
    currentUser: null,
    users: [],
    messages: [],
    scores: [],
    isOnline: navigator.onLine,
    isTyping: false,
    unreadCount: 0,
    selectedChat: null,
    theme: 'light',
    loading: false,
    error: null,
    
    // Getters
    get totalUsers() {
        return this.users.length;
    },
    
    get totalMessages() {
        return this.messages.length;
    },
    
    get totalScore() {
        return this.users.reduce((acc, user) => acc + (user.score || 0), 0);
    },
    
    get onlineUsers() {
        return this.users.filter(u => u.online).length;
    }
};

// ========================================
// SERVIÇO DE ARMAZENAMENTO
// ========================================
const StorageService = {
    // LocalStorage
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    },
    
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    },
    
    // SessionStorage
    saveSession(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar na sessionStorage:', error);
            return false;
        }
    },
    
    loadSession(key, defaultValue = null) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Erro ao carregar da sessionStorage:', error);
            return defaultValue;
        }
    },
    
    removeSession(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover da sessionStorage:', error);
            return false;
        }
    }
};

// ========================================
// SERVIÇO DE API (JSONBin.io)
// ========================================
const ApiService = {
    baseUrl: 'https://api.jsonbin.io/v3',
    apiKey: 'SUA_API_KEY_AQUI', // Substitua pela sua API Key
    binId: 'SEU_BIN_ID_AQUI', // Substitua pelo seu Bin ID
    
    get headers() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': this.apiKey
        };
    },
    
    // Inicializar banco de dados
    async initDatabase() {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                const data = {
                    users: [
                        {
                            id: 1,
                            nome: 'Usuário Teste',
                            email: 'teste@email.com',
                            senha: '123456',
                            foto: 'https://via.placeholder.com/150',
                            score: 0,
                            online: false,
                            ultimoAcesso: null,
                            dataCriacao: new Date().toISOString()
                        }
                    ],
                    messages: [],
                    scores: [],
                    config: {
                        appName: 'LoveChat',
                        createdAt: new Date().toISOString()
                    }
                };
                
                const createResponse = await fetch(`${this.baseUrl}/b`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(data)
                });
                
                const result = await createResponse.json();
                this.binId = result.metadata.id;
                console.log('Banco de dados criado com sucesso! ID:', this.binId);
                return result;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            NotificationService.error('Erro ao conectar com o servidor');
            return null;
        }
    },
    
    // Buscar todos os dados
    async getData() {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar dados');
            }
            
            const data = await response.json();
            return data.record;
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            NotificationService.error('Erro ao carregar dados');
            return null;
        }
    },
    
    // Atualizar dados
    async updateData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar dados');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            NotificationService.error('Erro ao salvar dados');
            return null;
        }
    },
    
    // Usuários
    async getUsers() {
        const data = await this.getData();
        return data?.users || [];
    },
    
    async getUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(u => u.email === email);
    },
    
    async getUserById(id) {
        const users = await this.getUsers();
        return users.find(u => u.id === id);
    },
    
    async saveUser(user) {
        const data = await this.getData();
        if (!data) return null;
        
        const index = data.users.findIndex(u => u.id === user.id);
        
        if (index >= 0) {
            data.users[index] = user;
        } else {
            user.id = data.users.length + 1;
            user.dataCriacao = new Date().toISOString();
            data.users.push(user);
        }
        
        await this.updateData(data);
        return user;
    },
    
    async updateUserStatus(userId, online) {
        const data = await this.getData();
        if (!data) return null;
        
        const user = data.users.find(u => u.id === userId);
        if (user) {
            user.online = online;
            user.ultimoAcesso = new Date().toISOString();
            await this.updateData(data);
        }
        
        return user;
    },
    
    // Mensagens
    async getMessages(limit = 50) {
        const data = await this.getData();
        const messages = data?.messages || [];
        return messages.slice(-limit);
    },
    
    async saveMessage(message) {
        const data = await this.getData();
        if (!data) return null;
        
        message.id = Date.now();
        message.timestamp = new Date().toISOString();
        data.messages.push(message);
        
        if (data.messages.length > CONFIG.maxMessages) {
            data.messages = data.messages.slice(-CONFIG.maxMessages);
        }
        
        await this.updateData(data);
        return message;
    },
    
    async deleteMessage(messageId) {
        const data = await this.getData();
        if (!data) return false;
        
        data.messages = data.messages.filter(m => m.id !== messageId);
        await this.updateData(data);
        return true;
    },
    
    // Pontuações
    async saveScore(score) {
        const data = await this.getData();
        if (!data) return null;
        
        score.id = Date.now();
        score.timestamp = new Date().toISOString();
        data.scores.push(score);
        
        // Atualizar score do usuário
        const user = data.users.find(u => u.id === score.userId);
        if (user) {
            user.score = (user.score || 0) + score.points;
        }
        
        await this.updateData(data);
        return score;
    },
    
    async getUserScores(userId) {
        const data = await this.getData();
        return data?.scores?.filter(s => s.userId === userId) || [];
    },
    
    async getRanking() {
        const data = await this.getData();
        return data?.users?.sort((a, b) => (b.score || 0) - (a.score || 0)) || [];
    }
};

// ========================================
// SERVIÇO DE NOTIFICAÇÕES
// ========================================
const NotificationService = {
    toastContainer: null,
    
    init() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                this.toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    },
    
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};

// ========================================
// SERVIÇO DE AUTENTICAÇÃO
// ========================================
const AuthService = {
    async login(email, password, remember = false) {
        try {
            const user = await ApiService.getUserByEmail(email);
            
            if (!user || user.senha !== password) {
                NotificationService.error('E-mail ou senha incorretos');
                return null;
            }
            
            // Atualizar status online
            user.online = true;
            user.ultimoAcesso = new Date().toISOString();
            await ApiService.saveUser(user);
            
            // Salvar na sessão
            const storage = remember ? StorageService : StorageService;
            storage.saveSession('currentUser', user);
            
            AppState.currentUser = user;
            NotificationService.success(`Bem-vindo(a), ${user.nome}!`);
            
            return user;
        } catch (error) {
            console.error('Erro no login:', error);
            NotificationService.error('Erro ao fazer login');
            return null;
        }
    },
    
    async logout() {
        if (AppState.currentUser) {
            await ApiService.updateUserStatus(AppState.currentUser.id, false);
        }
        
        StorageService.removeSession('currentUser');
        AppState.currentUser = null;
        
        NotificationService.info('Até logo!');
        window.location.href = 'login.html';
    },
    
    async register(userData) {
        try {
            const existingUser = await ApiService.getUserByEmail(userData.email);
            
            if (existingUser) {
                NotificationService.error('E-mail já cadastrado');
                return null;
            }
            
            const newUser = {
                ...userData,
                id: Date.now(),
                score: 0,
                online: false,
                foto: userData.foto || 'https://via.placeholder.com/150',
                dataCriacao: new Date().toISOString(),
                ultimoAcesso: null
            };
            
            await ApiService.saveUser(newUser);
            NotificationService.success('Conta criada com sucesso!');
            
            return newUser;
        } catch (error) {
            console.error('Erro no registro:', error);
            NotificationService.error('Erro ao criar conta');
            return null;
        }
    },
    
    async checkAuth() {
        const savedUser = StorageService.loadSession('currentUser');
        
        if (savedUser) {
            const user = await ApiService.getUserById(savedUser.id);
            
            if (user) {
                user.online = true;
                await ApiService.saveUser(user);
                AppState.currentUser = user;
                return user;
            }
        }
        
        return null;
    }
};

// ========================================
// SERVIÇO DE CHAT
// ========================================
const ChatService = {
    pollingInterval: null,
    typingTimeout: null,
    
    async sendMessage(content, type = 'text') {
        if (!AppState.currentUser) {
            NotificationService.error('Usuário não autenticado');
            return null;
        }
        
        if (type === 'text' && !content.trim()) {
            NotificationService.warning('Digite uma mensagem');
            return null;
        }
        
        const message = {
            userId: AppState.currentUser.id,
            userName: AppState.currentUser.nome,
            userPhoto: AppState.currentUser.foto,
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        const saved = await ApiService.saveMessage(message);
        
        if (saved) {
            AppState.messages.push(saved);
            this.renderMessage(saved);
            return saved;
        }
        
        return null;
    },
    
    async sendFile(file, type) {
        return new Promise((resolve, reject) => {
            if (file.size > CONFIG.maxFileSize) {
                NotificationService.error(`Arquivo muito grande. Máximo: ${CONFIG.maxFileSize / 1024 / 1024}MB`);
                reject(new Error('Arquivo muito grande'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                const message = await this.sendMessage(e.target.result, type);
                resolve(message);
            };
            
            reader.onerror = (error) => {
                NotificationService.error('Erro ao ler arquivo');
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    },
    
    async startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(async () => {
            await this.checkNewMessages();
        }, CONFIG.pollingInterval);
    },
    
    async checkNewMessages() {
        const messages = await ApiService.getMessages();
        
        if (messages.length > AppState.messages.length) {
            const newMessages = messages.slice(AppState.messages.length);
            
            newMessages.forEach(message => {
                if (message.userId !== AppState.currentUser?.id) {
                    this.renderMessage(message);
                    this.notifyNewMessage(message);
                }
            });
            
            AppState.messages = messages;
        }
    },
    
    renderMessage(message) {
        const messagesArea = document.getElementById('messagesArea');
        if (!messagesArea) return;
        
        const isOwn = message.userId === AppState.currentUser?.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'sent' : 'received'}`;
        messageElement.dataset.id = message.id;
        
        let content = '';
        
        switch (message.type) {
            case 'text':
                content = `<p>${this.escapeHtml(message.content)}</p>`;
                break;
            case 'image':
                content = `<img src="${message.content}" alt="Imagem" onclick="ChatService.openImage('${message.content}')">`;
                break;
            case 'video':
                content = `<video controls src="${message.content}"></video>`;
                break;
            case 'audio':
                content = `<audio controls src="${message.content}"></audio>`;
                break;
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString();
        
        messageElement.innerHTML = `
            ${!isOwn ? `<div class="sender-name">${this.escapeHtml(message.userName)}</div>` : ''}
            ${content}
            <div class="message-time">${time}</div>
        `;
        
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    notifyNewMessage(message) {
        if (document.hidden) {
            // Notificação do navegador se a aba estiver inativa
            if (Notification.permission === 'granted') {
                new Notification('Nova mensagem 💕', {
                    body: `${message.userName}: ${message.type === 'text' ? message.content : 'Enviou uma mídia'}`,
                    icon: message.userPhoto
                });
            }
        }
        
        // Som de notificação
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    },
    
    setTyping(isTyping) {
        AppState.isTyping = isTyping;
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        if (isTyping) {
            this.typingTimeout = setTimeout(() => {
                AppState.isTyping = false;
                this.updateTypingIndicator();
            }, 3000);
        }
        
        this.updateTypingIndicator();
    },
    
    updateTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (!indicator) return;
        
        if (AppState.isTyping) {
            indicator.innerHTML = '<i class="fas fa-pencil-alt"></i> Digitando...';
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    },
    
    openImage(src) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; background: transparent; box-shadow: none;">
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
                <img src="${src}" style="max-width: 100%; max-height: 90vh; border-radius: 10px;">
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
};

// ========================================
// SERVIÇO DE PONTUAÇÃO
// ========================================
const ScoreService = {
    async addPoints(userId, points, reason) {
        if (!AppState.currentUser) return null;
        
        const score = {
            userId: userId,
            points: points,
            reason: reason,
            fromUserId: AppState.currentUser.id,
            timestamp: new Date().toISOString()
        };
        
        const saved = await ApiService.saveScore(score);
        
        if (saved) {
            // Atualizar score do usuário
            if (userId === AppState.currentUser.id) {
                AppState.currentUser.score = (AppState.currentUser.score || 0) + points;
                StorageService.saveSession('currentUser', AppState.currentUser);
            }
            
            // Atualizar interface
            this.updateScoreDisplay();
            
            // Mensagem de sistema
            const emoji = points > 0 ? '🎁' : '⚠️';
            const action = points > 0 ? 'ganhou' : 'perdeu';
            
            ChatService.sendMessage(
                `${emoji} ${AppState.currentUser.nome} ${action} ${Math.abs(points)} pontos! ${reason}`,
                'text'
            );
            
            NotificationService.success(`${Math.abs(points)} pontos ${points > 0 ? 'adicionados' : 'removidos'}!`);
        }
        
        return saved;
    },
    
    async getRanking() {
        return await ApiService.getRanking();
    },
    
    updateScoreDisplay() {
        const userScoreEl = document.getElementById('userScore');
        const totalScoreEl = document.getElementById('totalScore');
        
        if (userScoreEl) {
            userScoreEl.textContent = AppState.currentUser?.score || 0;
        }
        
        if (totalScoreEl) {
            const total = AppState.users.reduce((acc, u) => acc + (u.score || 0), 0);
            totalScoreEl.textContent = total;
        }
    },
    
    renderRanking() {
        const container = document.getElementById('rankingContainer');
        if (!container) return;
        
        this.getRanking().then(users => {
            container.innerHTML = `
                <div class="ranking-container">
                    <div class="ranking-header">
                        <h3 class="ranking-title">🏆 Ranking do Casal</h3>
                        <span>Total: ${users.reduce((acc, u) => acc + (u.score || 0), 0)} pontos</span>
                    </div>
                    <ul class="ranking-list">
                        ${users.map((user, index) => `
                            <li class="ranking-item ${user.id === AppState.currentUser?.id ? 'current-user' : ''}">
                                <div class="ranking-position ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
                                    ${index + 1}
                                </div>
                                <div class="ranking-info">
                                    <img src="${user.foto}" alt="${user.nome}">
                                    <span class="ranking-name">${user.nome}</span>
                                </div>
                                <span class="ranking-score">${user.score || 0} pts</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });
    }
};

// ========================================
// SERVIÇO DE PERFIL
// ========================================
const ProfileService = {
    async updateProfile(data) {
        if (!AppState.currentUser) return null;
        
        const user = { ...AppState.currentUser, ...data };
        const saved = await ApiService.saveUser(user);
        
        if (saved) {
            AppState.currentUser = saved;
            StorageService.saveSession('currentUser', saved);
            this.updateProfileDisplay();
            NotificationService.success('Perfil atualizado!');
        }
        
        return saved;
    },
    
    async updatePhoto(file) {
        return new Promise((resolve, reject) => {
            if (!CONFIG.allowedImageTypes.includes(file.type)) {
                NotificationService.error('Formato de imagem não suportado');
                reject(new Error('Formato inválido'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                const user = await this.updateProfile({ foto: e.target.result });
                resolve(user);
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    updateProfileDisplay() {
        const photoEl = document.getElementById('profilePhoto');
        const nameEl = document.getElementById('userName');
        
        if (photoEl && AppState.currentUser) {
            photoEl.src = AppState.currentUser.foto;
        }
        
        if (nameEl && AppState.currentUser) {
            nameEl.textContent = AppState.currentUser.nome;
        }
    }
};

// ========================================
// SERVIÇO DE UI
// ========================================
const UIService = {
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupModals();
        this.requestNotificationPermission();
    },
    
    setupEventListeners() {
        // Monitorar conexão
        window.addEventListener('online', () => {
            AppState.isOnline = true;
            this.updateConnectionStatus();
            NotificationService.success('Conexão restabelecida!');
        });
        
        window.addEventListener('offline', () => {
            AppState.isOnline = false;
            this.updateConnectionStatus();
            NotificationService.warning('Você está offline');
        });
        
        // Monitorar visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                ChatService.checkNewMessages();
            }
        });
        
        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },
    
    setupTheme() {
        const savedTheme = StorageService.load('theme', 'light');
        this.setTheme(savedTheme);
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        StorageService.save('theme', theme);
        AppState.theme = theme;
    },
    
    toggleTheme() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },
    
    setupModals() {
        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    },
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },
    
    updateConnectionStatus() {
        const statusEl = document.querySelector('.connection-status');
        if (statusEl) {
            statusEl.textContent = AppState.isOnline ? 'Online' : 'Offline';
            statusEl.className = `connection-status ${AppState.isOnline ? 'online' : 'offline'}`;
        }
    },
    
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    },
    
    showLoading(show = true) {
        AppState.loading = show;
        
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    },
    
    showConfirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Confirmar</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="confirmBtn">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        
        modal.querySelector('#confirmBtn').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
    }
};

// ========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`🚀 ${CONFIG.appName} v${CONFIG.version} iniciando...`);
    
    // Inicializar UI
    UIService.init();
    
    // Verificar autenticação
    const user = await AuthService.checkAuth();
    
    if (user) {
        console.log('👤 Usuário autenticado:', user.nome);
        
        // Iniciar heartbeat
        startHeartbeat();
        
        // Carregar dados iniciais
        await loadInitialData();
        
        // Iniciar polling de mensagens
        ChatService.startPolling();
        
        // Atualizar ranking
        ScoreService.renderRanking();
        
        // Configurar listeners do chat
        setupChatListeners();
    } else {
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
async function loadInitialData() {
    UIService.showLoading(true);
    
    try {
        AppState.users = await ApiService.getUsers();
        AppState.messages = await ApiService.getMessages();
        
        // Renderizar mensagens
        const messagesArea = document.getElementById('messagesArea');
        if (messagesArea) {
            messagesArea.innerHTML = '';
            AppState.messages.forEach(msg => ChatService.renderMessage(msg));
        }
        
        // Atualizar score
        ScoreService.updateScoreDisplay();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        NotificationService.error('Erro ao carregar dados');
    } finally {
        UIService.showLoading(false);
    }
}

function startHeartbeat() {
    setInterval(async () => {
        if (AppState.currentUser) {
            await ApiService.updateUserStatus(AppState.currentUser.id, true);
        }
    }, CONFIG.heartbeatInterval);
}

function setupChatListeners() {
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        messageInput.addEventListener('input', () => {
            ChatService.setTyping(messageInput.value.length > 0);
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

async function handleSendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text) {
        await ChatService.sendMessage(text, 'text');
        input.value = '';
        ChatService.setTyping(false);
    }
}

async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    let type = '';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    else {
        NotificationService.error('Tipo de arquivo não suportado');
        return;
    }
    
    await ChatService.sendFile(file, type);
    e.target.value = '';
}

function handleLogout() {
    UIService.showConfirm('Deseja realmente sair?', () => {
        AuthService.logout();
    });
}

function showConfig() {
    const modal = document.getElementById('configModal');
    if (modal) {
        modal.classList.add('active');
        
        // Preencher dados do usuário
        document.getElementById('profileName').value = AppState.currentUser?.nome || '';
        document.getElementById('profileEmail').value = AppState.currentUser?.email || '';
    }
}

function closeConfig() {
    const modal = document.getElementById('configModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ========================================
// EXPOR FUNÇÕES GLOBAIS
// ========================================
window.LoveChat = {
    // Serviços
    auth: AuthService,
    chat: ChatService,
    score: ScoreService,
    profile: ProfileService,
    ui: UIService,
    storage: StorageService,
    api: ApiService,
    
    // Funções utilitárias
    sendMessage: handleSendMessage,
    logout: handleLogout,
    showConfig,
    closeConfig,
    
    // Pontuação
    givePoints: (points, reason) => ScoreService.addPoints(AppState.currentUser?.id, points, reason),
    
    // Estado
    getState: () => AppState,
    
    // Configurações
    config: CONFIG
};

// ========================================
// CLEANUP
// ========================================
window.addEventListener('beforeunload', () => {
    ChatService.stopPolling();
    
    if (AppState.currentUser) {
        ApiService.updateUserStatus(AppState.currentUser.id, false);
    }
});

console.log('✅ LoveChat carregado com sucesso!');
