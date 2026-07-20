/**
 * UX Improvements Integration
 * Integrates UXManager and other enhancements into the existing app
 */

(function() {
  'use strict';

  // Ensure UXManager is available
  if (typeof UXManager === 'undefined') {
    console.warn('UXManager not loaded');
    return;
  }

  // ============================================================
  // 1. FORM ENHANCEMENTS
  // ============================================================

  /**
   * Setup validation for all form inputs
   */
  function setupFormValidation() {
    const formElement = document.getElementById('dynamic-form-element');
    if (!formElement) return;

    // Setup real-time validation
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateFormInput(input));
      input.addEventListener('change', () => validateFormInput(input));
    });
  }

  function validateFormInput(input) {
    const group = input.closest('.form-group');
    if (!group) return;

    // Remove previous error
    const existingError = group.querySelector('.form-error');
    if (existingError) existingError.remove();

    const value = input.value.trim();
    const required = input.hasAttribute('required');
    const type = input.type || input.tagName.toLowerCase();

    let isValid = true;
    let errorMsg = '';

    // Required field validation
    if (required && !value) {
      isValid = false;
      errorMsg = 'Este campo é obrigatório';
    }
    // Email validation
    else if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      isValid = false;
      errorMsg = 'Email inválido';
    }
    // Phone validation
    else if (type === 'tel' && value && !/^[\d\s\-()]+$/.test(value)) {
      isValid = false;
      errorMsg = 'Telefone inválido';
    }
    // CPF validation
    else if ((input.name === 'cpf' || input.id === 'q2') && value) {
      if (!UXManager.validateCPF(value)) {
        isValid = false;
        errorMsg = 'CPF inválido';
      }
    }

    // Update input styling
    if (isValid && value) {
      input.classList.remove('error');
      input.classList.add('success');
    } else if (!isValid) {
      input.classList.remove('success');
      input.classList.add('error');

      // Show error message
      if (errorMsg) {
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.innerHTML = `<span style="flex-shrink: 0;">⚠</span><span>${errorMsg}</span>`;
        group.appendChild(errorEl);
      }
    } else {
      input.classList.remove('error', 'success');
    }

    return isValid;
  }

  /**
   * Setup progress tracking for multi-step forms
   */
  function setupProgressTracking() {
    const updateProgress = function() {
      const currentStep = window.currentStep || 1;
      const totalSteps = 3;

      // Update stepper in UI
      const steps = document.querySelectorAll('.stepper-step');
      steps.forEach((step, index) => {
        step.classList.remove('active', 'done');
        if (index + 1 < currentStep) step.classList.add('done');
        if (index + 1 === currentStep) step.classList.add('active');
      });

      // Animate progress bar
      const progress = (currentStep / totalSteps) * 100;
      const progressBar = document.querySelector('.progress-bar-fill');
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }
    };

    // Hook into existing step changes
    const originalNextStep = window.nextStep;
    window.nextStep = function() {
      if (originalNextStep) originalNextStep.call(this);
      updateProgress();
    };

    const originalPrevStep = window.prevStep;
    window.prevStep = function() {
      if (originalPrevStep) originalPrevStep.call(this);
      updateProgress();
    };

    const originalShowStep = window.showStep;
    window.showStep = function(step) {
      if (originalShowStep) originalShowStep.call(this, step);
      updateProgress();
    };
  }

  // ============================================================
  // 2. LOADING STATES
  // ============================================================

  /**
   * Show loading state for async operations
   */
  function setupLoadingStates() {
    const originalSubmitForm = window.submitForm;
    window.submitForm = function() {
      const btn = document.getElementById('btn-submit');
      if (btn) {
        UXManager.setButtonLoading(btn, true);

        // Simulate async operation
        setTimeout(() => {
          UXManager.setButtonLoading(btn, false);
          if (originalSubmitForm) originalSubmitForm.call(this);
        }, 300);
      } else if (originalSubmitForm) {
        originalSubmitForm.call(this);
      }
    };
  }

  // ============================================================
  // 3. CONFIRMATION & NOTIFICATIONS
  // ============================================================

  /**
   * Show confirmation before destructive actions
   */
  function setupConfirmations() {
    document.addEventListener('click', async (e) => {
      // Confirm before deleting
      if (e.target.classList.contains('delete-btn') ||
          e.target.closest('.delete-btn')) {
        e.preventDefault();

        const confirmed = await UXManager.showConfirm({
          title: 'Confirmar Exclusão',
          message: 'Tem certeza que deseja excluir este item?',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
          type: 'danger'
        });

        if (confirmed) {
          // Execute deletion
          const btn = e.target.closest('.delete-btn');
          if (btn && btn.onclick) btn.onclick();
        }
      }

      // Confirm before canceling appointment
      if (e.target.classList.contains('cancel-appointment-btn')) {
        e.preventDefault();

        const confirmed = await UXManager.showConfirm({
          title: 'Cancelar Agendamento',
          message: 'Tem certeza que deseja cancelar este agendamento?',
          confirmText: 'Sim, cancelar',
          cancelText: 'Manter agendamento',
          type: 'warning'
        });

        if (confirmed) {
          UXManager.showToast('Agendamento cancelado com sucesso', 'success');
        }
      }
    });
  }

  /**
   * Show success/error toasts for operations
   */
  function setupNotifications() {
    window.showNotification = function(message, type = 'info', duration = 3500) {
      UXManager.showToast(message, type, duration);
    };

    window.showSuccess = function(message) {
      UXManager.showToast(message, 'success');
    };

    window.showError = function(message) {
      UXManager.showToast(message, 'error');
    };

    window.showWarning = function(message) {
      UXManager.showToast(message, 'warning');
    };
  }

  // ============================================================
  // 4. ACCESSIBILITY IMPROVEMENTS
  // ============================================================

  /**
   * Enhance keyboard navigation
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC to close modals
      if (e.key === 'Escape') {
        const overlay = document.querySelector('.form-overlay.active');
        if (overlay && overlay.id !== 'form-dynamic') {
          overlay.classList.remove('active');
        }
      }

      // Tab to navigate form fields
      if (e.key === 'Tab') {
        const active = document.activeElement;
        if (active && active.tagName === 'BUTTON') {
          // Ensure focus is visible
          active.focus();
        }
      }
    });
  }

  /**
   * Add ARIA labels and roles
   */
  function setupAccessibility() {
    // Mark required fields
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
      const label = input.closest('.form-group')?.querySelector('label');
      if (label && !label.textContent.includes('*')) {
        const span = document.createElement('span');
        span.className = 'required';
        span.textContent = ' *';
        span.setAttribute('aria-label', 'obrigatório');
        label.appendChild(span);
      }
    });

    // Add role attributes
    document.querySelectorAll('.form-container').forEach(container => {
      container.setAttribute('role', 'main');
    });

    document.querySelectorAll('.section-title').forEach(title => {
      title.setAttribute('role', 'region');
      const h2 = title.querySelector('h2');
      if (h2) h2.setAttribute('aria-level', '2');
    });
  }

  // ============================================================
  // 5. MOBILE OPTIMIZATIONS
  // ============================================================

  /**
   * Optimize for mobile devices
   */
  function setupMobileOptimizations() {
    // Prevent zoom on input focus
    document.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('focus', () => {
        // Mobile viewport adjustments
        if (window.innerWidth < 768) {
          setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      });
    });

    // Improve touch targets (min 44x44px)
    document.querySelectorAll('button, a.btn, .dept-btn').forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        btn.style.minWidth = '44px';
        btn.style.minHeight = '44px';
        btn.style.padding = 'max(8px, calc((44px - 1em) / 2)) max(12px, calc((44px - 1em) / 2))';
      }
    });
  }

  // ============================================================
  // 6. EMPTY/ERROR STATES
  // ============================================================

  /**
   * Show empty states for lists
   */
  window.showEmptyState = function(container, config) {
    if (!container) return;
    const emptyState = UXManager.createEmptyState(config);
    container.innerHTML = '';
    container.appendChild(emptyState);
  };

  /**
   * Show error states
   */
  window.showErrorState = function(container, config) {
    if (!container) return;
    const errorState = UXManager.createErrorState(config);
    container.innerHTML = '';
    container.appendChild(errorState);
  };

  // ============================================================
  // 7. ANIMATIONS
  // ============================================================

  /**
   * Animate page transitions
   */
  function setupPageAnimations() {
    const originalCloseForm = window.closeForm;
    window.closeForm = function(formId) {
      const form = document.getElementById(formId || 'form-dynamic');
      if (form) {
        UXManager.fadeOut(form, () => {
          form.classList.remove('active');
          document.body.style.overflow = '';
        });
      } else if (originalCloseForm) {
        originalCloseForm.call(this, formId);
      }
    };

    // Animate cards on load
    const cards = document.querySelectorAll('.dept-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        UXManager.fadeIn(card, index * 50);
      }, 0);
    });
  }

  // ============================================================
  // 8. BREADCRUMBS
  // ============================================================

  /**
   * Setup breadcrumb navigation
   */
  window.setupBreadcrumbs = function(items) {
    const container = document.querySelector('[data-breadcrumb]');
    if (!container) return;

    const breadcrumbs = UXManager.createBreadcrumbs(items);
    container.innerHTML = '';
    container.appendChild(breadcrumbs);
  };

  // ============================================================
  // 9. INITIALIZATION
  // ============================================================

  /**
   * Initialize all UX improvements
   */
  function init() {
    setupFormValidation();
    setupProgressTracking();
    setupLoadingStates();
    setupConfirmations();
    setupNotifications();
    setupKeyboardNavigation();
    setupAccessibility();
    setupMobileOptimizations();
    setupPageAnimations();

    // Log initialization
    console.log('✓ UX Improvements initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-setup when forms are opened
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('dept-card') ||
        e.target.closest('.dept-card')) {
      setTimeout(() => {
        setupFormValidation();
        setupAccessibility();
      }, 100);
    }
  });
})();
