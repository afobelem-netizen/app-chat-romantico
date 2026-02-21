/**
 * LoveChat - Arquivo de Configuração
 * Versão: 1.0.0
 * Descrição: Configurações globais, constantes e utilitários de ambiente
 */

// ========================================
// CONFIGURAÇÕES DO AMBIENTE
// ========================================
const ENV = {
    // Ambiente atual: 'development', 'production', 'testing'
    current: 'development',
    
    // URLs da aplicação
    urls: {
        development: {
            api: 'http://localhost:3000',
            frontend: 'http://localhost:5500',
            websocket: 'ws://localhost:3000'
        },
        testing: {
            api: 'https://test-api.jsonbin.io/v3',
            frontend: 'https://test.lovechat.app',
            websocket: 'wss://test.lovechat.app'
        },
        production: {
            api: 'https://api.jsonbin.io/v3',
            frontend: 'https://lovechat.app',
            websocket: 'wss://lovechat.app'
        }
    },
    
    // Features habilitadas por ambiente
    features: {
        development: {
            debug: true,
            mockData: true,
            verboseLogs: true,
            hotReload: true
        },
        testing: {
            debug: true,
            mockData: false,
            verboseLogs: true,
            hotReload: false
        },
        production: {
            debug: false,
            mockData: false,
            verboseLogs: false,
            hotReload: false
        }
    }
};

// ========================================
// CONFIGURAÇÕES DO JSONBIN.IO
// ========================================
const JSONBIN_CONFIG = {
    // API Keys (substitua pelos seus valores)
    apiKey: '$2a$10$sChh0QX9hJpZnYvHxh7ZQO3X9pZnYvHxh7ZQO3X9pZnYvHxh7ZQO', // EXEMPLO - Substitua pela sua
    masterKey: '$2a$10$sChh0QX9hJpZnYvHxh7ZQO3X9pZnYvHxh7ZQO3X9pZnYvHxh7ZQO', // EXEMPLO - Substitua pela sua
    
    // IDs dos bins (criados automaticamente na primeira execução)
    bins: {
        users: null,      // ID do bin de usuários
        messages: null,   // ID do bin de mensagens
        scores: null,     // ID do bin de pontuações
        config: null      // ID do bin de configurações
    },
    
    // URLs da API
    baseUrl: 'https://api.jsonbin.io/v3',
    endpoints: {
        create: '/b',
        get: '/b/{binId}',
        update: '/b/{binId}',
        delete: '/b/{binId}',
        version: '/b/{binId}/versions'
    },
    
    // Headers padrão
    headers: {
        'Content-Type': 'application/json',
        'X-Bin-Meta': false
    },
    
    // Configurações de rate limiting
    rateLimit: {
        maxRequestsPerMinute: 20,
        retryAfter: 60000 // 1 minuto
    }
};

// ========================================
// CONFIGURAÇÕES DO BANCO DE DADOS LOCAL
// ========================================
const DATABASE_CONFIG = {
    // Nomes das coleções no localStorage
    collections: {
        users: 'lovechat_users',
        messages: 'lovechat_messages',
        scores: 'lovechat_scores',
        activities: 'lovechat_activities',
        sessions: 'lovechat_sessions',
        settings: 'lovechat_settings'
    },
    
    // Estrutura inicial do banco
    initialData: {
        users: [
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
                    tema: 'light',
                    idioma: 'pt-BR'
                },
                estatisticas: {
                    mensagensEnviadas: 0,
                    pontosRecebidos: 0,
                    diasConsecutivos: 0
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
                    tema: 'light',
                    idioma: 'pt-BR'
                },
                estatisticas: {
                    mensagensEnviadas: 0,
                    pontosRecebidos: 0,
                    diasConsecutivos: 0
                }
            }
        ],
        messages: [],
        scores: [],
        activities: [],
        settings: {
            appName: 'LoveChat',
            version: '1.0.0',
            lastBackup: null,
            maintenanceMode: false
        }
    },
    
    // Opções de backup
    backup: {
        autoBackup: true,
        interval: 24 * 60 * 60 * 1000, // 24 horas
        maxBackups: 5
    }
};

