// Dynamic Gallery Loader
async function loadGallery() {
    try {
        const response = await fetch('/api/gallery/list');
        if (!response.ok) {
            console.error('Failed to load gallery');
            return;
        }
        
        const images = await response.json();
        const galleryContainer = document.querySelector('.u-gallery-inner-1');
        
        if (!galleryContainer) {
            console.error('Gallery container not found');
            return;
        }

        // Clear existing items (keep the structure)
        galleryContainer.innerHTML = '';

        // Add images to gallery
        images.forEach((image, index) => {
            const isActive = index === 0 ? 'u-active' : '';
            const itemNumber = index + 1;
            
            const galleryItem = document.createElement('div');
            galleryItem.className = `${isActive} u-carousel-item u-gallery-item u-carousel-item-${itemNumber}`;
            galleryItem.innerHTML = `
                <div class="u-back-slide" data-image-width="${image.width || 1920}" data-image-height="${image.height || 1080}">
                    <img class="u-back-image u-expanded" src="${image.image}" alt="${image.title}">
                </div>
                <div class="u-align-center u-over-slide u-valign-bottom u-over-slide-${itemNumber}">
                    <h3 class="u-gallery-heading">${image.title}</h3>
                    <p class="u-gallery-text">${image.description || ''}</p>
                </div>
            `;
            
            galleryContainer.appendChild(galleryItem);
        });

        // Reinitialize carousel if needed
        if (typeof jQuery !== 'undefined' && jQuery.fn.carousel) {
            jQuery('#carousel-1526').carousel('dispose').carousel();
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Load gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGallery);
} else {
    loadGallery();
}

