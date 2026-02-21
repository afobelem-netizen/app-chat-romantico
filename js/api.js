// ========================================
// SERVIÇO DA API - JSONBin.io
// ========================================
const ApiService = {
    // Buscar dados
    async getData() {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}/latest`, {
                headers: API_HEADERS
            });
            const data = await response.json();
            return data.record;
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            return null;
        }
    },

    // Salvar dados
    async saveData(data) {
        try {
            await fetch(`${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: API_HEADERS,
                body: JSON.stringify(data)
            });
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    },

    // ===== USUÁRIOS =====
    async getUsers() {
        const data = await this.getData();
        return data?.users || [];
    },

    async saveUser(user) {
        const data = await this.getData();
        if (!data) return false;
        
        const index = data.users.findIndex(u => u.id === user.id);
        if (index >= 0) {
            data.users[index] = user;
        } else {
            user.id = Date.now();
            data.users.push(user);
        }
        
        return await this.saveData(data);
    },

    // ===== MENSAGENS =====
    async getMessages() {
        const data = await this.getData();
        return data?.messages || [];
    },

    async addMessage(message) {
        const data = await this.getData();
        if (!data) return false;
        
        message.id = Date.now();
        message.timestamp = new Date().toISOString();
        data.messages.push(message);
        
        return await this.saveData(data);
    },

    // ===== PONTUAÇÕES =====
    async addScore(score) {
        const data = await this.getData();
        if (!data) return false;
        
        score.id = Date.now();
        score.timestamp = new Date().toISOString();
        data.scores.push(score);
        
        // Atualizar score do usuário
        const user = data.users.find(u => u.id === score.userId);
        if (user) {
            user.score = (user.score || 0) + score.points;
        }
        
        return await this.saveData(data);
    }
};