// ========================================
// CONFIGURAÇÕES DO APLICATIVO
// ========================================
const APP_CONFIG = {
    // Informações gerais
    name: 'LoveChat',
    version: '1.0.0',
    description: 'Chat romântico com sistema de pontuação',
    author: 'LoveChat Team',
    
    // URLs
    website: 'https://lovechat.app',
    repository: 'https://github.com/lovechat/app',
    docs: 'https://docs.lovechat.app',
    
    // Features habilitadas
    features: {
        enableChat: true,
        enableScoring: true,
        enableMediaSharing: true,
        enableRanking: true,
        enableNotifications: true,
        enableDarkMode: true,
        enableOfflineMode: true,
        enableVoiceMessages: true,
        enableVideoCalls: false, // Futura implementação
        enableStickers: true
    },
    
    // Limites e restrições
    limits: {
        maxMessageLength: 1000,
        maxMessagesPerDay: 100,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxImageSize: 5 * 1024 * 1024, // 5MB
        maxVideoSize: 10 * 1024 * 1024, // 10MB
        maxAudioSize: 5 * 1024 * 1024, // 5MB
        maxStickers: 50,
        maxContacts: 10,
        messageHistoryDays: 30,
        sessionTimeout: 30 * 60 * 1000 // 30 minutos
    },
    
    // Intervalos de tempo
    intervals: {
        messagePolling: 3000, // 3 segundos
        heartbeat: 30000, // 30 segundos
        typingTimeout: 3000, // 3 segundos
        notificationTimeout: 5000, // 5 segundos
        sessionCheck: 60000 // 1 minuto
    },
    
    // Temas disponíveis
    themes: {
        light: {
            primary: '#667eea',
            secondary: '#764ba2',
            background: '#ffffff',
            text: '#333333',
            accent: '#ff4b6e'
        },
        dark: {
            primary: '#818cf8',
            secondary: '#9f7aea',
            background: '#1a202c',
            text: '#f7fafc',
            accent: '#fc8181'
        },
        romantic: {
            primary: '#ff6b6b',
            secondary: '#ff8e8e',
            background: '#fff0f0',
            text: '#4a5568',
            accent: '#ffd700'
        }
    },
    
    // Idiomas suportados
    languages: {
        'pt-BR': 'Português (Brasil)',
        'en-US': 'English (US)',
        'es-ES': 'Español'
    }
};

// ========================================
// CONFIGURAÇÕES DE MÍDIA
// ========================================
const MEDIA_CONFIG = {
    // Tipos de arquivo permitidos
    allowedTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
    },
    
    // Qualidade de compressão
    compression: {
        image: {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8
        },
        video: {
            maxSize: 10 * 1024 * 1024,
            codec: 'h264'
        },
        audio: {
            bitrate: 128000,
            sampleRate: 44100
        }
    },
    
    // Configurações de câmera
    camera: {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }
    },
    
    // Configurações de gravação de áudio
    recording: {
        maxDuration: 120000, // 2 minutos
        sampleRate: 44100,
        channelCount: 1,
        mimeType: 'audio/webm'
    },
    
    // Emojis e stickers
    emojis: {
        categories: ['❤️', '😊', '🎁', '🌟', '💕', '😘', '🥰', '💋'],
        recent: []
    }
};

// ========================================
// CONFIGURAÇÕES DE PONTUAÇÃO
// ========================================
const SCORING_CONFIG = {
    // Tipos de pontuação
    types: {
        presente: {
            name: 'Presente',
            icon: '🎁',
            color: '#4caf50'
        },
        penalidade: {
            name: 'Penalidade',
            icon: '⚠️',
            color: '#f44336'
        },
        especial: {
            name: 'Especial',
            icon: '🌟',
            color: '#ff9800'
        }
    },
    
    // Valores padrão
    values: {
        presente: {
            1: '😊 Carinho',
            5: '❤️ Amor',
            10: '👑 Especial'
        },
        penalidade: {
            1: '😞 Esquecimento',
            3: '😠 Atraso',
            5: '💀 Falha grave'
        }
    },
    
    // Níveis e conquistas
    levels: [
        { score: 0, title: 'Início do Amor', icon: '🌱' },
        { score: 100, title: 'Namorando', icon: '💕' },
        { score: 500, title: 'Comprometidos', icon: '💑' },
        { score: 1000, title: 'Almas Gêmeas', icon: '💞' },
        { score: 5000, title: 'Eternos', icon: '♾️' }
    ],
    
    // Conquistas especiais
    achievements: {
        firstMessage: {
            name: 'Primeira Mensagem',
            points: 10,
            icon: '💬'
        },
        firstPhoto: {
            name: 'Primeira Foto',
            points: 20,
            icon: '📸'
        },
        firstAudio: {
            name: 'Primeiro Áudio',
            points: 15,
            icon: '🎵'
        },
        weekStreak: {
            name: 'Uma Semana Juntos',
            points: 50,
            icon: '📅'
        },
        monthStreak: {
            name: 'Um Mês de Amor',
            points: 200,
            icon: '🎉'
        }
    }
};

