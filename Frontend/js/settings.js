/* CONFIGURAÇÕES DO ARGUS */

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.settings-page-wrapper')) {
        initSettingsPage();
    }
});

// --- PÁGINA DE CONFIGURAÇÕES ---

function initSettingsPage() {
    initSettingsNavigation();
    initAccountSettings();
    initAvatarSettings();
    initThemeSettings();
    initAnimationSettings();
    initGlowSettings();
    initResetSettings();
}

// --- NAVEGAÇÃO POR ABAS ---

function initSettingsNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${targetTab}`);

            if (!targetContent) return;

            navItems.forEach(btn => {
                btn.classList.remove('active');
            });

            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });

            button.classList.add('active');
            targetContent.classList.add('active');
        });
    });
}

// --- DADOS DA CONTA ---

function initAccountSettings() {
    const nameInput = document.getElementById('userNameInput');
    const emailInput = document.getElementById('userEmailInput');

    if (nameInput) {
        nameInput.value = localStorage.getItem(ARGUS_KEYS.USER_NAME) || 'Alex Argus';
    }

    if (emailInput) {
        emailInput.value = localStorage.getItem(ARGUS_KEYS.USER_EMAIL) || 'alex@argus.io';
    }

    const formAccount = document.getElementById('formAccountInfo');

    if (formAccount) {
        formAccount.addEventListener('submit', event => {
            event.preventDefault();

            if (nameInput) {
                localStorage.setItem(ARGUS_KEYS.USER_NAME, nameInput.value.trim() || 'Alex Argus');
            }

            if (emailInput) {
                localStorage.setItem(ARGUS_KEYS.USER_EMAIL, emailInput.value.trim() || 'alex@argus.io');
            }

            updateGlobalProfile();
            showToast('Informações da conta salvas com sucesso!');
        });
    }
}

// --- FOTO DE PERFIL ---

function initAvatarSettings() {
    const avatarInput = document.getElementById('avatarInput');
    const btnUpload = document.getElementById('btnUploadAvatar');
    const btnRemove = document.getElementById('btnRemoveAvatar');

    if (btnUpload && avatarInput) {
        btnUpload.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', event => {
            const file = event.target.files[0];

            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Selecione um arquivo de imagem válido.', 'fa-triangle-exclamation');
                avatarInput.value = '';
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                showToast('A imagem deve ter no máximo 2 MB.', 'fa-triangle-exclamation');
                avatarInput.value = '';
                return;
            }

            const reader = new FileReader();

            reader.onload = event => {
                const base64Img = event.target.result;

                localStorage.setItem(ARGUS_KEYS.AVATAR, base64Img);

                updateGlobalProfile();

                showToast('Foto de perfil atualizada!');
            };

            reader.readAsDataURL(file);
        });
    }

    if (btnRemove) {
        btnRemove.addEventListener('click', () => {
            localStorage.removeItem(ARGUS_KEYS.AVATAR);

            updateGlobalProfile();

            if (avatarInput) {
                avatarInput.value = '';
            }

            showToast('Foto de perfil removida.', 'fa-trash');
        });
    }
}

// --- SELEÇÃO DE TEMA ---

function initThemeSettings() {
    const themeRadios = document.querySelectorAll('input[name="themeSelect"]');
    const themeCards = document.querySelectorAll('.theme-card-option');
    const currentTheme = localStorage.getItem(ARGUS_KEYS.THEME) || 'dark';

    themeRadios.forEach(radio => {
        if (radio.value === currentTheme) {
            radio.checked = true;

            const card = radio.closest('.theme-card-option');

            if (card) {
                card.classList.add('active');
            }
        }

        radio.addEventListener('change', event => {
            const selectedTheme = event.target.value;

            themeCards.forEach(card => {
                card.classList.remove('active');
            });

            const selectedCard = event.target.closest('.theme-card-option');

            if (selectedCard) {
                selectedCard.classList.add('active');
            }

            setGlobalTheme(selectedTheme);

            showToast(`Tema ${selectedTheme.toUpperCase()} aplicado!`, 'fa-palette');
        });
    });
}

// --- ANIMAÇÕES ---

function initAnimationSettings() {
    const toggleAnim = document.getElementById('toggleAnimations');

    if (toggleAnim) {
        toggleAnim.checked = localStorage.getItem(ARGUS_KEYS.ANIMATIONS) !== 'false';

        toggleAnim.addEventListener('change', event => {
            localStorage.setItem(ARGUS_KEYS.ANIMATIONS, event.target.checked);

            loadGlobalPreferences();

            showToast('Preferências de animação atualizadas.');
        });
    }
}

// --- EFEITO GLOW ---

function initGlowSettings() {
    const toggleGlow = document.getElementById('toggleGlow');

    if (toggleGlow) {
        toggleGlow.checked = localStorage.getItem(ARGUS_KEYS.GLOW) !== 'false';

        toggleGlow.addEventListener('change', event => {
            localStorage.setItem(ARGUS_KEYS.GLOW, event.target.checked);

            loadGlobalPreferences();

            showToast('Preferências de brilho atualizadas.');
        });
    }
}

// --- EXCLUSÃO / RESTAURAÇÃO DE DADOS ---

function initResetSettings() {
    const modalOverlay = document.getElementById('customModalOverlay');
    const btnDeleteModal = document.getElementById('btnDeleteAccountModal');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const btnModalConfirm = document.getElementById('btnModalConfirm');

    if (btnDeleteModal && modalOverlay) {
        btnDeleteModal.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    }

    if (btnModalCancel && modalOverlay) {
        btnModalCancel.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }

    if (btnModalConfirm && modalOverlay) {
        btnModalConfirm.addEventListener('click', () => {
            Object.values(ARGUS_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });

            modalOverlay.classList.remove('active');

            initArgusGlobal();

            const nameInput = document.getElementById('userNameInput');
            const emailInput = document.getElementById('userEmailInput');
            const themeRadios = document.querySelectorAll('input[name="themeSelect"]');
            const themeCards = document.querySelectorAll('.theme-card-option');
            const toggleAnim = document.getElementById('toggleAnimations');
            const toggleGlow = document.getElementById('toggleGlow');

            if (nameInput) {
                nameInput.value = 'Alex Argus';
            }

            if (emailInput) {
                emailInput.value = 'alex@argus.io';
            }

            themeRadios.forEach(radio => {
                radio.checked = radio.value === 'dark';
            });

            themeCards.forEach(card => {
                card.classList.remove('active');
            });

            const darkThemeCard = document.querySelector('input[name="themeSelect"][value="dark"]');

            if (darkThemeCard) {
                const card = darkThemeCard.closest('.theme-card-option');

                if (card) {
                    card.classList.add('active');
                }
            }

            if (toggleAnim) {
                toggleAnim.checked = true;
            }

            if (toggleGlow) {
                toggleGlow.checked = true;
            }

            showToast(
                'Dados locais restaurados aos padrões de fábrica.',
                'fa-triangle-exclamation'
            );
        });
    }
}