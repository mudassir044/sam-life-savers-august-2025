(function () {
  function setupSubmitTriggers(form) {
    const trigger = form.querySelector('.u-btn-submit');
    if (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        if (form.requestSubmit) {
          form.requestSubmit();
        } else {
          form.submit();
        }
      });
    }
  }

  function serializeForm(form) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach((value, key) => {
      if (payload[key] === undefined) {
        payload[key] = value;
      } else if (Array.isArray(payload[key])) {
        payload[key].push(value);
      } else {
        payload[key] = [payload[key], value];
      }
    });

    return payload;
  }

  async function handleSubmit(event) {
    if (event) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
    const form = event.target;
    const endpoint = form.dataset.endpoint;
    if (!endpoint) return;

    const statusEl = form.querySelector('.form-status');
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"], .u-btn-submit');
    const originalText = submitButton ? submitButton.textContent : null;

    if (statusEl) statusEl.textContent = 'Sending...';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-disabled', 'true');
      if (originalText) {
        submitButton.textContent = 'Sending...';
      }
    }

    try {
      const payload = serializeForm(form);
      Object.keys(payload).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          key === 'recaptchaResponse' ||
          key === 'formServices' ||
          lower.startsWith('g-recaptcha') ||
          lower.includes('recaptcha')
        ) {
          delete payload[key];
        }
      });
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      const isSuccess = response.ok && data.ok === true;
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('[forms] submission result', { endpoint, status: response.status, data });
      }

      if (isSuccess) {
        if (statusEl) statusEl.textContent = 'Thank you! Your submission has been received.';
        form.reset();
      } else {
        const errorMessage = data.error || 'Something went wrong. Please try again.';
        if (statusEl) statusEl.textContent = `Error: ${errorMessage}`;
      }
    } catch (error) {
      if (statusEl) statusEl.textContent = 'Something went wrong. Please try again.';
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-disabled');
        if (originalText) {
          submitButton.textContent = originalText;
        }
      }
    }
  }

  function initForms() {
    const forms = document.querySelectorAll('form[data-endpoint]');
    forms.forEach((form) => {
      setupSubmitTriggers(form);
      form.addEventListener('submit', handleSubmit);
      const statusEl = form.querySelector('.form-status');
      if (!statusEl) {
        const submitGroup = form.querySelector('.u-form-submit') || form;
        const status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('aria-live', 'polite');
        submitGroup.appendChild(status);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
