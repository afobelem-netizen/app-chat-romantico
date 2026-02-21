// ========================================
// CONFIGURAÇÕES DO JSONBIN.IO
// ========================================
const CONFIG = {
    // Suas credenciais do JSONBin.io
    API_KEY: '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i',
    BIN_ID: '6999bfbbae596e708f3cfdfb',
    BASE_URL: 'https://api.jsonbin.io/v3',
    
    // Configurações do App
    APP_NAME: 'LoveChat',
    VERSION: '1.0.0',
    
    // Limites
    MAX_MESSAGE_LENGTH: 1000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    
    // Cores
    COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#4caf50',
        danger: '#f44336',
        warning: '#ff9800'
    }
};

// Headers padrão para API
const API_HEADERS = {
    'Content-Type': 'application/json',
    'X-Master-Key': CONFIG.API_KEY
};