// ========================================
// CONFIGURAÇÕES DE NOTIFICAÇÃO
// ========================================
const NOTIFICATION_CONFIG = {
    // Tipos de notificação
    types: {
        message: {
            icon: '💬',
            sound: 'message.mp3',
            duration: 5000
        },
        score: {
            icon: '⭐',
            sound: 'score.mp3',
            duration: 4000
        },
        system: {
            icon: '🔔',
            sound: 'system.mp3',
            duration: 3000
        }
    },
    
    // Sons disponíveis
    sounds: {
        message: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        score: 'https://www.soundjay.com/misc/sounds/chime-1.mp3',
        system: 'https://www.soundjay.com/misc/sounds/button-2.mp3',
        typing: 'https://www.soundjay.com/misc/sounds/keyboard-1.mp3'
    },
    
    // Configurações do navegador
    browser: {
        enabled: true,
        requireInteraction: false,
        silent: false
    }
};

// ========================================
// MENSAGENS DO SISTEMA
// ========================================
const MESSAGES = {
    pt: {
        // Mensagens de sucesso
        success: {
            login: 'Login realizado com sucesso!',
            register: 'Conta criada com sucesso!',
            logout: 'Até logo!',
            messageSent: 'Mensagem enviada',
            pointsAdded: 'Pontos adicionados!',
            profileUpdated: 'Perfil atualizado!'
        },
        
        // Mensagens de erro
        error: {
            login: 'E-mail ou senha incorretos',
            register: 'Erro ao criar conta',
            network: 'Erro de conexão',
            fileTooBig: 'Arquivo muito grande',
            invalidFile: 'Tipo de arquivo não suportado',
            sessionExpired: 'Sessão expirada'
        },
        
        // Mensagens de aviso
        warning: {
            offline: 'Você está offline',
            typing: 'Digitando...',
            unsaved: 'Alterações não salvas'
        },
        
        // Confirmações
        confirm: {
            logout: 'Deseja realmente sair?',
            deleteMessage: 'Excluir mensagem?',
            clearChat: 'Limpar conversa?'
        }
    },
    
    en: {
        success: {
            login: 'Login successful!',
            register: 'Account created!',
            logout: 'Goodbye!',
            messageSent: 'Message sent',
            pointsAdded: 'Points added!',
            profileUpdated: 'Profile updated!'
        },
        error: {
            login: 'Invalid email or password',
            register: 'Error creating account',
            network: 'Connection error',
            fileTooBig: 'File too large',
            invalidFile: 'File type not supported',
            sessionExpired: 'Session expired'
        },
        warning: {
            offline: 'You are offline',
            typing: 'Typing...',
            unsaved: 'Unsaved changes'
        },
        confirm: {
            logout: 'Are you sure you want to logout?',
            deleteMessage: 'Delete message?',
            clearChat: 'Clear conversation?'
        }
    }
};

// ========================================
// CONFIGURAÇÕES DE DEBUG
// ========================================
const DEBUG_CONFIG = {
    enabled: ENV.current === 'development',
    verbose: true,
    
    // Log levels
    levels: {
        info: true,
        warn: true,
        error: true,
        debug: ENV.current === 'development'
    },
    
    // Opções de logging
    logging: {
        maxLogEntries: 100,
        saveToLocal: ENV.current === 'development',
        showTimestamp: true,
        showCaller: true
    },
    
    // Simulações para teste
    mock: {
        enabled: ENV.current === 'development',
        delay: 500, // ms
        errorRate: 0.1 // 10% de chance de erro
    }
};

// ========================================
// CONFIGURAÇÕES DE SEGURANÇA
// ========================================
const SECURITY_CONFIG = {
    // Configurações de senha
    password: {
        minLength: 6,
        requireNumbers: false,
        requireSpecialChars: false,
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutos
    },
    
    // Configurações de sessão
    session: {
        timeout: 30 * 60 * 1000, // 30 minutos
        refreshThreshold: 5 * 60 * 1000, // 5 minutos
        maxConcurrent: 2
    },
    
    // Headers de segurança
    headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    },
    
    // Sanitização
    sanitize: {
        stripHtml: true,
        allowedTags: [],
        maxLength: 1000
    }
};

