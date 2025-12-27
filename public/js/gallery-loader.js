// Disable dynamic gallery override; rely on static HTML ordering.
function loadGallery() {
    console.log('Gallery loader disabled; using static gallery order.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGallery);
} else {
    loadGallery();
}
