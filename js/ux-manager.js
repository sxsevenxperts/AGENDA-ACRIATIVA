/**
 * UX Manager - Handles all UI/UX enhancements
 * Toasts, Loading States, Progress Indicators, Validations
 */

const UXManager = (function() {
  'use strict';

  // Configuration
  const config = {
    toastDuration: 3500,
    toastPosition: 'bottom-right',
    animationDuration: 300
  };

  // ============================================================
  // 1. TOAST NOTIFICATIONS
  // ============================================================

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - 'success' | 'error' | 'info' | 'warning'
   * @param {number} duration - Duration in ms (0 = no auto-close)
   */
  function showToast(message, type = 'info', duration = config.toastDuration) {
    const container = getOrCreateToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    toast.innerHTML = `
      <div class="toast-icon" aria-hidden="true">${icons[type] || 'ℹ'}</div>
      <div class="toast-message">${Utils.sanitizeHTML(message)}</div>
      <button class="toast-close" aria-label="Fechar notificação">×</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const closeToast = () => {
      toast.classList.add('toast-dismiss');
      setTimeout(() => toast.remove(), config.animationDuration);
    };

    closeBtn.addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }

    return closeToast;
  }

  function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  // ============================================================
  // 2. LOADING STATES
  // ============================================================

  /**
   * Show a loading spinner modal
   * @param {string} message - Loading message
   * @returns {function} Function to close the loader
   */
  function showLoading(message = 'Carregando...') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'loading-overlay';
    overlay.setAttribute('aria-busy', 'true');

    overlay.innerHTML = `
      <div class="loading-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 94.2" stroke-linecap="round"/>
        </svg>
        <div style="color: #64748B; font-size: 14px; text-align: center;">${Utils.sanitizeHTML(message)}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    return function hideLoading() {
      overlay.remove();
    };
  }

  /**
   * Add loading state to a button
   * @param {HTMLElement} button - Button element
   * @param {boolean} isLoading - Loading state
   */
  function setButtonLoading(button, isLoading = true) {
    if (!button) return;

    const originalText = button.textContent;
    const originalHTML = button.innerHTML;

    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      button.dataset.originalText = originalText;
      button.dataset.originalHTML = originalHTML;
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = button.dataset.originalText || originalText;
    }
  }

  /**
   * Show a skeleton loader placeholder
   * @param {HTMLElement} container - Container to insert skeleton
   * @param {number} count - Number of skeleton items
   * @returns {function} Function to remove skeleton
   */
  function showSkeleton(container, count = 3) {
    const skeletons = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-loader';
      skeleton.style.height = '20px';
      skeleton.style.marginBottom = '12px';
      skeleton.style.borderRadius = '8px';
      skeletons.appendChild(skeleton);
    }

    container.appendChild(skeletons);

    return function removeSkeleton() {
      container.querySelectorAll('.skeleton-loader').forEach(s => s.remove());
    };
  }

  // ============================================================
  // 3. FORM VALIDATION
  // ============================================================

  /**
   * Validate form inputs in real-time
   * @param {HTMLElement} form - Form element
   * @param {object} rules - Validation rules
   */
  function setupFormValidation(form, rules = {}) {
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      input.addEventListener('blur', () => validateInput(input, rules));
      input.addEventListener('input', () => validateInput(input, rules));
    });

    form.addEventListener('submit', (e) => {
      let isValid = true;
      inputs.forEach(input => {
        if (!validateInput(input, rules)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        showToast('Por favor, corrija os erros no formulário', 'error');
      }
    });
  }

  function validateInput(input, rules = {}) {
    const value = input.value.trim();
    const name = input.name || input.id;
    const rule = rules[name];

    // Clear previous error
    const errorEl = input.parentElement.querySelector('.form-error');
    if (errorEl) errorEl.remove();
    input.classList.remove('error', 'success');

    // Basic validation
    if (input.hasAttribute('required') && !value) {
      showInputError(input, 'Este campo é obrigatório');
      return false;
    }

    // Email validation
    if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showInputError(input, 'Email inválido');
      return false;
    }

    // Phone validation
    if (input.type === 'tel' && value && !/^[\d\s\-()]+$/.test(value)) {
      showInputError(input, 'Telefone inválido');
      return false;
    }

    // CPF validation
    if (name === 'cpf' && value && !validateCPF(value)) {
      showInputError(input, 'CPF inválido');
      return false;
    }

    // Password strength
    if (name === 'password' || name === 'senha') {
      if (value.length < 8) {
        showInputError(input, 'A senha deve ter no mínimo 8 caracteres');
        return false;
      }
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        showInputError(input, 'A senha deve conter letras maiúsculas e números');
        return false;
      }
    }

    // Custom rule
    if (rule && rule.validate && !rule.validate(value)) {
      showInputError(input, rule.message || 'Entrada inválida');
      return false;
    }

    // Success state
    if (value) {
      input.classList.add('success');
    }

    return true;
  }

  function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11), 10)) return false;

    return true;
  }

  function showInputError(input, message) {
    input.classList.add('error');
    const group = input.closest('.form-group') || input.parentElement;
    const error = document.createElement('div');
    error.className = 'form-error';
    error.innerHTML = `<span style="flex-shrink: 0;">⚠</span><span>${Utils.sanitizeHTML(message)}</span>`;
    group.appendChild(error);
  }

  // ============================================================
  // 4. PROGRESS INDICATORS
  // ============================================================

  /**
   * Create and show progress steps
   * @param {number} totalSteps - Total number of steps
   * @param {number} currentStep - Current step (1-indexed)
   * @param {array} labels - Step labels
   * @returns {HTMLElement} Progress container
   */
  function createProgressSteps(totalSteps, currentStep = 1, labels = []) {
    const container = document.createElement('div');
    container.className = 'progress-steps';

    for (let i = 1; i <= totalSteps; i++) {
      const step = document.createElement('div');
      step.className = 'progress-step';
      if (i < currentStep) step.classList.add('completed');
      if (i === currentStep) step.classList.add('active');

      step.innerHTML = `
        <div class="progress-step-circle">${i === currentStep && i > 1 ? '✓' : i}</div>
        <div class="progress-step-label">${labels[i - 1] || `Passo ${i}`}</div>
      `;

      container.appendChild(step);
    }

    return container;
  }

  /**
   * Update progress steps
   * @param {HTMLElement} container - Progress container
   * @param {number} currentStep - Current step
   */
  function updateProgressSteps(container, currentStep) {
    const steps = container.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index + 1 < currentStep) step.classList.add('completed');
      if (index + 1 === currentStep) step.classList.add('active');
    });
  }

  /**
   * Create a progress bar
   * @param {HTMLElement} container - Container element
   * @returns {object} Progress bar controller
   */
  function createProgressBar(container) {
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.innerHTML = '<div class="progress-bar-fill" style="width: 0%"></div>';
    container.appendChild(bar);

    return {
      update(percentage) {
        const fill = bar.querySelector('.progress-bar-fill');
        fill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
      },
      remove() {
        bar.remove();
      }
    };
  }

  // ============================================================
  // 5. BREADCRUMBS
  // ============================================================

  /**
   * Create breadcrumb navigation
   * @param {array} items - Breadcrumb items [{label, href?}]
   * @returns {HTMLElement} Breadcrumb element
   */
  function createBreadcrumbs(items = []) {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Navegação');

    items.forEach((item, index) => {
      if (index > 0) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.innerHTML = '›';
        sep.setAttribute('aria-hidden', 'true');
        nav.appendChild(sep);
      }

      if (index === items.length - 1) {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item active';
        span.textContent = item.label;
        nav.appendChild(span);
      } else {
        const link = document.createElement('a');
        link.className = 'breadcrumb-item';
        link.href = item.href || '#';
        link.textContent = item.label;
        nav.appendChild(link);
      }
    });

    return nav;
  }

  // ============================================================
  // 6. EMPTY STATES
  // ============================================================

  /**
   * Create an empty state UI
   * @param {object} config - Configuration
   * @returns {HTMLElement} Empty state element
   */
  function createEmptyState(config = {}) {
    const {
      icon = '📭',
      title = 'Nenhum item encontrado',
      description = 'Tente ajustar seus critérios de busca',
      actions = []
    } = config;

    const container = document.createElement('div');
    container.className = 'empty-state';

    container.innerHTML = `
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${Utils.sanitizeHTML(title)}</div>
      <div class="empty-state-desc">${Utils.sanitizeHTML(description)}</div>
    `;

    if (actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'empty-state-actions';

      actions.forEach(action => {
        const btn = document.createElement('a');
        btn.href = action.href || '#';
        btn.className = 'btn ' + (action.primary ? 'btn-primary' : 'btn-secondary');
        btn.textContent = action.label;
        btn.onclick = action.onClick || (() => {});
        actionsDiv.appendChild(btn);
      });

      container.appendChild(actionsDiv);
    }

    return container;
  }

  /**
   * Create an error state UI
   * @param {object} config - Configuration
   * @returns {HTMLElement} Error state element
   */
  function createErrorState(config = {}) {
    const {
      title = 'Erro ao carregar',
      message = 'Ocorreu um erro. Tente novamente mais tarde.',
      actions = []
    } = config;

    const container = document.createElement('div');
    container.className = 'error-state';

    container.innerHTML = `
      <div class="error-state-title">${Utils.sanitizeHTML(title)}</div>
      <div class="error-state-msg">${Utils.sanitizeHTML(message)}</div>
    `;

    if (actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'error-state-actions';

      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = action.primary ? 'error-state-btn error-state-btn-primary' : 'error-state-btn error-state-btn-secondary';
        btn.textContent = action.label;
        btn.onclick = action.onClick || (() => {});
        actionsDiv.appendChild(btn);
      });

      container.appendChild(actionsDiv);
    }

    return container;
  }

  // ============================================================
  // 7. ANIMATIONS
  // ============================================================

  /**
   * Add fade-in animation to element
   * @param {HTMLElement} element - Element to animate
   * @param {number} delay - Delay in ms
   */
  function fadeIn(element, delay = 0) {
    setTimeout(() => {
      element.classList.add('page-enter');
    }, delay);
  }

  /**
   * Animate element removal
   * @param {HTMLElement} element - Element to remove
   * @param {function} callback - Callback after animation
   */
  function fadeOut(element, callback) {
    element.classList.add('page-leave');
    setTimeout(() => {
      element.remove();
      if (callback) callback();
    }, 200);
  }

  // ============================================================
  // 8. DIALOGS & CONFIRMATIONS
  // ============================================================

  /**
   * Show a confirmation dialog
   * @param {object} config - Configuration
   * @returns {Promise<boolean>} User's choice
   */
  function showConfirm(config = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar ação',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        type = 'info' // 'info', 'warning', 'danger'
      } = config;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.style.zIndex = '1000';

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.maxWidth = '400px';

      const typeColors = {
        info: '#3B82F6',
        warning: '#F59E0B',
        danger: '#EF4444'
      };

      modal.innerHTML = `
        <div style="padding: 24px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 16px;">
            ${type === 'danger' ? '⚠️' : type === 'warning' ? '⚠️' : 'ℹ️'}
          </div>
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1E293B;">
            ${Utils.sanitizeHTML(title)}
          </h2>
          <p style="font-size: 14px; color: #64748B; margin-bottom: 24px;">
            ${Utils.sanitizeHTML(message)}
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" id="confirm-cancel">
              ${Utils.sanitizeHTML(cancelText)}
            </button>
            <button class="btn" style="background: ${typeColors[type]}; color: white;" id="confirm-ok">
              ${Utils.sanitizeHTML(confirmText)}
            </button>
          </div>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const btnOk = modal.querySelector('#confirm-ok');
      const btnCancel = modal.querySelector('#confirm-cancel');

      const close = () => {
        overlay.remove();
      };

      btnOk.addEventListener('click', () => {
        close();
        resolve(true);
      });

      btnCancel.addEventListener('click', () => {
        close();
        resolve(false);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
          resolve(false);
        }
      });

      btnOk.focus();
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    showToast,
    showLoading,
    setButtonLoading,
    showSkeleton,
    setupFormValidation,
    createProgressSteps,
    updateProgressSteps,
    createProgressBar,
    createBreadcrumbs,
    createEmptyState,
    createErrorState,
    fadeIn,
    fadeOut,
    showConfirm,
    validateCPF
  };
})();
