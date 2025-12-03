// Shared form handler for Resend integration
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Find all forms
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Determine API endpoint based on page/form
            const apiEndpoint = getApiEndpoint(form);
            if (!apiEndpoint) return; // Skip forms without matching endpoint

            // Override form submission
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitButton = form.querySelector('input[type="submit"], button[type="submit"], .u-btn-submit, a.u-btn-submit');
                const originalText = submitButton ? (submitButton.textContent || submitButton.value || 'Submit') : 'Submit';
                
                // Disable submit button
                if (submitButton) {
                    submitButton.disabled = true;
                    if (submitButton.textContent !== undefined) {
                        submitButton.textContent = 'Sending...';
                    } else if (submitButton.value !== undefined) {
                        submitButton.value = 'Sending...';
                    }
                }

                // Get or create status element
                let statusEl = form.querySelector('.form-status');
                if (!statusEl) {
                    statusEl = document.createElement('p');
                    statusEl.className = 'form-status';
                    statusEl.setAttribute('aria-live', 'polite');
                    statusEl.style.marginTop = '10px';
                    if (submitButton && submitButton.parentElement) {
                        submitButton.parentElement.appendChild(statusEl);
                    } else {
                        form.appendChild(statusEl);
                    }
                }
                statusEl.textContent = 'Sending...';
                statusEl.style.display = 'block';

                // Hide previous messages
                const successMsg = form.querySelector('.u-form-send-success');
                const errorMsg = form.querySelector('.u-form-send-error');
                if (successMsg) successMsg.style.display = 'none';
                if (errorMsg) errorMsg.style.display = 'none';

                try {
                    // Collect form data
                    const formData = new FormData(form);
                    const data = {};
                    
                    // Handle duplicate field names as arrays
                    for (const [key, value] of formData.entries()) {
                        if (key === 'company') continue; // Skip honeypot in display
                        if (data[key]) {
                            if (Array.isArray(data[key])) {
                                data[key].push(value);
                            } else {
                                data[key] = [data[key], value];
                            }
                        } else {
                            data[key] = value;
                        }
                    }

                    // POST JSON to API
                    const response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (result.ok) {
                        statusEl.textContent = 'Thank you! Your message has been sent.';
                        statusEl.style.color = 'green';
                        
                        // Show success message if exists
                        if (successMsg) {
                            successMsg.style.display = 'block';
                        }
                        
                        // Reset form
                        form.reset();
                    } else {
                        throw new Error(result.error || 'Submission failed');
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    
                    statusEl.textContent = 'Unable to send your message. Please try again.';
                    statusEl.style.color = 'red';
                    
                    // Show error message if exists
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                    }
                } finally {
                    // Re-enable submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                        if (submitButton.textContent !== undefined) {
                            submitButton.textContent = originalText;
                        } else if (submitButton.value !== undefined) {
                            submitButton.value = originalText;
                        }
                    }
                }
            });
        });
    }

    function getApiEndpoint(form) {
        const pagePath = window.location.pathname;
        const formName = form.getAttribute('name') || '';
        
        // Contact.html form
        if (pagePath.includes('Contact.html') || formName.includes('contact')) {
            return '/api/lead';
        }
        
        // Volunteer-Form.html
        if (pagePath.includes('Volunteer-Form.html') || formName.includes('volunteer')) {
            return '/api/volunteer';
        }
        
        // Newsletter on homepage
        if ((pagePath.includes('index.html') || pagePath === '/') && 
            (form.querySelector('input[name="email"]') && 
             !form.querySelector('input[name="name"]') && 
             !form.querySelector('textarea[name="message"]'))) {
            return '/api/newsletter';
        }
        
        return null;
    }
})();

