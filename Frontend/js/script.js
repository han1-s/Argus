/* SISTEMA GLOBAL ARGUS */

const ARGUS_KEYS = {
    THEME: 'argusTheme',
    USER_NAME: 'argusUserName',
    USER_EMAIL: 'argusUserEmail',
    AVATAR: 'argusProfileImage',
    NOTIFS: 'argusNotifications',
    ANIMATIONS: 'argusAnimations',
    GLOW: 'argusEffects'
};

document.addEventListener('DOMContentLoaded', () => {
    // --- SISTEMA GLOBAL ---

    initArgusGlobal();

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

    // --- LÓGICA DE MONETIZAÇÃO E PLANOS ---

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

    // --- ACORDEÃO DE FAQ ---

    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;

            if (item) {
                item.classList.toggle('active');
            }
        });
    });

    // --- INTERAÇÃO DO BOTÃO DE DOWNLOAD ---

    const btnDownload = document.getElementById('btnDownload');

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const originalText = btnDownload.innerHTML;

            btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';
            btnDownload.style.pointerEvents = 'none';

            setTimeout(() => {
                btnDownload.innerHTML = '<i class="fa-solid fa-check"></i> Download iniciado!';
                btnDownload.style.background = '#10b981';
                btnDownload.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';

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

// --- SISTEMA GLOBAL ---

function initArgusGlobal() {
    loadGlobalTheme();
    updateGlobalProfile();
    loadGlobalPreferences();
}

// --- TEMA GLOBAL ---

function loadGlobalTheme() {
    const savedTheme = localStorage.getItem(ARGUS_KEYS.THEME) || 'dark';
    setGlobalTheme(savedTheme, false);
}

function setGlobalTheme(theme, save = true) {
    document.body.setAttribute('data-theme', theme);

    if (save) {
        localStorage.setItem(ARGUS_KEYS.THEME, theme);
    }
}

// --- PERFIL GLOBAL ---

function updateGlobalProfile() {
    const savedAvatar = localStorage.getItem(ARGUS_KEYS.AVATAR);
    const savedName = localStorage.getItem(ARGUS_KEYS.USER_NAME) || 'Alex Argus';

    const avatarElements = document.querySelectorAll('.global-user-avatar');
    const nameElements = document.querySelectorAll('.global-user-name');

    avatarElements.forEach(img => {
        img.src = savedAvatar || 'css/assets/img/user.png';
    });

    nameElements.forEach(element => {
        element.textContent = savedName;
    });
}

// --- PREFERÊNCIAS GLOBAIS ---

function loadGlobalPreferences() {
    const animations = localStorage.getItem(ARGUS_KEYS.ANIMATIONS);
    const glow = localStorage.getItem(ARGUS_KEYS.GLOW);

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

// --- SISTEMA DE TOAST ---

function showToast(message, icon = 'fa-circle-check') {
    const container = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');

    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function createToastContainer() {
    const container = document.createElement('div');

    container.id = 'toastContainer';
    container.className = 'toast-container';

    document.body.appendChild(container);

    return container;
}

// --- SINCRONIZAÇÃO ENTRE ABAS ---

window.addEventListener('storage', event => {
    if (!Object.values(ARGUS_KEYS).includes(event.key)) {
        return;
    }

    initArgusGlobal();

    if (event.key === ARGUS_KEYS.THEME) {
        const themeRadios = document.querySelectorAll('input[name="themeSelect"]');

        themeRadios.forEach(radio => {
            radio.checked = radio.value === (event.newValue || 'dark');
        });
    }
});

// --- LÓGICA DO CHECKOUT E MODAL ---

function openUpgradeModal(planName) {
    const modal = document.getElementById('checkoutModal');
    const modalPlanTitle = document.getElementById('modalPlanTitle');

    if (modalPlanTitle) {
        modalPlanTitle.textContent = planName;
    }

    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');

    if (modal) {
        modal.classList.remove('active');
    }
}

function switchTab(tabType) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panelPix = document.getElementById('panelPix');
    const panelCard = document.getElementById('panelCard');

    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    if (tabType === 'pix') {
        if (tabBtns[0]) {
            tabBtns[0].classList.add('active');
        }

        if (panelPix) {
            panelPix.classList.add('active');
        }

        if (panelCard) {
            panelCard.classList.remove('active');
        }
    } else {
        if (tabBtns[1]) {
            tabBtns[1].classList.add('active');
        }

        if (panelCard) {
            panelCard.classList.add('active');
        }

        if (panelPix) {
            panelPix.classList.remove('active');
        }
    }
}

function simularPagamento() {
    alert('🚀 Boa! Pagamento simulado com sucesso. O Argus já tá atualizado no seu perfil!');
    closeModal();
}