document.addEventListener('DOMContentLoaded', () => {

    // 1. CONTROLADOR DO DROPDOWN DO PERFIL
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!profileDropdown.contains(event.target) && !profileBtn.contains(event.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }

    // 2. CONTROLADOR DO SLIDER DE IMAGENS AUTOMÁTICO
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    const slideInterval = 4000;

    function nextSlide() {
        if (slides.length === 0) return;

        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    if (slides.length > 0) {
        setInterval(nextSlide, slideInterval);
    }
});