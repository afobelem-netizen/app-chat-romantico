/**
 * LoveChat - Módulo de Autenticação
 * Versão: 1.0.0
 * Descrição: Gerencia todo o sistema de login, registro e autenticação
 */

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Inicializando módulo de autenticação...');
    
    // Inicializar componentes de UI
    initializeAuthUI();
    
    // Verificar se já está logado
    await checkExistingSession();
    
    // Configurar listeners
    setupAuthListeners();
});

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
let lockoutUntil = null;

// ========================================
// INICIALIZAÇÃO DA UI
// ========================================
function initializeAuthUI() {
    // Criar partículas animadas para o fundo
    createParticles();
    
    // Configurar toggle de senha
    setupPasswordToggles();
    
    // Configurar validações em tempo real
    setupRealTimeValidation();
    
    // Carregar temas salvos
    loadSavedTheme();
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 10 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDuration = Math.random() * 5 + 5 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        
        container.appendChild(particle);
    }
}

function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Trocar ícone
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.className = 'fas fa-eye-slash';
            } else {
                icon.className = 'fas fa-eye';
            }
        });
    });
}

function setupRealTimeValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('input', debounce(validateEmail, 500));
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', debounce(validatePassword, 500));
        passwordInput.addEventListener('blur', validatePassword);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// VERIFICAÇÃO DE SESSÃO
