document.addEventListener('DOMContentLoaded', () => {

    // --- DROPDOWN DO PERFIL ---
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

    // --- SLIDER DE IMAGENS AUTOMÁTICO ---
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

    // --- LÓGICA DE MONETIZAÇÃO E PLANOS ---

    // Toggle Mensal / Anual
    const pricingToggle = document.getElementById('pricingToggle');
    const pricePro = document.getElementById('pricePro');
    const priceBusiness = document.getElementById('priceBusiness');
    const periodPro = document.getElementById('periodPro');
    const periodBusiness = document.getElementById('periodBusiness');
    const labelMonthly = document.getElementById('labelMonthly');
    const labelAnnual = document.getElementById('labelAnnual');

    let isAnnual = false;

    if (pricingToggle) {
        pricingToggle.addEventListener('click', () => {
            isAnnual = !isAnnual;
            pricingToggle.classList.toggle('active', isAnnual);
            
            if (labelMonthly && labelAnnual) {
                labelMonthly.classList.toggle('active', !isAnnual);
                labelAnnual.classList.toggle('active', isAnnual);
            }

            if (isAnnual) {
                // Desconto no plano anual
                if (pricePro) pricePro.textContent = '39';
                if (priceBusiness) priceBusiness.textContent = '119';
                if (periodPro) periodPro.textContent = '/mês (anual)';
                if (periodBusiness) periodBusiness.textContent = '/mês (anual)';
            } else {
                if (pricePro) pricePro.textContent = '49';
                if (priceBusiness) priceBusiness.textContent = '149';
                if (periodPro) periodPro.textContent = '/mês';
                if (periodBusiness) periodBusiness.textContent = '/mês';
            }
        });
    }

    // Acordeão de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            item.classList.toggle('active');
        });
    });

    // --- INTERAÇÃO DO BOTÃO DE DOWNLOAD ---
    const btnDownload = document.getElementById('btnDownload');

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const originalText = btnDownload.innerHTML;

            // Animação ao clicar
            btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';
            btnDownload.style.pointerEvents = 'none';

            setTimeout(() => {
                // Sucesso no clique
                btnDownload.innerHTML = '<i class="fa-solid fa-check"></i> Download iniciado!';
                btnDownload.style.background = '#10b981';
                btnDownload.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';

                // Reseta tudo depois de 3s
                setTimeout(() => {
                    btnDownload.innerHTML = originalText;
                    btnDownload.style.background = '';
                    btnDownload.style.boxShadow = '';
                    btnDownload.style.pointerEvents = 'auto';
                }, 3000);
            }, 1000);
        });
    }
});

// --- LÓGICA DO CHECKOUT E MODAL ---
function openUpgradeModal(planName) {
    const modal = document.getElementById('checkoutModal');
    const modalPlanTitle = document.getElementById('modalPlanTitle');
    if (modalPlanTitle) modalPlanTitle.textContent = planName;
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('active');
}

function switchTab(tabType) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panelPix = document.getElementById('panelPix');
    const panelCard = document.getElementById('panelCard');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tabType === 'pix') {
        if (tabBtns[0]) tabBtns[0].classList.add('active');
        if (panelPix) panelPix.classList.add('active');
        if (panelCard) panelCard.classList.remove('active');
    } else {
        if (tabBtns[1]) tabBtns[1].classList.add('active');
        if (panelCard) panelCard.classList.add('active');
        if (panelPix) panelPix.classList.remove('active');
    }
}

function simularPagamento() {
    alert('🚀 Boa! Pagamento simulado com sucesso. O Argus já tá atualizado no seu perfil!');
    closeModal();
}