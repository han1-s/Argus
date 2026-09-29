const keyInput = document.querySelector('#key');
const portInput = document.querySelector('#port');
const confirmInput = document.querySelector('#confirm');
const toggleButton = document.querySelector('#toggle');
const status = document.querySelector('#status');

async function refresh() {
  const settings = await chrome.storage.local.get({ bridgeKey: '', bridgePort: 43172, enabled: false, confirmed: false });
  keyInput.value = settings.bridgeKey; portInput.value = settings.bridgePort; confirmInput.checked = settings.confirmed;
  toggleButton.textContent = settings.enabled ? 'Desativar coleta web' : 'Ativar coleta web';
  toggleButton.classList.toggle('off', settings.enabled);
  status.textContent = settings.enabled ? 'Coleta autorizada e ativa' : 'Coleta desativada'; status.classList.toggle('active', settings.enabled);
}
keyInput.addEventListener('change', () => chrome.storage.local.set({ bridgeKey: keyInput.value.trim() }));
portInput.addEventListener('change', () => chrome.storage.local.set({ bridgePort: Number(portInput.value) || 43172 }));
confirmInput.addEventListener('change', () => chrome.storage.local.set({ confirmed: confirmInput.checked }));
toggleButton.addEventListener('click', async () => {
  const settings = await chrome.storage.local.get({ enabled: false });
  if (!settings.enabled && (!keyInput.value.trim() || !confirmInput.checked)) { status.textContent = 'Informe a chave e marque a confirmação para ativar.'; return; }
  await chrome.storage.local.set({ enabled: !settings.enabled, bridgeKey: keyInput.value.trim(), bridgePort: Number(portInput.value) || 43172, confirmed: confirmInput.checked });
  await refresh();
});
refresh();