// ========================================
async function checkExistingSession() {
    try {
        // Verificar se há usuário na sessão
        const sessionUser = getSessionUser();
        
        if (sessionUser) {
            console.log('Sessão existente encontrada:', sessionUser.email);
            
            // Verificar se o usuário ainda existe no banco
            const users = await getUsers();
            const user = users.find(u => u.id === sessionUser.id);
            
            if (user) {
                // Atualizar status online
                user.online = true;
                user.ultimoAcesso = new Date().toISOString();
                await saveUsers(users);
                
                // Atualizar sessão
                saveSession(user);
                
                // Redirecionar para o chat
                showToast('Login automático realizado!', 'success');
                setTimeout(() => {
                    window.location.href = 'pages/chat.html';
                }, 1500);
                
                return true;
            }
        }
        
        // Verificar se há credenciais salvas com "Lembrar de mim"
        const savedCredentials = localStorage.getItem('savedCredentials');
        if (savedCredentials) {
            const creds = JSON.parse(savedCredentials);
            document.getElementById('email').value = creds.email;
            document.getElementById('password').value = creds.password;
            document.getElementById('rememberMe').checked = true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        return false;
    }
}

// ========================================
// FUNÇÕES PRINCIPAIS DE AUTENTICAÇÃO
// ========================================
async function handleLogin(event) {
    event.preventDefault();
    
    // Verificar bloqueio por tentativas
    if (isLockedOut()) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
        showToast(`Muitas tentativas. Tente novamente em ${remaining} minutos.`, 'error');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validar campos
    if (!validateEmail(email) || !validatePassword(password)) {
        return;
    }
    
    // Mostrar loading
    showLoading(true);
    
    try {
        // Buscar usuários
        const users = await getUsers();
        
        // Procurar usuário
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.senha === password
        );
        
        if (user) {
            // Login bem-sucedido
            loginAttempts = 0;
            
            // Atualizar dados do usuário
            user.online = true;
            user.ultimoAcesso = new Date().toISOString();
            await saveUsers(users);
            
            // Salvar sessão
            saveSession(user, rememberMe);
            
            // Salvar credenciais se "Lembrar de mim"
            if (rememberMe) {
                localStorage.setItem('savedCredentials', JSON.stringify({
                    email: email,
                    password: password
                }));
            } else {
                localStorage.removeItem('savedCredentials');
            }
            
            // Mostrar mensagem de sucesso
            showToast(`Bem-vindo(a), ${user.nome}!`, 'success');
            
            // Registrar atividade
            logActivity(user.id, 'login');
            
            // Redirecionar
            setTimeout(() => {
                window.location.href = 'pages/chat.html';
            }, 1500);
            
        } else {
            // Login falhou
            loginAttempts++;
            
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                lockoutUntil = Date.now() + LOCKOUT_TIME;
                showToast('Conta bloqueada temporariamente por muitas tentativas', 'error');
            } else {
                showToast(
                    `E-mail ou senha incorretos. Tentativa ${loginAttempts}/${MAX_LOGIN_ATTEMPTS}`,
                    'error'
                );
                
                // Shake animation no card
                document.querySelector('.login-card')?.classList.add('shake');
                setTimeout(() => {
                    document.querySelector('.login-card')?.classList.remove('shake');
                }, 500);
            }
            
            // Destacar campos com erro
            highlightError('email');
            highlightError('password');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro ao fazer login. Tente novamente.', 'error');
        
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const nome = document.getElementById('regNome')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    const termos = document.getElementById('termos')?.checked;
    
    // Validações
    if (!nome || nome.length < 3) {
        showToast('Nome deve ter pelo menos 3 caracteres', 'error');
        highlightError('regNome');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('E-mail inválido', 'error');
        highlightError('regEmail');
        return;
    }
    
    if (!validatePassword(password)) {
        showToast('Senha deve ter pelo menos 6 caracteres', 'error');
        highlightError('regPassword');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        highlightError('regConfirmPassword');
        return;
    }
    
    if (!termos) {
        showToast('Você deve aceitar os termos de uso', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const users = await getUsers();
        
        // Verificar se email já existe
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showToast('Este e-mail já está cadastrado', 'error');
            highlightError('regEmail');
            showLoading(false);
            return;
        }
        
        // Criar novo usuário
        const newUser = {
            id: generateId(),
            nome: nome,
            email: email.toLowerCase(),
            senha: password,
            foto: getRandomAvatar(),
            score: 0,
            online: false,
            ultimoAcesso: null,
            dataCriacao: new Date().toISOString(),
            preferencias: {
                notificacoes: true,
                som: true,
                tema: 'light'
            }
        };
        
        users.push(newUser);
        await saveUsers(users);
        
        showToast('Conta criada com sucesso!', 'success');
        
        // Fechar modal e limpar formulário
        closeRegisterModal();
        form.reset();
        
        // Pré-preencher login
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
        
        // Focar no botão de login
        setTimeout(() => {
            document.querySelector('.btn-login').focus();
        }, 500);
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showToast('Erro ao criar conta. Tente novamente.', 'error');
        
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        const user = getSessionUser();
        
        if (user) {
            // Atualizar status online
            const users = await getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            
            if (userIndex >= 0) {
                users[userIndex].online = false;
                users[userIndex].ultimoAcesso = new Date().toISOString();
                await saveUsers(users);
            }
            
            // Registrar atividade
            logActivity(user.id, 'logout');
        }
        
        // Limpar sessão
        clearSession();
        
        showToast('Até logo!', 'info');
        
        // Redirecionar para login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erro no logout:', error);
        // Mesmo com erro, tentar redirecionar
        clearSession();
        window.location.href = 'login.html';
    }
}

// ========================================
// RECUPERAÇÃO DE SENHA
// ========================================
async function handlePasswordRecovery(event) {
    event.preventDefault();
    
    const email = document.getElementById('recoverEmail').value.trim();
    
    if (!validateEmail(email)) {
        showToast('E-mail inválido', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const users = await getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // Gerar token de recuperação
            const token = generateRecoveryToken();
            
            // Salvar token (em produção, isso seria no backend)
            const recoveryData = {
                userId: user.id,
                token: token,
                expires: Date.now() + 3600000 // 1 hora
            };
            localStorage.setItem(`recovery_${user.id}`, JSON.stringify(recoveryData));
            
            // Simular envio de email
            console.log('Email de recuperação enviado para:', email);
            console.log('Token:', token);
            
            showToast('Instruções enviadas para seu e-mail!', 'success');
            
            // Fechar modal após 2 segundos
            setTimeout(() => {
                closeRecoverModal();
            }, 2000);
            
        } else {
            // Por segurança, não informar se o email existe ou não
            showToast('Se o e-mail existir, você receberá instruções', 'info');
            setTimeout(() => {
                closeRecoverModal();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        showToast('Erro ao processar solicitação', 'error');
        
    } finally {
        showLoading(false);
    }
}

async function resetPassword(token, newPassword) {
    try {
        // Buscar token válido
        const recoveryData = JSON.parse(localStorage.getItem(`recovery_${token}`));
        
        if (!recoveryData || recoveryData.expires < Date.now()) {
            showToast('Token inválido ou expirado', 'error');
            return false;
        }
        
        const users = await getUsers();
        const user = users.find(u => u.id === recoveryData.userId);
        
        if (user) {
            user.senha = newPassword;
            await saveUsers(users);
            
            // Remover token usado
            localStorage.removeItem(`recovery_${token}`);
            
            showToast('Senha alterada com sucesso!', 'success');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        showToast('Erro ao resetar senha', 'error');
        return false;
    }
}

// ========================================
// VALIDAÇÕES
// ========================================
function validateEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    const emailInput = document.getElementById('email');
    if (emailInput) {
        if (isValid) {
            emailInput.classList.remove('error');
            emailInput.classList.add('success');
        } else {
            emailInput.classList.remove('success');
            emailInput.classList.add('error');
        }
    }
    
    return isValid;
}

function validatePassword(password) {
    if (!password) return false;
    
    const isValid = password.length >= 6;
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        if (isValid) {
            passwordInput.classList.remove('error');
            passwordInput.classList.add('success');
        } else {
            passwordInput.classList.remove('success');
            passwordInput.classList.add('error');
        }
    }
    
    return isValid;
}

function highlightError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
        setTimeout(() => {
            field.classList.remove('error');
        }, 2000);
    }
}

// ========================================
// GERENCIAMENTO DE SESSÃO
// ========================================
function getSessionUser() {
    // Tentar sessionStorage primeiro
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        return JSON.parse(sessionUser);
    }
    
    // Tentar localStorage (lembrar de mim)
    const localUser = localStorage.getItem('currentUser');
    if (localUser) {
        return JSON.parse(localUser);
    }
    
    return null;
}

