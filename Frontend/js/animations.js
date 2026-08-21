/* SISTEMA DE ANIMAÇÕES */

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initImageSlider();
});

// --- ANIMAÇÕES ---

function initAnimations() {
    const animations = localStorage.getItem(ARGUS_KEYS.ANIMATIONS);
    const glow = localStorage.getItem(ARGUS_KEYS.GLOW);

    applyAnimationPreferences(animations, glow);
}

// --- PREFERÊNCIAS DE ANIMAÇÃO E GLOW ---

function loadGlobalPreferences() {
    const animations = localStorage.getItem(ARGUS_KEYS.ANIMATIONS);
    const glow = localStorage.getItem(ARGUS_KEYS.GLOW);

    applyAnimationPreferences(animations, glow);
}

function applyAnimationPreferences(animations, glow) {
    if (animations === 'false') {
        document.body.classList.add('reduce-animations');
    } else {
        document.body.classList.remove('reduce-animations');
    }

    if (glow === 'false') {
        document.body.classList.add('reduce-glow');
    } else {
        document.body.classList.remove('reduce-glow');
    }
}

// --- SLIDER DE IMAGENS AUTOMÁTICO ---

function initImageSlider() {
    const slides = document.querySelectorAll('.slide');

    if (slides.length === 0) return;

    let currentSlide = 0;
    const slideInterval = 4000;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    setInterval(nextSlide, slideInterval);
}