// ========================================
// UTILITÁRIOS DE CONFIGURAÇÃO
// ========================================
const ConfigUtils = {
    // Obter URL base da API
    getApiUrl() {
        return ENV.urls[ENV.current].api;
    },
    
    // Obter URL do frontend
    getFrontendUrl() {
        return ENV.urls[ENV.current].frontend;
    },
    
    // Verificar se uma feature está habilitada
    isFeatureEnabled(feature) {
        return APP_CONFIG.features[feature] && 
               ENV.features[ENV.current][feature] !== false;
    },
    
    // Obter configuração atual
    getCurrentConfig() {
        return {
            env: ENV.current,
            app: APP_CONFIG,
            features: this.getEnabledFeatures(),
            limits: APP_CONFIG.limits
        };
    },
    
    // Listar features habilitadas
    getEnabledFeatures() {
        return Object.keys(APP_CONFIG.features)
            .filter(feature => APP_CONFIG.features[feature]);
    },
    
    // Validar limite
    checkLimit(limit, value) {
        const max = APP_CONFIG.limits[limit];
        return max ? value <= max : true;
    },
    
    // Formatar tamanho de arquivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Obter mensagem traduzida
    getMessage(key, type = 'success', lang = 'pt') {
        return MESSAGES[lang]?.[type]?.[key] || key;
    },
    
    // Carregar configurações salvas
    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('lovechat_config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
        return null;
    },
    
    // Salvar configurações
    saveConfig(config) {
        try {
            localStorage.setItem('lovechat_config', JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    },
    
    // Resetar para configurações padrão
    resetToDefault() {
        localStorage.removeItem('lovechat_config');
        window.location.reload();
    },
    
    // Verificar ambiente
    isDevelopment() {
        return ENV.current === 'development';
    },
    
    isProduction() {
        return ENV.current === 'production';
    },
    
    isTesting() {
        return ENV.current === 'testing';
    }
};

// ========================================
// INICIALIZAÇÃO DAS CONFIGURAÇÕES
// ========================================
function initializeConfig() {
    console.log('⚙️ Inicializando configurações...');
    
    // Detectar ambiente automaticamente
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        ENV.current = 'development';
    } else if (window.location.hostname.includes('test.')) {
        ENV.current = 'testing';
    } else {
        ENV.current = 'production';
    }
    
    console.log(`🌍 Ambiente: ${ENV.current}`);
    
    // Carregar configurações salvas
    const savedConfig = ConfigUtils.loadSavedConfig();
    if (savedConfig) {
        Object.assign(APP_CONFIG, savedConfig);
        console.log('📦 Configurações carregadas');
    }
    
    // Configurar JSONBin.io com IDs salvos
    loadBinIds();
    
    // Configurar tema inicial
    initializeTheme();
    
    console.log('✅ Configurações inicializadas');
}

function loadBinIds() {
    try {
        const saved = localStorage.getItem('jsonbin_ids');
        if (saved) {
            const ids = JSON.parse(saved);
            JSONBIN_CONFIG.bins = ids;
            console.log('📦 IDs dos bins carregados');
        }
    } catch (error) {
        console.error('Erro ao carregar IDs dos bins:', error);
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('lovechat_theme');
    if (savedTheme && APP_CONFIG.themes[savedTheme]) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// ========================================
// EXPORTAÇÕES
// ========================================
const CONFIG = {
    ENV,
    JSONBIN_CONFIG,
    DATABASE_CONFIG,
    APP_CONFIG,
    MEDIA_CONFIG,
    SCORING_CONFIG,
    NOTIFICATION_CONFIG,
    MESSAGES,
    DEBUG_CONFIG,
    SECURITY_CONFIG,
    utils: ConfigUtils
};

// Tornar disponível globalmente
window.LoveChatConfig = CONFIG;
window.ConfigUtils = ConfigUtils;

// ========================================
// INICIALIZAÇÃO
// ========================================
initializeConfig();

// ========================================
// EXPORTAÇÃO PARA MÓDULOS
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

console.log('✅ config.js carregado com sucesso');
console.log('📊 Versão:', APP_CONFIG.version);
console.log('🚀 Features:', ConfigUtils.getEnabledFeatures().join(', '));
