// ========================================
// SERVIÇO DO CHAT
// ========================================
const ChatService = {
    messages: [],
    pollingInterval: null,
    
    // Inicializar chat
    async init() {
        const user = AuthService.checkAuth();
        if (!user) return null;
        
        await this.loadMessages();
        this.startPolling();
        return user;
    },
    
    // Carregar mensagens
    async loadMessages() {
        this.messages = await ApiService.getMessages(50);
        this.renderMessages();
    },
    
    // Renderizar mensagens
    renderMessages() {
        const area = document.getElementById('messagesArea');
        if (!area) return;
        
        area.innerHTML = '';
        
        if (this.messages.length === 0) {
            area.innerHTML = '<div class="empty-state">Nenhuma mensagem ainda. Envie a primeira!</div>';
            return;
        }
        
        const currentUser = AuthService.getCurrentUser();
        
        this.messages.forEach(msg => {
            const isOwn = msg.userId === currentUser?.id;
            const div = document.createElement('div');
            div.className = `message ${isOwn ? 'sent' : 'received'}`;
            
            const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let content = '';
            switch (msg.type) {
                case 'text':
                    content = `<p>${this.escapeHtml(msg.content)}</p>`;
                    break;
                case 'image':
                    content = `<img src="${msg.content}" alt="Imagem" style="max-width: 100%; border-radius: 10px;">`;
                    break;
                case 'video':
                    content = `<video controls src="${msg.content}" style="max-width: 100%; border-radius: 10px;"></video>`;
                    break;
                case 'audio':
                    content = `<audio controls src="${msg.content}" style="width: 100%;"></audio>`;
                    break;
            }
            
            div.innerHTML = `
                ${!isOwn ? `<div class="sender-name">${msg.userName}</div>` : ''}
                ${content}
                <div class="message-time">${time}</div>
            `;
            
            area.appendChild(div);
        });
        
        area.scrollTop = area.scrollHeight;
    },
    
    // Enviar mensagem de texto
    async sendText(text) {
        if (!text.trim()) return;
        
        const user = AuthService.getCurrentUser();
        
        const message = {
            userId: user.id,
            userName: user.nome,
            userPhoto: user.foto,
            type: 'text',
            content: text
        };
        
        const saved = await ApiService.saveMessage(message);
        if (saved) {
            this.messages.push(saved);
            this.renderMessages();
        }
    },
    
    // Enviar arquivo
    async sendFile(file, type) {
        return new Promise((resolve, reject) => {
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                alert('Arquivo muito grande. Máximo 10MB');
                reject();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const user = AuthService.getCurrentUser();
                const message = {
                    userId: user.id,
                    userName: user.nome,
                    userPhoto: user.foto,
                    type: type,
                    content: e.target.result
                };
                
                const saved = await ApiService.saveMessage(message);
                if (saved) {
                    this.messages.push(saved);
                    this.renderMessages();
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
    },
    
    // Adicionar pontos
    async addPoints(points, reason) {
        const user = AuthService.getCurrentUser();
        
        const score = {
            userId: user.id,
            points: points,
            reason: reason
        };
        
        await ApiService.saveScore(score);
        
        // Atualizar usuário local
        user.score = (user.score || 0) + points;
        if (localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        // Mensagem de sistema
        const message = {
            userId: 'system',
            userName: 'Sistema',
            type: 'text',
            content: `${points > 0 ? '🎁' : '⚠️'} ${user.nome} ${points > 0 ? 'ganhou' : 'perdeu'} ${Math.abs(points)} pontos! ${reason || ''}`
        };
        
        const saved = await ApiService.saveMessage(message);
        this.messages.push(saved);
        this.renderMessages();
        
        // Atualizar score na UI
        document.getElementById('userScore').textContent = user.score + ' pts';
    },
    
    // Polling para novas mensagens
    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        
        this.pollingInterval = setInterval(async () => {
            const messages = await ApiService.getMessages(50);
            if (messages.length > this.messages.length) {
                this.messages = messages;
                this.renderMessages();
            }
        }, 3000);
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
