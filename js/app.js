// ========================================
// SERVIÇO DE API - JSONBin.io
// ========================================
const ApiService = {
    // Buscar todos os dados do bin
    async getData() {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}/latest`, {
                headers: API_HEADERS
            });
            
            if (!response.ok) throw new Error('Erro ao buscar dados');
            
            const data = await response.json();
            return data.record;
        } catch (error) {
            console.error('Erro no getData:', error);
            return null;
        }
    },
    
    // Atualizar dados no bin
    async updateData(data) {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: API_HEADERS,
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Erro ao atualizar dados');
            
            return await response.json();
        } catch (error) {
            console.error('Erro no updateData:', error);
            return null;
        }
    },
    
    // ===== USUÁRIOS =====
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
            user.id = Date.now();
            user.dataCriacao = new Date().toISOString();
            data.users.push(user);
        }
        
        await this.updateData(data);
        return user;
    },
    
    // ===== MENSAGENS =====
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
        
        await this.updateData(data);
        return message;
    },
    
    // ===== PONTUAÇÕES =====
    async saveScore(score) {
        const data = await this.getData();
        if (!data) return null;
        
        score.id = Date.now();
        score.timestamp = new Date().toISOString();
        data.scores = data.scores || [];
        data.scores.push(score);
        
        // Atualizar score do usuário
        const user = data.users.find(u => u.id === score.userId);
        if (user) {
            user.score = (user.score || 0) + score.points;
        }
        
        await this.updateData(data);
        return score;
    },
    
    async getRanking() {
        const data = await this.getData();
        return data?.users?.sort((a, b) => (b.score || 0) - (a.score || 0)) || [];
    }
};

// Inicializar estrutura se necessário
(async function initDatabase() {
    const data = await ApiService.getData();
    if (!data) {
        const initialData = {
            users: [{
                id: 1,
                nome: 'Usuário Teste',
                email: 'teste@email.com',
                senha: '123456',
                foto: 'https://via.placeholder.com/150/667eea/ffffff?text=Teste',
                score: 0,
                online: false,
                ultimoAcesso: null,
                dataCriacao: new Date().toISOString()
            }],
            messages: [],
            scores: []
        };
        await ApiService.updateData(initialData);
        console.log('✅ Banco de dados inicializado');
    }
})();