function saveSession(user, remember = false) {
    const userData = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        foto: user.foto,
        score: user.score
    };
    
    if (remember) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.removeItem('currentUser');
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.removeItem('currentUser');
    }
}

function clearSession() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
}

// ========================================
// GERENCIAMENTO DE USUÁRIOS (LOCAL STORAGE)
// ========================================
async function getUsers() {
    // Tentar localStorage primeiro
    let users = localStorage.getItem('users');
    
    if (users) {
        return JSON.parse(users);
    }
    
    // Se não existir, criar usuário padrão
    const defaultUsers = [
        {
            id: 1,
            nome: 'Usuário Teste',
            email: 'teste@email.com',
            senha: '123456',
            foto: 'https://via.placeholder.com/150/667eea/ffffff?text=Teste',
            score: 150,
            online: false,
            ultimoAcesso: null,
            dataCriacao: new Date().toISOString(),
            preferencias: {
                notificacoes: true,
                som: true,
                tema: 'light'
            }
        },
        {
            id: 2,
            nome: 'Crush',
            email: 'crush@email.com',
            senha: '123456',
            foto: 'https://via.placeholder.com/150/764ba2/ffffff?text=Crush',
            score: 120,
            online: false,
            ultimoAcesso: null,
            dataCriacao: new Date().toISOString(),
            preferencias: {
                notificacoes: true,
                som: true,
                tema: 'light'
            }
        }
    ];
    
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
}

async function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// ========================================
// UTILITÁRIOS
// ========================================
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function generateRecoveryToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function getRandomAvatar() {
    const avatars = [
        'https://via.placeholder.com/150/667eea/ffffff?text=User',
        'https://via.placeholder.com/150/764ba2/ffffff?text=User',
        'https://via.placeholder.com/150/ff4b6e/ffffff?text=User',
        'https://via.placeholder.com/150/4caf50/ffffff?text=User',
        'https://via.placeholder.com/150/ff9800/ffffff?text=User'
    ];
    
    return avatars[Math.floor(Math.random() * avatars.length)];
}

function isLockedOut() {
    return lockoutUntil && Date.now() < lockoutUntil;
}

function logActivity(userId, action) {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    
    activities.push({
        userId: userId,
        action: action,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'local'
    });
    
    // Manter apenas últimas 100 atividades
    if (activities.length > 100) {
        activities.shift();
    }
    
    localStorage.setItem('activities', JSON.stringify(activities));
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// ========================================
// INTERFACE DO USUÁRIO
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showLoading(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ========================================
// MODAIS
// ========================================
function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focar no primeiro campo
        setTimeout(() => {
            document.getElementById('regNome')?.focus();
        }, 300);
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openRecoverModal() {
    const modal = document.getElementById('recoverModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeRecoverModal() {
    const modal = document.getElementById('recoverModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('recoverForm')?.reset();
    }
}

// ========================================
// SETUP DE LISTENERS
// ========================================
function setupAuthListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Recover form
    const recoverForm = document.getElementById('recoverForm');
    if (recoverForm) {
        recoverForm.addEventListener('submit', handlePasswordRecovery);
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRegisterModal();
            closeRecoverModal();
        }
    });
    
    // Fechar modais clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRegisterModal();
                closeRecoverModal();
            }
        });
    });
    
    // Botão de criar conta
    const createAccountBtn = document.querySelector('[data-action="create-account"]');
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', openRegisterModal);
    }
    
    // Botão de esqueci senha
    const forgotPasswordBtn = document.querySelector('[data-action="forgot-password"]');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', openRecoverModal);
    }
    
    // Detectar Enter nos campos
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const form = input.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
}

// ========================================
// EXPOR FUNÇÕES GLOBAIS
// ========================================
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.openRecoverModal = openRecoverModal;
window.closeRecoverModal = closeRecoverModal;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;

// ========================================
// CLEANUP
// ========================================
window.addEventListener('beforeunload', () => {
    // Limpar timeouts se necessário
});

console.log('✅ auth.js carregado com sucesso');
