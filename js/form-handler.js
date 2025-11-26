// Form Handler - Intercepts all form submissions and sends to internal API
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Find all forms that use the external form service
        const forms = document.querySelectorAll('form[action*="forms.nicepagesrv.com"]');
        
        forms.forEach(form => {
            // Determine form type based on page or form name
            const formType = getFormType(form);
            
            // Override form submission
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitButton = form.querySelector('input[type="submit"], button[type="submit"], .u-btn-submit');
                const originalText = submitButton ? submitButton.textContent || submitButton.value : 'Submit';
                
                // Disable submit button
                if (submitButton) {
                    submitButton.disabled = true;
                    if (submitButton.textContent) {
                        submitButton.textContent = 'Submitting...';
                    } else {
                        submitButton.value = 'Submitting...';
                    }
                }

                // Hide previous messages
                const successMsg = form.querySelector('.u-form-send-success');
                const errorMsg = form.querySelector('.u-form-send-error');
                if (successMsg) successMsg.style.display = 'none';
                if (errorMsg) errorMsg.style.display = 'none';

                try {
                    // Get reCAPTCHA token first
                    let recaptchaToken = '';
                    try {
                        if (window.getRecaptchaToken) {
                            recaptchaToken = await window.getRecaptchaToken();
                        }
                    } catch (recaptchaError) {
                        console.warn('reCAPTCHA error:', recaptchaError);
                        // Continue without token if reCAPTCHA fails (for development)
                    }
                    
                    // Collect form data
                    const formData = {};
                    const formElements = form.querySelectorAll('input, textarea, select');
                    
                    formElements.forEach(element => {
                        if (element.type === 'submit' || element.type === 'hidden' && element.name === 'recaptchaResponse' || element.name === 'formServices') {
                            return; // Skip submit buttons and hidden service fields
                        }
                        
                        const name = element.name || element.id;
                        if (!name) return;
                        
                        if (element.type === 'checkbox' || element.type === 'radio') {
                            if (element.checked) {
                                if (formData[name]) {
                                    if (Array.isArray(formData[name])) {
                                        formData[name].push(element.value);
                                    } else {
                                        formData[name] = [formData[name], element.value];
                                    }
                                } else {
                                    formData[name] = element.value;
                                }
                            }
                        } else if (element.tagName === 'SELECT' && element.multiple) {
                            const selected = Array.from(element.selectedOptions).map(opt => opt.value);
                            if (selected.length > 0) {
                                formData[name] = selected;
                            }
                        } else {
                            formData[name] = element.value;
                        }
                    });

                    // Send to our API with reCAPTCHA token
                    const response = await fetch('/api/forms/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            formType: formType,
                            formData: formData,
                            recaptchaToken: recaptchaToken
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // Show success message
                        if (successMsg) {
                            successMsg.style.display = 'block';
                        } else {
                            alert('Thank you! Your message has been sent.');
                        }
                        
                        // Reset form
                        form.reset();
                    } else {
                        throw new Error(result.error || 'Submission failed');
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    
                    // Show error message
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                        errorMsg.textContent = 'Unable to send your message. Please try again later.';
                    } else {
                        alert('Unable to send your message. Please try again later.');
                    }
                } finally {
                    // Re-enable submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                        if (submitButton.textContent) {
                            submitButton.textContent = originalText;
                        } else {
                            submitButton.value = originalText;
                        }
                    }
                }
            });
        });
    }

    function getFormType(form) {
        // Determine form type based on page URL or form attributes
        const pagePath = window.location.pathname;
        const formName = form.getAttribute('name') || '';
        
        if (pagePath.includes('Contact.html') || formName.includes('contact')) {
            return 'contact';
        } else if (pagePath.includes('Volunteer-Form.html') || formName.includes('volunteer')) {
            return 'volunteer';
        } else if (pagePath.includes('Hope-In-Action.html')) {
            return 'hope-in-action';
        } else if (pagePath.includes('index.html') || pagePath === '/') {
            // Check if it's a newsletter or donation form
            const formId = form.id || '';
            if (formId.includes('newsletter') || formName.includes('newsletter')) {
                return 'newsletter';
            }
            return 'home';
        }
        
        return 'general';
    }
})();

