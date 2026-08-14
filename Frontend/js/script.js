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
/* =========================================================
   LÓGICA DE MONETIZAÇÃO, PLANOS E CHECKOUT
   ========================================================= */

// 1. Toggle Mensal / Anual
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
      // 20% de desconto no plano Anual
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

// 2. Acordeão de FAQ
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const item = question.parentElement;
    item.classList.toggle('active');
  });
});

// 3. Modais & Abas de Pagamento
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
    tabBtns[0].classList.add('active');
    panelPix.classList.add('active');
    panelCard.classList.remove('active');
  } else {
    tabBtns[1].classList.add('active');
    panelCard.classList.add('active');
    panelPix.classList.remove('active');
  }
}

function simularPagamento() {
  alert('🚀 Simulação de pagamento concluída com sucesso! Seu plano Argus será atualizado.');
  closeModal();
}
// ==========================================
// INTERAÇÃO DO BOTÃO DE DOWNLOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnDownload = document.getElementById('btnDownload');

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const originalText = btnDownload.innerHTML;

      // Estado de carregamento
      btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';
      btnDownload.style.pointerEvents = 'none';

      setTimeout(() => {
        // Feedback de sucesso
        btnDownload.innerHTML = '<i class="fa-solid fa-check"></i> Download iniciado!';
        btnDownload.style.background = '#10b981';
        btnDownload.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';

        // Restaura após 3 segundos
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