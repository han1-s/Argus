export function showArgusToast(message: string): void {
  const container = document.getElementById('toastContainer') ?? document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  if (!container.parentElement) document.body.appendChild(container);

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3500);
}
