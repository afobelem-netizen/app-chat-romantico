/**
 * LoveChat - Módulo de Autenticação
 * Versão: 2.0.0
 * Descrição: Gerencia autenticação com JSONBin.io
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
const LOCKOUT_TIME = 15 * 60 * 1000;
let lockoutUntil = null;

// ========================================
// INICIALIZAÇÃO DA UI
// ========================================
function initializeAuthUI() {
    createParticles();
    setupPasswordToggles();
    setupRealTimeValidation();
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
            
            const icon = this.querySelector('i');
            icon.className = type === 'text' ? 'fas fa-eye-slash' : 'fas fa-eye';
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
        const sessionUser = getSessionUser();
        
        if (sessionUser) {
            console.log('Sessão existente encontrada:', sessionUser.email);
            
            // Verificar no JSONBin.io
            const users = await getUsers();
            const user = users.find(u => u.id === sessionUser.id);
            
            if (user) {
                user.online = true;
                user.ultimoAcesso = new Date().toISOString();
                await saveUsers(users);
                
                saveSession(user);
                
                showToast('Login automático realizado!', 'success');
                setTimeout(() => {
                    window.location.href = 'pages/chat.html';
                }, 1500);
                
                return true;
            }
        }
        
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
    
    if (isLockedOut()) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
        showToast(`Muitas tentativas. Tente novamente em ${remaining} minutos.`, 'error');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    if (!validateEmail(email) || !validatePassword(password)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const users = await getUsers();
        
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.senha === password
        );
        
        if (user) {
            loginAttempts = 0;
            
            user.online = true;
            user.ultimoAcesso = new Date().toISOString();
            await saveUsers(users);
            
            saveSession(user, rememberMe);
            
            if (rememberMe) {
                localStorage.setItem('savedCredentials', JSON.stringify({
                    email: email,
                    password: password
                }));
            } else {
                localStorage.removeItem('savedCredentials');
            }
            
            showToast(`Bem-vindo(a), ${user.nome}!`, 'success');
            
            logActivity(user.id, 'login');
            
            setTimeout(() => {
                window.location.href = 'pages/chat.html';
            }, 1500);
            
        } else {
            loginAttempts++;
            
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                lockoutUntil = Date.now() + LOCKOUT_TIME;
                showToast('Conta bloqueada temporariamente por muitas tentativas', 'error');
            } else {
                showToast(
                    `E-mail ou senha incorretos. Tentativa ${loginAttempts}/${MAX_LOGIN_ATTEMPTS}`,
                    'error'
                );
                
                document.querySelector('.login-card')?.classList.add('shake');
                setTimeout(() => {
                    document.querySelector('.login-card')?.classList.remove('shake');
                }, 500);
            }
            
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
    
    const nome = document.getElementById('newName')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const password = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validações
    if (!nome || nome.length < 3) {
        showToast('Nome deve ter pelo menos 3 caracteres', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('E-mail inválido', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showToast('Senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Buscar usuários do JSONBin.io
        const users = await getUsers();
        
        // Verificar se email já existe
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showToast('Este e-mail já está cadastrado', 'error');
            showLoading(false);
            return;
        }
        
        // Criar novo usuário
        const newUser = {
            id: Date.now(),
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
        
        // Adicionar ao array
        users.push(newUser);
        
        // Salvar no JSONBin.io
        const saved = await saveUsers(users);
        
        if (saved) {
            showToast('Conta criada com sucesso!', 'success');
            
            // Fechar modal
            closeCreateAccountModal();
            
            // Pré-preencher login
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
        } else {
            showToast('Erro ao salvar no servidor', 'error');
        }
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showToast('Erro ao criar conta. Tente novamente.', 'error');
        
    } finally {
        showLoading(false);
    }
}

// ========================================
// FUNÇÕES DE INTEGRAÇÃO COM JSONBIN.IO
// ========================================
async function getUsers() {
    try {
        // Usar o ApiService do app.js
        if (window.LoveChat && window.LoveChat.api) {
            return await window.LoveChat.api.getUsers();
        }
        
        // Fallback para localStorage se ApiService não estiver disponível
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
        
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

async function saveUsers(users) {
    try {
        // Usar o ApiService do app.js
        if (window.LoveChat && window.LoveChat.api) {
            // Buscar dados completos
            const data = await window.LoveChat.api.getData();
            if (data) {
                data.users = users;
                await window.LoveChat.api.updateData(data);
                return true;
            }
        }
        
        // Fallback para localStorage
        localStorage.setItem('users', JSON.stringify(users));
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar usuários:', error);
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
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        return JSON.parse(sessionUser);
    }
    
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
// UTILITÁRIOS
// ========================================
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
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
        userAgent: navigator.userAgent
    });
    
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
    toast.className = `message-toast ${type}`;
    
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
function openCreateAccountModal() {
    const modal = document.getElementById('createAccountModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCreateAccountModal() {
    const modal = document.getElementById('createAccountModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('createAccountForm')?.reset();
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
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', handleRegister);
    }
    
    const recoverForm = document.getElementById('recoverForm');
    if (recoverForm) {
        recoverForm.addEventListener('submit', handlePasswordRecovery);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCreateAccountModal();
            closeRecoverModal();
        }
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateAccountModal();
                closeRecoverModal();
            }
        });
    });
    
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

// Função de recuperação de senha (placeholder)
async function handlePasswordRecovery(event) {
    event.preventDefault();
    
    const email = document.getElementById('recoverEmail').value.trim();
    
    if (!validateEmail(email)) {
        showToast('E-mail inválido', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        showToast('Instruções enviadas para seu e-mail!', 'success');
        closeRecoverModal();
    } catch (error) {
        showToast('Erro ao processar solicitação', 'error');
    } finally {
        showLoading(false);
    }
}

// ========================================
// EXPOR FUNÇÕES GLOBAIS
// ========================================
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.openCreateAccountModal = openCreateAccountModal;
window.closeCreateAccountModal = closeCreateAccountModal;
window.openRecoverModal = openRecoverModal;
window.closeRecoverModal = closeRecoverModal;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.showToast = showToast;

console.log('✅ auth.js v2.0.0 carregado com sucesso');
