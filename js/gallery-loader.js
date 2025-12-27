// Dynamic Gallery Loader
async function loadGallery() {
    // Skip network fetch on file:// to avoid CORS errors; reorder static gallery instead.
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        console.warn('Gallery loader skipped on file://; reordering static gallery.');
        reorderStaticGallery();
        return;
    }

    try {
        const response = await fetch('/api/gallery/list');
        if (!response.ok) {
            console.error('Failed to load gallery:', response.status, response.statusText);
            return;
        }
        
        const images = await response.json();
        console.log('Gallery loaded:', images.length, 'images');

        const galleryContainer = document.querySelector('.u-gallery-inner-1');

        if (!galleryContainer) {
            console.error('Gallery container not found');
            return;
        }

        // Clear existing items (keep the structure)
        galleryContainer.innerHTML = '';

        // Add images to gallery (newest first by id)
        if (!images || images.length === 0) {
            console.log('No images in gallery');
            return;
        }

        const sorted = images
            .slice()
            .sort((a, b) => {
                const idA = typeof a.id === 'number' ? a.id : 0;
                const idB = typeof b.id === 'number' ? b.id : 0;
                return idB - idA;
            });

        sorted.forEach((image, index) => {
            const isActive = index === 0 ? 'u-active' : '';
            const itemNumber = index + 1;
            
            // Handle both relative paths and full URLs (Vercel Blob URLs)
            let imageSrc = image.image;
            if (imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('/')) {
                imageSrc = '/' + imageSrc;
            }
            
            const galleryItem = document.createElement('div');
            galleryItem.className = `${isActive} u-carousel-item u-gallery-item u-carousel-item-${itemNumber}`;
            galleryItem.innerHTML = `
                <div class="u-back-slide" data-image-width="${image.width || 1920}" data-image-height="${image.height || 1080}">
                    <img class="u-back-image u-expanded" src="${imageSrc}" alt="${image.title || 'Gallery image'}" onerror="console.error('Failed to load image:', '${imageSrc}')">
                </div>
                <div class="u-align-center u-over-slide u-valign-bottom u-over-slide-${itemNumber}">
                    <h3 class="u-gallery-heading">${image.title || 'Untitled'}</h3>
                    <p class="u-gallery-text">${image.description || ''}</p>
                </div>
            `;
            
            galleryContainer.appendChild(galleryItem);
        });

        // Reorder static thumbnails/slides to keep newest-first and sync order
        reorderStaticGallery();

        // Reinitialize carousel if needed
        if (typeof jQuery !== 'undefined' && jQuery.fn.carousel) {
            jQuery('#carousel-1526').carousel('dispose').carousel();
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Reorder existing gallery (slides + thumbnails) newest-first using filename priority
function reorderStaticGallery() {
    const galleryContainer = document.querySelector('.u-gallery-inner-1');
    const thumbnailList = document.querySelector('ol.u-carousel-thumbnails');
    if (!galleryContainer) return;

    const priorityNames = [
        'images/volunteers-needed-poster-samlifesavers.jpg',
        'images/team-picture-sam-life-savers-acp-project-team.jpeg',
        'images/muniba-sam-life-savers-picture-acp-project.jpeg',
        'images/sam-life-savers-acp-project-with-orphan-kids.jpeg',
        'images/mudassir-sam-life-savers-acp-event.jpeg',
        'images/fatima-birthday-orphan-project-celebrations-samlifesavers.jpeg',
        'images/welcome-of-kids-acp-event.jpeg',
        'images/shavez-welcome-kid-acp-event.jpeg',
        'images/samlifesavers-dast-e-khidmat-event-awards.jpeg',
        'images/samlifesavers-team-photo-with-kids-dast-e-shafqat.jpeg',
        'images/shavez-photo-dast-e-shafqat-event.jpeg',
        'images/mudassir-giving-kid-gift-dast-e-shafqat-event.jpeg',
        'images/ability-fiesta-banner-photo.jpeg',
        'images/ability-fiesta-kids-fun-photo.jpeg',
        'images/ability-fiesta-special-kids-playing-photo-.jpeg',
        'images/fatima-birthday-event-heatbox-samlifesavers-2025-acp-project.jpeg',
        'images/dast-e-khidmat-samlifesavers-team-pic.jpeg',
        'images/dast-e-khidmat-samlifesavers-old-age.jpeg'
    ];
    const priorityMap = new Map(priorityNames.map((name, idx) => [name, idx]));

    const normalizeSrc = (src) => {
        try {
            const url = new URL(src, window.location.href);
            return url.pathname.replace(/^\//, '');
        } catch {
            return (src || '').replace(/^\//, '');
        }
    };

    const orderIndex = (key, fallbackIndex) => {
        const match = priorityMap.get(key);
        return match !== undefined ? match : priorityNames.length + fallbackIndex;
    };

    const items = Array.from(galleryContainer.querySelectorAll('.u-carousel-item'));
    const orderedItems = items
        .map((node, idx) => {
            const img = node.querySelector('img');
            const key = normalizeSrc(img ? img.getAttribute('src') : '');
            return { node, key, idx };
        })
        .sort((a, b) => orderIndex(a.key, a.idx) - orderIndex(b.key, b.idx))
        .map((entry) => entry.node);

    // Reset active classes, renumber, and re-append in new order
    orderedItems.forEach((node, idx) => {
        const newNum = idx + 1;
        node.classList.remove('u-active');
        node.className = node.className.replace(/u-carousel-item-\d+/g, '').trim();
        node.classList.add(`u-carousel-item-${newNum}`);
        const overSlide = node.querySelector('[class*="u-over-slide-"]');
        if (overSlide) {
            overSlide.className = overSlide.className.replace(/u-over-slide-\d+/g, '').trim();
            overSlide.classList.add(`u-over-slide-${newNum}`);
        }
        galleryContainer.appendChild(node);
        if (idx === 0) {
            node.classList.add('u-active');
        }
    });

    if (thumbnailList) {
        const thumbs = Array.from(thumbnailList.querySelectorAll('li.u-carousel-thumbnail'));
        const orderedThumbs = thumbs
            .map((node, idx) => {
                const img = node.querySelector('img');
                const key = normalizeSrc(img ? img.getAttribute('src') : '');
                return { node, key, idx };
            })
            .sort((a, b) => orderIndex(a.key, a.idx) - orderIndex(b.key, b.idx))
            .map((entry) => entry.node);

        orderedThumbs.forEach((node, idx) => {
            const newNum = idx + 1;
            node.dataset.uSlideTo = String(idx);
            node.classList.remove('u-active');
            node.className = node.className.replace(/u-carousel-thumbnail-\d+/g, '').trim();
            node.classList.add(`u-carousel-thumbnail-${newNum}`);
            thumbnailList.appendChild(node);
            if (idx === 0) {
                node.classList.add('u-active');
            }
        });
    }
}

// Load gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGallery);
} else {
    loadGallery();
}
