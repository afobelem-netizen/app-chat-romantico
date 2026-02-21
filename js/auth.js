// ========================================
// SERVIÇO DE AUTENTICAÇÃO
// ========================================
const AuthService = {
    // Login
    async login(email, senha, remember = false) {
        try {
            const users = await ApiService.getUsers();
            const user = users.find(u => u.email === email && u.senha === senha);
            
            if (!user) {
                return { success: false, message: 'E-mail ou senha incorretos' };
            }
            
            // Atualizar status online
            user.online = true;
            user.ultimoAcesso = new Date().toISOString();
            await ApiService.saveUser(user);
            
            // Dados para salvar na sessão
            const userData = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                foto: user.foto,
                score: user.score || 0
            };
            
            // Salvar no storage apropriado
            if (remember) {
                localStorage.setItem('currentUser', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
            }
            
            return { success: true, user: userData };
            
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro ao fazer login' };
        }
    },
    
    // Logout
    async logout() {
        const user = this.getCurrentUser();
        if (user) {
            const users = await ApiService.getUsers();
            const dbUser = users.find(u => u.id === user.id);
            if (dbUser) {
                dbUser.online = false;
                dbUser.ultimoAcesso = new Date().toISOString();
                await ApiService.saveUser(dbUser);
            }
        }
        
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
    },
    
    // Registrar novo usuário
    async register(nome, email, senha) {
        try {
            const users = await ApiService.getUsers();
            
            // Verificar se email já existe
            if (users.some(u => u.email === email)) {
                return { success: false, message: 'E-mail já cadastrado' };
            }
            
            const newUser = {
                nome,
                email,
                senha,
                foto: `https://via.placeholder.com/150/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${nome.charAt(0)}`,
                score: 0,
                online: false,
                ultimoAcesso: null
            };
            
            await ApiService.saveUser(newUser);
            return { success: true, message: 'Conta criada com sucesso!' };
            
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, message: 'Erro ao criar conta' };
        }
    },
    
    // Verificar usuário atual
    getCurrentUser() {
        const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    // Verificar autenticação
    checkAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    }
};
