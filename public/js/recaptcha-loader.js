// Google reCAPTCHA Loader - v3 (Invisible)
(function() {
    'use strict';
    
    const RECAPTCHA_SITE_KEY = '6LdOXRksAAAAAKVO-YgTTGBhYbbj0CZwDU7TK_OA';
    
    // Load reCAPTCHA script
    function loadRecaptchaScript() {
        if (window.grecaptcha && window.grecaptcha.ready) {
            // Already loaded
            return;
        }
        
        // Check if script already exists
        if (document.querySelector('script[src*="recaptcha/api.js"]')) {
            // Script exists, wait for it to load
            if (window.grecaptcha && window.grecaptcha.ready) {
                return;
            }
            // Wait a bit and check again
            setTimeout(function() {
                if (window.grecaptcha && window.grecaptcha.ready) {
                    return;
                }
            }, 1000);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_SITE_KEY;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
    
    // Get reCAPTCHA token (v3 - invisible)
    window.getRecaptchaToken = function() {
        return new Promise((resolve, reject) => {
            if (!window.grecaptcha) {
                // Try to load it
                loadRecaptchaScript();
                // Wait a bit for it to load
                setTimeout(function() {
                    if (!window.grecaptcha) {
                        reject(new Error('reCAPTCHA not loaded. Please refresh the page.'));
                        return;
                    }
                    executeRecaptcha();
                }, 2000);
            } else {
                executeRecaptcha();
            }
            
            function executeRecaptcha() {
                if (window.grecaptcha.ready) {
                    window.grecaptcha.ready(function() {
                        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
                            .then(function(token) {
                                resolve(token);
                            })
                            .catch(function(error) {
                                reject(error);
                            });
                    });
                } else {
                    // Wait for ready
                    setTimeout(function() {
                        if (window.grecaptcha.ready) {
                            window.grecaptcha.ready(function() {
                                window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
                                    .then(function(token) {
                                        resolve(token);
                                    })
                                    .catch(function(error) {
                                        reject(error);
                                    });
                            });
                        } else {
                            reject(new Error('reCAPTCHA not ready'));
                        }
                    }, 1000);
                }
            }
        });
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadRecaptchaScript);
    } else {
        loadRecaptchaScript();
    }
})();

