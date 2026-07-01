/**
 * ============================================================
 * AGENDA SOBRAL - Módulo de Utilitários
 * ============================================================
 * Funções auxiliares globais para formatação, validação,
 * geração de IDs, manipulação de datas e notificações.
 * 
 * Todas as funções ficam acessíveis via o objeto global `Utils`.
 * ============================================================
 */

const Utils = (() => {
    'use strict';

    // ── Dias e meses em português ────────────────────────────

    /** @type {string[]} Nomes completos dos dias da semana */
    const DIAS_SEMANA = [
        'Domingo', 'Segunda-feira', 'Terça-feira',
        'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    /** @type {string[]} Abreviações dos dias da semana */
    const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    /** @type {string[]} Nomes completos dos meses */
    const MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // ══════════════════════════════════════════════════════════
    //  FORMATAÇÃO DE DATAS E HORAS
    // ══════════════════════════════════════════════════════════

    /**
     * Formata uma data no padrão brasileiro DD/MM/YYYY.
     * @param {Date|string} date - Objeto Date ou string de data
     * @returns {string} Data formatada (ex: '30/06/2026')
     */
    function formatDate(date) {
        const d = date instanceof Date ? date : new Date(date + 'T00:00:00');
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    /**
     * Formata uma data no padrão ISO YYYY-MM-DD.
     * @param {Date|string} date - Objeto Date ou string de data
     * @returns {string} Data formatada (ex: '2026-06-30')
     */
    function formatDateISO(date) {
        const d = date instanceof Date ? date : new Date(date + 'T00:00:00');
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        return `${ano}-${mes}-${dia}`;
    }

    /**
     * Formata um horário no padrão HH:MM.
     * Remove segundos caso presentes.
     * @param {string} time - String de horário (ex: '08:30:00' ou '08:30')
     * @returns {string} Horário formatado (ex: '08:30')
     */
    function formatTime(time) {
        if (!time) return '';
        return time.substring(0, 5);
    }

    /**
     * Combina data e horário em uma string formatada.
     * @param {Date|string} date - Data a formatar
     * @param {string} time - Horário a incluir
     * @returns {string} Formato combinado (ex: '30/06/2026 às 08:30')
     */
    function formatDateTime(date, time) {
        return `${formatDate(date)} às ${formatTime(time)}`;
    }

    // ══════════════════════════════════════════════════════════
    //  FORMATAÇÃO E VALIDAÇÃO DE CPF
    // ══════════════════════════════════════════════════════════

    /**
     * Formata um CPF com pontos e traço.
     * @param {string} cpf - CPF apenas com dígitos ou parcialmente formatado
     * @returns {string} CPF formatado (ex: '123.456.789-00')
     */
    function formatCPF(cpf) {
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11) return cpf;
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Valida um CPF usando o algoritmo oficial de verificação de dígitos.
     * Verifica:
     *  - Se possui 11 dígitos
     *  - Se não são todos dígitos iguais
     *  - Se os dois dígitos verificadores estão corretos
     * 
     * @param {string} cpf - CPF a validar (com ou sem formatação)
     * @returns {boolean} true se o CPF é válido
     */
    function validateCPF(cpf) {
        const digits = cpf.replace(/\D/g, '');

        // Deve ter exatamente 11 dígitos
        if (digits.length !== 11) return false;

        // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
        if (/^(\d)\1{10}$/.test(digits)) return false;

        // Cálculo do primeiro dígito verificador
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(digits.charAt(i)) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;
        if (resto !== parseInt(digits.charAt(9))) return false;

        // Cálculo do segundo dígito verificador
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(digits.charAt(i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;
        if (resto !== parseInt(digits.charAt(10))) return false;

        return true;
    }

    // ══════════════════════════════════════════════════════════
    //  VALIDAÇÃO E FORMATAÇÃO DE CONTATO
    // ══════════════════════════════════════════════════════════

    /**
     * Valida o formato de um e-mail.
     * @param {string} email - E-mail a validar
     * @returns {boolean} true se o formato é válido
     */
    function validateEmail(email) {
        if (!email) return false;
        const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email.trim());
    }

    /**
     * Valida o formato de um telefone brasileiro.
     * Aceita formatos: (88) 99999-9999, 88999999999, etc.
     * Deve ter 10 ou 11 dígitos.
     * @param {string} phone - Telefone a validar
     * @returns {boolean} true se o formato é válido
     */
    function validatePhone(phone) {
        if (!phone) return false;
        const digits = phone.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 11;
    }

    /**
     * Formata um telefone no padrão (88) 99999-9999.
     * @param {string} phone - Telefone com apenas dígitos ou parcialmente formatado
     * @returns {string} Telefone formatado
     */
    function formatPhone(phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }

    // ══════════════════════════════════════════════════════════
    //  GERAÇÃO DE IDS E SENHAS
    // ══════════════════════════════════════════════════════════

    /**
     * Gera um identificador único baseado em timestamp e valor aleatório.
     * Formato: timestamp em base 36 + parte aleatória em base 36.
     * @returns {string} ID único (ex: 'lx8k2f4a_r7m3p')
     */
    function generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `${timestamp}_${random}`;
    }

    /**
     * Gera uma senha de atendimento no formato 'SIGLA-NNN'.
     * @param {string} sigla - Sigla do equipamento ou serviço (ex: 'SMS')
     * @param {number} sequencial - Número sequencial do atendimento
     * @returns {string} Senha formatada (ex: 'SMS-001')
     */
    function generateSenha(sigla, sequencial) {
        const numero = String(sequencial).padStart(3, '0');
        return `${sigla.toUpperCase()}-${numero}`;
    }

    // ══════════════════════════════════════════════════════════
    //  GERAÇÃO DE QR CODE SVG
    // ══════════════════════════════════════════════════════════

    /**
     * Gera uma representação visual SVG semelhante a um QR Code.
     * Usa um padrão de grade determinístico baseado no hash do texto.
     * Inclui moldura de posição nos cantos como um QR Code real.
     * 
     * @param {string} text - Texto para gerar o padrão visual
     * @param {number} [size=200] - Tamanho do SVG em pixels
     * @returns {string} String SVG completa
     */
    function generateQRCodeSVG(text, size = 200) {
        const gridSize = 21; // Tamanho da grade (como QR Code versão 1)
        const cellSize = size / gridSize;
        const hash = hashString(text);

        // Inicializa a grade
        const grid = Array.from({ length: gridSize }, () =>
            Array(gridSize).fill(false)
        );

        // Desenha os padrões de posição (finder patterns) nos 3 cantos
        const drawFinderPattern = (startRow, startCol) => {
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    // Borda externa, espaço interno, e célula central
                    const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
                    const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    grid[startRow + r][startCol + c] = isBorder || isInner;
                }
            }
        };

        drawFinderPattern(0, 0);                         // Superior esquerdo
        drawFinderPattern(0, gridSize - 7);              // Superior direito
        drawFinderPattern(gridSize - 7, 0);              // Inferior esquerdo

        // Preenche o restante da grade com padrão baseado no hash
        let hashValue = Math.abs(hash);
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Pula as áreas dos finder patterns + separadores
                const inTopLeft = r < 8 && c < 8;
                const inTopRight = r < 8 && c >= gridSize - 8;
                const inBottomLeft = r >= gridSize - 8 && c < 8;

                if (inTopLeft || inTopRight || inBottomLeft) continue;

                // Gera valor determinístico para cada célula
                hashValue = ((hashValue * 1103515245 + 12345) & 0x7fffffff);
                grid[r][c] = (hashValue % 3) !== 0; // ~66% de preenchimento
            }
        }

        // Constrói o SVG
        let rects = '';
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c]) {
                    const x = (c * cellSize).toFixed(2);
                    const y = (r * cellSize).toFixed(2);
                    const w = cellSize.toFixed(2);
                    rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#1a1a2e"/>`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="#ffffff" rx="4"/>
            ${rects}
        </svg>`;
    }

    // ══════════════════════════════════════════════════════════
    //  FUNÇÕES DE DATA E CALENDÁRIO
    // ══════════════════════════════════════════════════════════

    /**
     * Retorna o nome completo do dia da semana em português.
     * @param {number} dayIndex - Índice do dia (0 = Domingo, 6 = Sábado)
     * @returns {string} Nome do dia (ex: 'Segunda-feira')
     */
    function getDayName(dayIndex) {
        return DIAS_SEMANA[dayIndex] || '';
    }

    /**
     * Retorna o nome completo do mês em português.
     * @param {number} monthIndex - Índice do mês (0 = Janeiro, 11 = Dezembro)
     * @returns {string} Nome do mês (ex: 'Janeiro')
     */
    function getMonthName(monthIndex) {
        return MESES[monthIndex] || '';
    }

    /**
     * Retorna array com as abreviações dos dias da semana em PT-BR.
     * @returns {string[]} Array de abreviações ['Dom', 'Seg', ..., 'Sáb']
     */
    function getWeekDays() {
        return [...DIAS_SEMANA_ABREV];
    }

    /**
     * Verifica se uma data é dia útil (segunda a sexta).
     * @param {Date|string} date - Data a verificar
     * @returns {boolean} true se for dia útil
     */
    function isWeekday(date) {
        const d = date instanceof Date ? date : new Date(date + 'T00:00:00');
        const day = d.getDay();
        return day >= 1 && day <= 5;
    }

    /**
     * Verifica se uma data é feriado consultando a lista em SobralData.config.
     * @param {string} dateStr - Data no formato 'YYYY-MM-DD'
     * @returns {boolean} true se a data for um feriado cadastrado
     */
    function isFeriado(dateStr) {
        if (typeof SobralData === 'undefined' ||
            !SobralData.config ||
            !SobralData.config.feriados) {
            return false;
        }
        return SobralData.config.feriados.includes(dateStr);
    }

    /**
     * Adiciona dias a uma data.
     * @param {Date|string} date - Data base
     * @param {number} days - Número de dias a adicionar (pode ser negativo)
     * @returns {Date} Nova data com os dias adicionados
     */
    function addDays(date, days) {
        const d = date instanceof Date ? new Date(date) : new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d;
    }

    // ══════════════════════════════════════════════════════════
    //  MANIPULAÇÃO DE HORÁRIOS
    // ══════════════════════════════════════════════════════════

    /**
     * Converte uma string de horário 'HH:MM' para total de minutos.
     * @param {string} timeStr - Horário no formato 'HH:MM'
     * @returns {number} Total de minutos desde 00:00
     */
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Converte total de minutos para string no formato 'HH:MM'.
     * @param {number} minutes - Total de minutos desde 00:00
     * @returns {string} Horário formatado (ex: '14:30')
     */
    function minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    /**
     * Gera um array de slots de horário entre início e fim.
     * O último slot é o maior valor onde slot + intervalo <= endTime.
     * 
     * @param {string} startTime - Horário inicial (ex: '08:00')
     * @param {string} endTime - Horário final (ex: '14:00')
     * @param {number} [intervalMinutes=30] - Intervalo entre slots em minutos
     * @returns {string[]} Array de horários (ex: ['08:00', '08:30', ...])
     */
    function generateTimeSlots(startTime, endTime, intervalMinutes = 30) {
        const slots = [];
        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);

        for (let current = start; current < end; current += intervalMinutes) {
            slots.push(minutesToTime(current));
        }

        return slots;
    }

    // ══════════════════════════════════════════════════════════
    //  UTILITÁRIOS GERAIS
    // ══════════════════════════════════════════════════════════

    /**
     * Cria uma versão debounced de uma função.
     * A função original só é executada após `delay` ms sem novas chamadas.
     * 
     * @param {Function} fn - Função a ser "debounced"
     * @param {number} [delay=300] - Tempo de espera em milissegundos
     * @returns {Function} Função com debounce aplicado
     */
    function debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Exibe uma notificação toast na tela.
     * O toast é criado dinamicamente no DOM e removido automaticamente
     * após 4 segundos com animação de saída.
     * 
     * @param {string} message - Mensagem a exibir
     * @param {('success'|'error'|'info')} [type='info'] - Tipo visual do toast
     */
    function showToast(message, type = 'info') {
        // Garante que o container de toasts existe
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // Cores e ícones por tipo
        const themes = {
            success: {
                bg: 'linear-gradient(135deg, #059669, #10b981)',
                icon: '✓',
                border: '#34d399'
            },
            error: {
                bg: 'linear-gradient(135deg, #dc2626, #ef4444)',
                icon: '✕',
                border: '#f87171'
            },
            info: {
                bg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                icon: 'ℹ',
                border: '#60a5fa'
            }
        };

        const theme = themes[type] || themes.info;

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            background: ${theme.bg};
            color: #ffffff;
            padding: 14px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border-left: 4px solid ${theme.border};
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            max-width: 400px;
            word-wrap: break-word;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        `;

        toast.innerHTML = `
            <span style="
                font-size: 18px;
                font-weight: 700;
                min-width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
            ">${theme.icon}</span>
            <span>${sanitizeHTML(message)}</span>
        `;

        container.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Remoção automática após 4 segundos
        const removeToast = () => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        };

        // Click para fechar manualmente
        toast.addEventListener('click', removeToast);

        // Auto-remover após 4s
        setTimeout(removeToast, 4000);
    }

    /**
     * Sanitiza uma string HTML para prevenir ataques XSS.
     * Converte caracteres especiais em entidades HTML.
     * 
     * @param {string} str - String a sanitizar
     * @returns {string} String segura para inserção no DOM
     */
    function sanitizeHTML(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;'
        };
        return String(str).replace(/[&<>"'/]/g, (char) => map[char]);
    }

    /**
     * Retorna o SVG de um ícone cadastrado em SobralData.icones.
     * @param {string} name - Nome do ícone
     * @returns {string} String HTML do SVG, ou string vazia se não encontrado
     */
    function getIcon(name) {
        if (typeof SobralData === 'undefined' || !SobralData.icones) return '';
        return SobralData.icones[name] || '';
    }

    /**
     * Função de hash simples para gerar valores determinísticos a partir de strings.
     * Implementa o algoritmo djb2.
     * 
     * @param {string} str - String para gerar o hash
     * @returns {number} Valor hash numérico (inteiro de 32 bits)
     */
    function hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Converte para inteiro de 32 bits
        }
        return hash;
    }

    // ══════════════════════════════════════════════════════════
    //  API PÚBLICA
    // ══════════════════════════════════════════════════════════

    return {
        // Formatação de datas e horas
        formatDate,
        formatDateISO,
        formatTime,
        formatDateTime,

        // CPF
        formatCPF,
        validateCPF,

        // Contato
        validateEmail,
        validatePhone,
        formatPhone,

        // Geração de IDs e senhas
        generateId,
        generateSenha,
        generateQRCodeSVG,

        // Calendário e datas
        getDayName,
        getMonthName,
        getWeekDays,
        isWeekday,
        isFeriado,
        addDays,

        // Horários
        timeToMinutes,
        minutesToTime,
        generateTimeSlots,

        // Utilitários gerais
        debounce,
        showToast,
        sanitizeHTML,
        getIcon,
        hashString
    };
})();
