const $ = s => document.querySelector(s);
const state = { user: null, data: null, subscription: null, page: 'dashboard', detailId: null, authMode: 'login', reportDays: 7, machineReportDays: 7, planCycle: 'monthly' };
const LOCAL_SETTINGS_KEY = 'argusPlatformSettings';
const DEFAULT_LOCAL_SETTINGS = { theme: 'dark', refreshSeconds: 10, reduceMotion: false, compact: false, timeZone: 'local' };
let localSettings = (() => { try { return { ...DEFAULT_LOCAL_SETTINGS, ...JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}') }; } catch { return { ...DEFAULT_LOCAL_SETTINGS }; } })();
if (!['dark', 'gray', 'light'].includes(localSettings.theme)) localSettings.theme = DEFAULT_LOCAL_SETTINGS.theme;
if (![5, 10, 30, 60].includes(Number(localSettings.refreshSeconds))) localSettings.refreshSeconds = DEFAULT_LOCAL_SETTINGS.refreshSeconds;
if (!['local', 'utc'].includes(localSettings.timeZone)) localSettings.timeZone = DEFAULT_LOCAL_SETTINGS.timeZone;
let dashboardRefreshTimer;
let profileSyncTimer;
function applyLocalSettings() {
  document.body.dataset.theme = ['dark', 'gray', 'light'].includes(localSettings.theme) ? localSettings.theme : 'dark';
  document.body.classList.toggle('reduce-animations', localSettings.reduceMotion === true);
  document.body.classList.toggle('compact-ui', localSettings.compact === true);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = localSettings.theme === 'light' ? '#f3f5f8' : localSettings.theme === 'gray' ? '#22252c' : '#0b0911';
}
function saveLocalSettings(changes) {
  localSettings = { ...localSettings, ...changes };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(localSettings));
  applyLocalSettings();
  if (Object.hasOwn(changes, 'refreshSeconds')) configureDashboardRefresh();
}
function configureDashboardRefresh() {
  clearInterval(dashboardRefreshTimer);
  if (!state.user) return;
  dashboardRefreshTimer = setInterval(async () => {
    await refresh();
    if (state.detailId) renderDetail(state.detailId); else render();
  }, Math.max(5, Number(localSettings.refreshSeconds) || 10) * 1000);
}
applyLocalSettings();
const TERMS_VERSION = '2026-09-v1';
const pages = { dashboard: 'Visão geral', computers: 'Computadores', activity: 'Atividades', applications: 'Aplicações', web: 'Navegação web', reports: 'Relatórios', alerts: 'Alertas', plans: 'Planos e cobrança', settings: 'Configurações' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = value => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', ...(localSettings.timeZone === 'utc' ? { timeZone: 'UTC' } : {}) }) : '—';
const fmtUptime = sec => { const h = Math.floor((Number(sec) || 0) / 3600), d = Math.floor(h / 24); return d ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((sec % 3600) / 60)}min`; };
async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && !url.startsWith('/api/auth/')) showAuth(); const error = new Error(data.error || 'Não foi possível concluir a solicitação.'); error.upgradeRequired = data.upgradeRequired === true; throw error; }
  return data;
}
function showAuth() { clearInterval(profileSyncTimer); document.documentElement.classList.add('auth-view'); $('#authView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#helpBotToggle').classList.add('hidden'); $('#helpBotPanel').classList.add('hidden'); }
function showApp() { document.documentElement.classList.remove('auth-view'); $('#authView').classList.add('hidden'); $('#appView').classList.remove('hidden'); $('#helpBotToggle').classList.remove('hidden'); }
$('#passwordToggle').onclick = () => { const input = $('#passwordInput'), visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; $('#passwordToggle').setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha'); $('#passwordToggle').setAttribute('aria-pressed', String(visible)); };
function setAuthMode(mode) {
  state.authMode = mode; const signup = mode === 'signup';
  $('#authTitle').textContent = signup ? 'Criar conta no ARGUS' : 'Acessar o ARGUS';
  $('#authSubtitle').textContent = signup ? 'Crie sua conta para começar a utilizar a plataforma.' : 'Entre na sua conta para acessar sua experiência no ARGUS.';
  $('#nameWrap').classList.toggle('hidden', !signup); $('#confirmWrap').classList.toggle('hidden', !signup);
  $('#confirmInput').required = signup; $('#nameInput').required = signup;
  $('#passwordInput').minLength = signup ? 10 : 8; $('#passwordInput').placeholder = signup ? 'Mínimo 10 caracteres' : 'Digite sua senha'; $('#passwordInput').autocomplete = signup ? 'new-password' : 'current-password';
  $('#confirmInput').autocomplete = 'new-password';
  $('#webConsentWrap').classList.toggle('hidden', !signup);
  $('#forgotPasswordButton').classList.toggle('hidden', signup); $('#forgotPasswordForm').classList.add('hidden');
  $('#termsAccepted').checked = false; $('#webConsent').checked = false;
  $('#authSubmit').innerHTML = signup ? 'Criar conta <span>→</span>' : 'Entrar <span>→</span>';
  $('#switchText').textContent = signup ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'; $('#authSwitch').textContent = signup ? 'Fazer login' : 'Cadastre-se'; $('#authError').classList.add('hidden');
}
$('#authSwitch').onclick = () => setAuthMode(state.authMode === 'login' ? 'signup' : 'login');
$('#authForm').onsubmit = async e => {
  e.preventDefault(); $('#authError').classList.add('hidden');
  try {
    const body = { email: $('#emailInput').value, password: $('#passwordInput').value, termsVersion: TERMS_VERSION, termsAccepted: $('#termsAccepted').checked };
    if ($('#webConsent').checked) body.webConsent = true;
    if (state.authMode === 'signup') { body.name = $('#nameInput').value; body.webConsent = $('#webConsent').checked; if ($('#confirmInput').value !== body.password) throw new Error('As senhas não coincidem.'); }
    const result = await api(`/api/auth/${state.authMode}`, { method: 'POST', body: JSON.stringify(body) });
    state.user = result.user; enterApp();
  } catch (err) { $('#authError').textContent = err.message; $('#authError').classList.remove('hidden'); }
};
$('#forgotPasswordButton').onclick = () => {
  $('#resetEmailInput').value = $('#emailInput').value;
  $('#resetStatus').textContent = '';
  $('#resetStatus').classList.add('hidden');
  $('#forgotPasswordForm').classList.toggle('hidden');
};
$('#forgotPasswordForm').onsubmit = async event => {
  event.preventDefault();
  const status = $('#resetStatus'); status.textContent = 'Preparando a simulação de envio…'; status.classList.remove('hidden'); status.classList.remove('is-error');
  try {
    const result = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: $('#resetEmailInput').value }) });
    if (!result.simulatedEmail) { status.textContent = result.message; return; }
    status.textContent = `E-mail simulado para ${result.simulatedEmail.to}. Código: ${result.simulatedEmail.code}. Válido por ${result.simulatedEmail.expiresInMinutes} minutos.`;
    $('#resetCodeWrap').classList.remove('hidden'); $('#resetNewPasswordWrap').classList.remove('hidden'); $('#completeResetButton').classList.remove('hidden');
    $('#resetCodeInput').required = true; $('#resetNewPasswordInput').required = true;
  } catch (error) { status.textContent = error.message; status.classList.add('is-error'); }
};
$('#completeResetButton').onclick = async () => {
  const status = $('#resetStatus'); status.classList.remove('is-error');
  try {
    const result = await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: $('#resetEmailInput').value, code: $('#resetCodeInput').value, password: $('#resetNewPasswordInput').value }) });
    status.textContent = result.message; $('#passwordInput').value = ''; $('#resetCodeInput').value = ''; $('#resetNewPasswordInput').value = '';
    $('#resetCodeWrap').classList.add('hidden'); $('#resetNewPasswordWrap').classList.add('hidden'); $('#completeResetButton').classList.add('hidden');
  } catch (error) { status.textContent = error.message; status.classList.add('is-error'); }
};
function renderUserBadge() {
  $('#userName').textContent = state.user.name;
  const avatar = $('#avatar');
  avatar.replaceChildren();
  if (state.user.avatarData) {
    const image = document.createElement('img'); image.src = state.user.avatarData; image.alt = '';
    avatar.appendChild(image);
  } else avatar.textContent = state.user.name.slice(0, 1).toUpperCase();
}
async function syncProfile() {
  try {
    const result = await api('/api/auth/me');
    const changed = state.user.name !== result.user.name || state.user.email !== result.user.email || state.user.avatarData !== result.user.avatarData;
    state.user = result.user;
    if (changed) { renderUserBadge(); if (state.page === 'settings') renderSettings(); }
  } catch {}
}
function enterApp() {
  showApp(); renderUserBadge();
  refresh().then(render); connectSocket(); loadNetworkConfig(); configureDashboardRefresh();
  clearInterval(profileSyncTimer); profileSyncTimer = setInterval(syncProfile, 30000);
  render();
}
let socket;
function sameDashboardSummary(previous, next) {
  return previous && next && ['total', 'online', 'offline', 'alerts'].every(key => previous[key] === next[key]);
}
function connectSocket() {
  if (!window.io) return;
  if (socket) socket.disconnect(); socket = io(); socket.on('update', async () => {
    const previousSummary = state.data?.summary;
    await syncProfile();
    await refresh();
    if (state.detailId) return renderDetail(state.detailId);
    if (state.page === 'dashboard' && sameDashboardSummary(previousSummary, state.data?.summary)) return;
    render();
  });
}
async function refresh() { try { const [dashboard, subscription] = await Promise.all([api('/api/dashboard'), api('/api/assinatura')]); state.data = dashboard; state.subscription = subscription; } catch {} }
async function loadNetworkConfig() {
  try { const c = await api('/api/config'); $('#serverAddress').textContent = c.ips[0] ? `${c.ips[0]}:${c.port}` : `localhost:${c.port}`; } catch {}
}
$('#logoutButton').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); state.user = null; clearInterval(dashboardRefreshTimer); if (socket) socket.disconnect(); showAuth(); };
document.querySelectorAll('.nav-item').forEach(button => button.onclick = () => { state.page = button.dataset.page; state.detailId = null; document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b === button)); $('#pageCrumb').textContent = pages[state.page]; render(); document.querySelector('.sidebar').classList.remove('open'); });
$('#mobileMenu').onclick = () => $('.sidebar').classList.toggle('open');
function render() {
  if (!state.data) { $('#pageContent').innerHTML = '<div class="loading">Conectando ao servidor local…</div>'; return; }
  $('#navComputerCount').textContent = state.data.summary.total; $('#navAlertCount').textContent = state.data.summary.alerts;
  if (state.detailId) return renderDetail(state.detailId);
  $('#pageCrumb').textContent = pages[state.page];
  const renderPage = { dashboard: renderDashboard, computers: renderComputers, activity: renderActivity, applications: () => state.data.plan?.advancedMetrics ? renderApplications() : renderPlanLocked('Aplicações', 'Métricas avançadas de aplicativos ficam disponíveis nos planos Pro e Business.'), web: renderWeb, reports: () => state.data.plan?.reports ? renderReports() : renderPlanLocked('Relatórios', 'Histórico detalhado fica disponível nos planos Pro e Business.'), alerts: () => state.data.plan?.alerts ? renderAlerts() : renderPlanLocked('Alertas', 'Alertas de CPU e memória ficam disponíveis nos planos Pro e Business.'), plans: renderPlans, settings: renderSettings }[state.page] || renderDashboard;
  renderPage();
}
function pageHead(kicker, title, desc, action = '') { return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`; }
function statusBadge(m) { return `<span class="status ${m.status}"><i></i>${m.status === 'online' ? 'Online' : 'Offline'}</span>`; }
function computerRows(machines) {
  if (!machines.length) return '<div class="empty-state"><div class="empty-icon">⌘</div><b>Nenhum computador conectado</b><p>Gere um código de conexão e execute o agente no computador que deseja monitorar.</p><button class="button primary" data-pair>＋ Adicionar computador</button></div>';
  return `<div class="table-wrap"><table><thead><tr><th>DISPOSITIVO</th><th>USUÁRIO</th><th>SISTEMA</th><th>CPU</th><th>RAM</th><th>STATUS</th><th>ÚLTIMO SINAL</th><th></th></tr></thead><tbody>${machines.map(m => `<tr class="machine-row" data-machine="${esc(m.id)}"><td><div class="device-cell"><span class="device-icon">▣</span><span><b>${esc(m.name)}</b><small>${esc(m.arch || 'Endpoint')}</small></span></div></td><td>${esc(m.userName || '—')}</td><td>${esc(m.os || 'Aguardando dados')}</td><td>${m.metrics?.cpu ?? '—'}${m.status === 'online' ? '%' : ''}</td><td>${m.metrics?.ram ?? '—'}${m.status === 'online' ? '%' : ''}</td><td>${statusBadge(m)}</td><td class="muted">${fmtDate(m.lastSeen)}</td><td><span class="row-arrow">↗</span></td></tr>`).join('')}</tbody></table></div>`;
}
function metricCard(label, value, suffix, icon, foot, tone = '') { return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}">${icon}</span></div><div class="metric-value">${value}<small>${suffix || ''}</small></div><div class="metric-foot">${foot}</div></article>`; }
function eventMarkup(events) { return events.length ? events.slice(0, 7).map(e => `<div class="event-row"><span class="event-dot ${esc(e.type)}"></span><div><b>${esc(e.message)}</b><small>${esc(e.machineName)} · ${fmtDate(e.at)}</small></div><span class="event-time">${new Date(e.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>`).join('') : '<div class="subtle-empty">Atividades serão registradas quando agentes se conectarem.</div>'; }
function renderDashboard() {
  const { summary } = state.data;
  $('#pageContent').innerHTML = `${pageHead('MONITORAMENTO DA REDE', 'Visi\u00e3o geral', 'Resumo dos dispositivos conectados \u00e0 sua rede.', '<button class="button primary" data-pair>\uFF0B <span>Adicionar computador</span></button>')}
    <div class="metric-grid">${metricCard('Computadores', summary.total, 'dispositivos', '\u25A3', 'Registrados no ambiente')}${metricCard('Online', summary.online, 'ativos', '\u25CF', 'Heartbeat nos \u00faltimos 45s', 'green')}${metricCard('Offline', summary.offline, 'inativos', '\u25CC', 'Sem comunica\u00e7\u00e3o recente', 'gray')}${metricCard('Alertas ativos', summary.alerts, 'abertos', '\u25C7', 'Precisam de aten\u00e7\u00e3o', 'amber')}</div>
    <section class="panel"><div class="panel-heading"><div><h2>Relat\u00f3rios completos</h2><p>Consulte o hist\u00f3rico, as m\u00e9tricas e os detalhes de cada computador na \u00e1rea de relat\u00f3rios.</p></div><button class="button quiet" data-page="reports">Abrir relat\u00f3rios \u2192</button></div></section>`;
  bindPageActions();
}
function resourceBars(machines) {
  const active = machines.filter(m => m.status === 'online'); if (!active.length) return '<div class="subtle-empty">Métricas reais aparecerão após conectar um agente.</div>';
  return active.slice(0, 4).map(m => `<div class="resource-row"><div><b>${esc(m.name)}</b><span>${m.metrics?.cpu ?? 0}% CPU</span></div><div class="bar"><i style="width:${m.metrics?.cpu ?? 0}%"></i></div><div class="resource-meta"><span>RAM ${m.metrics?.ram ?? 0}%</span><span>Disco ${m.metrics?.disk ?? 0}%</span></div></div>`).join('');
}
function renderComputers() { $('#pageContent').innerHTML = `${pageHead('ENDPOINTS', 'Computadores', 'Dispositivos vinculados ao seu ambiente.', '<button class="button primary" data-pair>＋ <span>Adicionar computador</span></button>')}<section class="panel full-panel">${computerRows(state.data.machines)}</section>`; bindPageActions(); }
function renderActivity() { $('#pageContent').innerHTML = `${pageHead('LINHA DO TEMPO', 'Atividades', 'Eventos recentes enviados pelos agentes conectados.')}<section class="panel full-panel"><div class="event-list roomy">${eventMarkup(state.data.events)}</div></section>`; bindPageActions(); }
function renderApplications() {
  const apps = state.data.machines.flatMap(m => (m.apps || []).map(a => ({ ...a, machine: m.name, machineStatus:m.status, foregroundTelemetryAvailable:m.foregroundTelemetryAvailable, foregroundApp:m.foregroundApp }))).sort((a, b) => Date.parse(b.lastSeenAt)-Date.parse(a.lastSeenAt));
  $('#pageContent').innerHTML = `${pageHead('APLICAÇÕES OBSERVADAS', 'Aplicações', 'Processos detectados e tempo medido em primeiro plano no Windows, separados por computador.')}<section class="panel full-panel"><div class="notice">O tempo foreground é observado pelo Windows enquanto há entrada do usuário, com resolução de amostragem de até 250 ms; períodos ociosos são excluídos. Processo detectado não significa janela em uso. Sistemas sem o watcher mostram “Medição indisponível”.</div>${apps.length ? `<div class="table-wrap"><table><thead><tr><th>APLICAÇÃO</th><th>COMPUTADOR</th><th>ESTADO</th><th>TEMPO FOREGROUND</th><th>MUDANÇAS DE FOCO</th><th>ÚLTIMA OBSERVAÇÃO</th></tr></thead><tbody>${apps.map(a => {const foreground=a.foregroundTelemetryAvailable&&a.machineStatus==='online'&&a.foregroundApp?.toLowerCase()===String(a.processName||a.name).toLowerCase();const processRunning=a.status==='running'&&a.machineStatus==='online';return `<tr><td><b>${esc(a.name)}</b><small class="process-subtitle">${esc(a.processName)}</small></td><td>${esc(a.machine)}</td><td><span class="app-state ${foreground?'is-running':''}">${foreground?'Em primeiro plano agora':a.foregroundTelemetryAvailable?processRunning?'Processo detectado':'Não observado agora':'Medição indisponível'}</span></td><td>${appDuration(a)}</td><td>${a.foregroundOccurrences||'—'}</td><td>${fmtDate(a.lastSeenAt)}</td></tr>`;}).join('')}</tbody></table></div>` : '<div class="empty-state"><div class="empty-icon">▧</div><b>Sem aplicações identificadas</b><p>Quando um agente estiver conectado, os processos amostrados aparecerão aqui.</p></div>'}</section><section class="panel web-note"><div class="panel-heading"><div><h2>Navegação web</h2><p>Coleta opcional via extensão autorizada</p></div></div><p>Habilite o consentimento em Configurações e instale ARGUS Web no navegador do endpoint. <button class="text-button" data-page="web">Ver atividade web →</button></p></section>`; bindPageActions();
}
function durationLabel(seconds) { const value=Math.max(0,Number(seconds)||0); if(value>0&&value<60)return '<1 min'; const minutes=Math.floor(value/60); return minutes<60?`${minutes} min`:`${Math.floor(minutes/60)}h ${minutes%60}min`; }
function appDuration(app) { const measuredMilliseconds=Number(app.foregroundDurationMilliseconds ?? app.durationMilliseconds)||0; return measuredMilliseconds>0 ? durationLabel(Math.floor(measuredMilliseconds/1000)) : 'Sem tempo foreground medido'; }
function renderWeb() {
  const items=state.data.webActivity||[];
  const action=state.user.webConsent?'<span class="consent-on"><i></i> COLETA AUTORIZADA</span>':'<span class="consent-off">COLETA DESATIVADA</span>';
  $('#pageContent').innerHTML=`${pageHead('DOMÍNIOS E TEMPO APROXIMADO','Navegação web','A extensão registra domínios de abas ativas, somente com consentimento.',action)}<section class="panel full-panel"><div class="notice">O protótipo armazena o domínio, dispositivo, duração aproximada e horário. Não armazena URL completa, caminho, busca ou conteúdo da página. A extensão precisa estar instalada e ativada em cada navegador monitorado.</div>${items.length?`<div class="table-wrap"><table><thead><tr><th>DOMÍNIO</th><th>COMPUTADOR</th><th>TEMPO ATIVO</th><th>AMOSTRAS</th><th>ÚLTIMA ATIVIDADE</th></tr></thead><tbody>${items.map(w=>`<tr><td><b>${esc(w.domain)}</b></td><td>${esc(w.machineName)}</td><td>${durationLabel(w.durationSeconds)}</td><td>${w.visits}</td><td>${fmtDate(w.lastSeen)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><div class="empty-icon">◎</div><b>Nenhuma atividade web recebida</b><p>Ative o consentimento em Configurações e instale a extensão autorizada no navegador do endpoint.</p><button class="button quiet" data-page="settings">Configurar coleta →</button></div>'}</section>`;bindPageActions();
}
function renderSettings() {
  const themeOptions = [
    ['dark', 'Escuro', 'Contraste alto para ambientes pouco iluminados.'],
    ['gray', 'Cinza', 'Tons neutros com contraste moderado.'],
    ['light', 'Claro', 'Fundo claro para ambientes iluminados.'],
  ];
  $('#pageContent').innerHTML = `${pageHead('PREFERÊNCIAS E PRIVACIDADE', 'Configurações', 'Personalize a interface, a atualização dos dados e suas preferências de privacidade.')}
    <div class="settings-grid">
      <section class="panel settings-panel profile-settings-panel"><div class="panel-heading"><div><h2>Perfil compartilhado</h2><p>Os mesmos dados de conta aparecem na Web e na Platform.</p></div></div>
        <div class="profile-settings-preview"><div id="settingsProfileAvatar" class="settings-profile-avatar">${state.user.avatarData ? `<img src="${esc(state.user.avatarData)}" alt="">` : esc(state.user.name.slice(0, 1).toUpperCase())}</div><div><b>${esc(state.user.name)}</b><small>Foto, nome e e-mail da conta</small></div></div>
        <form id="profileSettingsForm" class="profile-settings-form"><div class="settings-field"><label for="profileNameInput">Nome</label><input id="profileNameInput" class="field-input" type="text" name="name" minlength="2" maxlength="120" autocomplete="name" value="${esc(state.user.name)}" required></div>
          <div class="settings-field"><label for="profileEmailInput">E-mail</label><input id="profileEmailInput" class="field-input" name="email" type="email" maxlength="254" autocomplete="email" value="${esc(state.user.email)}" required></div>
          <div class="settings-field"><label for="profileAvatarFile">Foto do perfil</label><input id="profileAvatarFile" class="field-input" type="file" accept="image/jpeg,image/png,image/webp"><small>JPEG, PNG ou WebP; até 2 MB. A imagem é otimizada antes de sincronizar.</small></div>
          <div class="settings-actions"><button class="button primary" type="submit">Salvar perfil</button><button id="removeProfileAvatar" class="button quiet" type="button" ${state.user.avatarData ? '' : 'disabled'}>Remover foto</button></div><p id="profileStatus" class="privacy-help" role="status"></p>
        </form>
      </section>
      <section class="panel settings-panel"><div class="panel-heading"><div><h2>Aparência</h2><p>Preferências aplicadas neste navegador.</p></div></div>
        <div class="settings-field"><span class="settings-field-label">Tema da Platform</span><div class="theme-choice-grid" role="group" aria-label="Tema da Platform">${themeOptions.map(([value, label, description]) => `<button type="button" class="theme-choice ${localSettings.theme === value ? 'selected' : ''}" data-theme-choice="${value}" aria-pressed="${localSettings.theme === value}"><span class="theme-choice-preview ${value}"><i></i><i></i><i></i></span><b>${label}</b><small>${description}</small></button>`).join('')}</div><small>O tema é salvo neste navegador.</small></div>
        <label class="toggle-row"><span><b>Movimento reduzido</b><small>Reduz transições e animações da interface.</small></span><input id="reduceMotion" type="checkbox" ${localSettings.reduceMotion ? 'checked' : ''}></label>
        <label class="toggle-row"><span><b>Layout compacto</b><small>Reduz espaçamentos para mostrar mais conteúdo por tela.</small></span><input id="compactUi" type="checkbox" ${localSettings.compact ? 'checked' : ''}></label>
      </section>
      <section class="panel settings-panel"><div class="panel-heading"><div><h2>Atualização e horário</h2><p>Controle a consulta de dados e a exibição de datas.</p></div></div>
        <div class="settings-field"><label for="refreshSeconds">Atualização automática</label><select id="refreshSeconds" class="select"><option value="5" ${Number(localSettings.refreshSeconds) === 5 ? 'selected' : ''}>A cada 5 segundos</option><option value="10" ${Number(localSettings.refreshSeconds) === 10 ? 'selected' : ''}>A cada 10 segundos</option><option value="30" ${Number(localSettings.refreshSeconds) === 30 ? 'selected' : ''}>A cada 30 segundos</option><option value="60" ${Number(localSettings.refreshSeconds) === 60 ? 'selected' : ''}>A cada 60 segundos</option></select><small>Também consulta o servidor se a conexão em tempo real for interrompida.</small></div>
        <div class="settings-field"><label for="timeZone">Fuso horário das datas</label><select id="timeZone" class="select"><option value="local" ${localSettings.timeZone === 'local' ? 'selected' : ''}>Automático do computador</option><option value="utc" ${localSettings.timeZone === 'utc' ? 'selected' : ''}>UTC</option></select><small>Afeta os horários exibidos em atividades, alertas e relatórios.</small></div>
      </section>
      <section class="panel settings-panel"><div class="panel-heading"><div><h2>Coleta de navegação web</h2><p>Preferência e revogação de consentimento</p></div></div>
        <label class="toggle-row"><span><b>Permitir coleta web</b><small>Domínios e duração aproximada das abas ativas, via extensão.</small></span><input id="webConsentToggle" type="checkbox" ${state.user.webConsent ? 'checked' : ''}></label>
        <p class="privacy-help">Ao desativar, o agente deixa de aceitar novos dados e o histórico de navegação guardado será eliminado.</p>
        <div class="notice">A extensão registra somente o domínio e a duração aproximada. Configure-a apenas em navegadores autorizados e informe as pessoas monitoradas.</div>
      </section>
      <section class="panel settings-panel"><div class="panel-heading"><div><h2>Termos e uso responsável</h2><p>Versão aceita e documento vigente.</p></div></div>
        <p class="privacy-help">Versão aceita nesta conta: <b>${esc(state.user.termsVersion || 'não informada')}</b></p>
        <p class="privacy-help">Versão vigente no servidor: <b id="currentTermsVersion">Carregando…</b></p>
        <a class="terms-link" href="/terms.html" target="_blank" rel="noreferrer">Ler Termos de Uso e Aviso de Privacidade ↗</a>
      </section>
      <section class="panel settings-panel"><div class="panel-heading"><div><h2>Seus dados</h2><p>Exportação e exclusão da conta</p></div></div>
        <p class="privacy-help">Exporte uma cópia dos registros da conta ou remova a conta e seus dispositivos do banco do servidor principal.</p>
        <div class="settings-actions"><button id="exportData" class="button quiet">Baixar meus dados (JSON)</button><button id="deleteAccount" class="button danger">Excluir conta e dados</button></div>
        <p class="privacy-help">A exclusão também encerra a sessão da Platform e da Web.</p>
      </section>
    </div>`;
  let pendingAvatarData;
  const profileStatus = $('#profileStatus');
  $('#profileAvatarFile').onchange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      event.target.value = ''; profileStatus.textContent = 'Escolha JPEG, PNG ou WebP com até 2 MB.'; profileStatus.classList.add('is-error'); return;
    }
    try {
      pendingAvatarData = await optimizeAvatar(file);
      $('#settingsProfileAvatar').innerHTML = `<img src="${esc(pendingAvatarData)}" alt="">`;
      $('#removeProfileAvatar').disabled = false;
      profileStatus.textContent = 'Foto pronta. Salve o perfil para sincronizá-la.'; profileStatus.classList.remove('is-error');
    } catch (error) { profileStatus.textContent = error.message; profileStatus.classList.add('is-error'); }
  };
  $('#profileSettingsForm').onsubmit = async event => {
    event.preventDefault();
    const body = { name: $('#profileNameInput').value.trim(), email: $('#profileEmailInput').value.trim() };
    if (pendingAvatarData !== undefined) body.avatarData = pendingAvatarData;
    profileStatus.textContent = 'Salvando perfil compartilhado…'; profileStatus.classList.remove('is-error');
    try {
      const result = await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
      state.user = result.user; pendingAvatarData = undefined; renderUserBadge();
      $('.profile-settings-preview b').textContent = state.user.name;
      profileStatus.textContent = 'Perfil sincronizado com Web e Platform.';
      $('#removeProfileAvatar').disabled = !state.user.avatarData;
    } catch (error) { profileStatus.textContent = error.message; profileStatus.classList.add('is-error'); }
  };
  $('#removeProfileAvatar').onclick = async () => {
    try {
      const result = await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ name: $('#profileNameInput').value.trim(), email: $('#profileEmailInput').value.trim(), avatarData: null }) });
      state.user = result.user; pendingAvatarData = undefined; $('#profileAvatarFile').value = ''; renderUserBadge();
      $('#settingsProfileAvatar').textContent = state.user.name.slice(0, 1).toUpperCase();
      $('#removeProfileAvatar').disabled = true; profileStatus.textContent = 'Foto removida da conta Web e Platform.'; profileStatus.classList.remove('is-error');
    } catch (error) { profileStatus.textContent = error.message; profileStatus.classList.add('is-error'); }
  };
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.onclick = () => { const label = button.querySelector('b').textContent; saveLocalSettings({ theme: button.dataset.themeChoice }); render(); toast(`Tema ${label.toLocaleLowerCase('pt-BR')} aplicado.`); });
  $('#reduceMotion').onchange = event => { saveLocalSettings({ reduceMotion: event.target.checked }); toast('Preferência de movimento atualizada.'); };
  $('#compactUi').onchange = event => { saveLocalSettings({ compact: event.target.checked }); toast('Densidade da interface atualizada.'); };
  $('#refreshSeconds').onchange = event => { saveLocalSettings({ refreshSeconds: Number(event.target.value) }); toast('Frequência de atualização atualizada.'); };
  $('#timeZone').onchange = event => { saveLocalSettings({ timeZone: event.target.value }); render(); toast('Fuso horário atualizado.'); };
  api('/api/legal/terms').then(terms => { const node = $('#currentTermsVersion'); if (node) node.textContent = terms.version; }).catch(() => { const node = $('#currentTermsVersion'); if (node) node.textContent = 'indisponível'; });
  $('#webConsentToggle').onchange = async event => {
    try {
      const result = await api('/api/privacy/web-consent', { method: 'POST', body: JSON.stringify({ enabled: event.target.checked }) });
      state.user.webConsent = result.webConsent; await refresh();
      toast(result.webConsent ? 'Coleta web habilitada. Configure a extensão nos endpoints.' : 'Consentimento revogado e histórico web eliminado.'); render();
    } catch (error) { event.target.checked = state.user.webConsent; toast(error.message); }
  };
  $('#exportData').onclick = async () => {
    try {
      const data = await api('/api/privacy/export'); data.preferences = { ...localSettings };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = 'argus-meus-dados.json'; link.click(); URL.revokeObjectURL(link.href);
    } catch (error) { toast(error.message); }
  };
  $('#deleteAccount').onclick = async () => {
    if (!confirm('Excluir sua conta e todos os dispositivos e registros associados? Esta ação não pode ser desfeita.')) return;
    try { await api('/api/privacy/delete-account', { method: 'POST', body: '{}' }); state.user = null; state.data = null; clearInterval(dashboardRefreshTimer); if (socket) socket.disconnect(); showAuth(); toast('Conta e dados excluídos.'); }
    catch (error) { toast(error.message); }
  };
}
function alertLine(a) { return `<div class="alert-row"><span class="alert-symbol ${esc(a.kind)}">${a.kind === 'cpu' ? '↗' : a.kind === 'offline' ? '⌁' : '◇'}</span><div><b>${esc(a.message)}</b><small>${esc(a.machineName)} · ${fmtDate(a.at)}</small></div><button class="text-button" data-ack="${esc(a.id)}">Reconhecer</button></div>`; }
function renderAlerts() { $('#pageContent').innerHTML = `${pageHead('SAÚDE DO AMBIENTE', 'Alertas', 'Limites de recursos e mudanças no estado de conexão.')}<section class="panel full-panel">${state.data.alerts.length ? state.data.alerts.map(alertLine).join('') : '<div class="empty-state"><div class="empty-icon">◇</div><b>Nenhum alerta ativo</b><p>Alertas aparecerão aqui quando a CPU superar 85%, a RAM 90% ou um dispositivo ficar offline.</p></div>'}</section>`; bindPageActions(); document.querySelectorAll('[data-ack]').forEach(b => b.onclick = async () => { await api(`/api/alerts/${b.dataset.ack}/ack`, { method: 'POST' }); await refresh(); render(); }); }
function renderPlanLocked(title, message) {
  $('#pageContent').innerHTML = pageHead('RECURSO DO PLANO', title, message) + '<section class="panel full-panel plan-locked"><b>Faça upgrade para liberar este recurso.</b><p>Os pagamentos são simulados; a alteração do plano é aplicada à conta Web e Platform.</p><button class="button quiet" data-page="plans">Ver planos</button></section>';
  bindPageActions();
}
function renderPlans() {
  const subscription = state.subscription?.assinatura || { plan: 'Free', billing_cycle: 'monthly' };
  const limits = state.subscription?.limites || state.data.plan || { computers: 10, retentionDays: 7, reports: false, alerts: false };
  const used = Number(state.subscription?.uso?.computadores ?? state.data.usage?.computers ?? 0);
  const cards = [
    { id: 'Free', price: 0, computers: '10', retention: '7 dias', reports: false, alerts: false },
    { id: 'Pro', price: state.planCycle === 'annual' ? 39 : 49, computers: '50', retention: '90 dias', reports: true, alerts: true },
    { id: 'Business', price: state.planCycle === 'annual' ? 119 : 149, computers: 'Ilimitados', retention: '365 dias', reports: true, alerts: true },
  ];
  const cardMarkup = cards.map(card => {
    const current = card.id === subscription.plan;
    const action = current ? '<button class="button quiet" disabled>Plano atual</button>' : '<button class="button ' + (card.id === 'Pro' ? 'primary' : 'quiet') + '" data-plan-buy="' + card.id + '">' + (card.id === 'Free' ? 'Ativar Free' : 'Simular compra PIX') + '</button>';
    return '<article class="panel plan-card ' + (current ? 'is-current' : '') + '"><span class="eyebrow">ARGUS</span><h2>' + card.id + '</h2><p class="plan-price">R$ ' + card.price + '<small>/mês</small></p><ul><li>' + card.computers + ' computadores</li><li>Retenção ' + card.retention + '</li><li>' + (card.reports ? 'Relatórios completos' : 'Sem relatórios avançados') + '</li><li>' + (card.alerts ? 'Alertas de recursos' : 'Sem alertas Pro') + '</li><li>Conta única Web + Platform</li></ul>' + action + '</article>';
  }).join('');
  $('#pageContent').innerHTML = pageHead('ARGUS · PLANOS', 'Planos e cobrança', 'Uma assinatura compartilhada controla a Web e a Platform. Compras e preços são simulados.')
    + '<section class="panel plan-current"><div><span class="eyebrow">PLANO ATIVO</span><h2>' + esc(subscription.plan) + '</h2><p>' + used + ' computador(es) vinculados · limite ' + (limits.computers === null ? 'ilimitado' : limits.computers) + ' · retenção ' + limits.retentionDays + ' dias.</p></div><div class="plan-cycle-switch"><button class="button ' + (state.planCycle === 'monthly' ? 'primary' : 'quiet') + '" data-cycle="monthly">Mensal</button><button class="button ' + (state.planCycle === 'annual' ? 'primary' : 'quiet') + '" data-cycle="annual">Anual · 20% demo</button></div></section>'
    + '<div class="plan-cards">' + cardMarkup + '</div><p class="notice">O limite de computadores é verificado ao gerar o código e ao conectar o agente. Planos pagos liberam relatórios, alertas de recursos e maior retenção. Nenhuma cobrança real é feita.</p>';
  document.querySelectorAll('[data-cycle]').forEach(button => button.onclick = () => { state.planCycle = button.dataset.cycle; renderPlans(); });
  document.querySelectorAll('[data-plan-buy]').forEach(button => button.onclick = async () => {
    const plan = button.dataset.planBuy;
    try {
      if (plan === 'Free') await api('/api/assinatura', { method: 'PUT', body: JSON.stringify({ plan, billingCycle: state.planCycle }) });
      else await api('/api/assinatura/pagamentos-simulados', { method: 'POST', body: JSON.stringify({ plan, billingCycle: state.planCycle, paymentMethod: 'pix' }) });
      await refresh(); render(); toast(plan === 'Free' ? 'Plano Free ativado.' : 'Compra simulada concluída.');
    } catch (error) { toast(error.message); }
  });
}
async function renderReports() {
  $('#pageContent').innerHTML = `${pageHead('DADOS DO AMBIENTE', 'Relatórios', 'Resumo do histórico realmente armazenado pelo servidor.', `<select id="reportRange" class="select"><option value="1">Hoje</option><option value="7" selected>Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 365 dias</option></select>`)}<div id="reportBody" class="loading">Carregando histórico…</div>`;
  const maxRetention = Number(state.data.plan?.retentionDays) || 7;
  [...$('#reportRange').options].forEach(option => { if (Number(option.value) > maxRetention) option.remove(); });
  const load = async days => {
    state.reportDays = days;
    try {
      const report = await api(`/api/reports?days=${days}`), online = report.machines.filter(m => m.status === 'online').length;
      $('#reportBody').innerHTML = `<div class="metric-grid">${metricCard('Computadores', report.machines.length, 'registrados', '▣', 'No ambiente')}${metricCard('Eventos', report.events.length, 'registrados', '◷', `Nos últimos ${days} dia(s)`, 'blue')}${metricCard('Alertas', report.alerts.length, 'ocorrências', '◇', 'No período', 'amber')}${metricCard('Ativos agora', online, 'online', '●', 'Heartbeat recente', 'green')}</div><div class="lower-grid"><section class="panel"><div class="panel-heading"><div><h2>Resumo por computador</h2><p>Status e última comunicação</p></div></div>${computerRows(report.machines)}</section><section class="panel"><div class="panel-heading"><div><h2>Eventos do período</h2><p>Histórico recebido e persistido</p></div></div><div class="event-list">${eventMarkup(report.events)}</div></section></div><section class="panel web-note"><div class="panel-heading"><div><h2>Atividade web</h2><p>Domínios e tempo em abas ativas</p></div></div>${report.webActivity.length ? `<div class="table-wrap"><table><thead><tr><th>DOMÍNIO</th><th>DISPOSITIVO</th><th>TEMPO ATIVO</th><th>AMOSTRAS</th></tr></thead><tbody>${report.webActivity.map(w => `<tr><td><b>${esc(w.domain)}</b></td><td>${esc(w.machineName)}</td><td>${durationLabel(w.durationSeconds)}</td><td>${w.visits}</td></tr>`).join('')}</tbody></table></div>` : '<div class="subtle-empty">Nenhuma atividade web no período.</div>'}</section>`; bindPageActions();
      const sampleRows = (report.metricSamples || []).slice(0, 30).map(sample => '<tr><td>' + esc(sample.machineName) + '</td><td>' + fmtDate(sample.sampledAt) + '</td><td>' + (Number(sample.metrics?.cpu) || 0) + '%</td><td>' + (Number(sample.metrics?.ram) || 0) + '%</td><td>' + (Number(sample.metrics?.disk) || 0) + '%</td><td>' + (Array.isArray(sample.apps) ? sample.apps.length : 0) + '</td></tr>').join('');
      $('#reportBody').insertAdjacentHTML('beforeend', '<section class="panel full-panel"><div class="panel-heading"><div><h2>Amostras históricas</h2><p>Leituras guardadas por computador dentro da retenção do plano (até 30 mais recentes).</p></div></div>' + (sampleRows ? '<div class="table-wrap"><table><thead><tr><th>COMPUTADOR</th><th>COLETADO EM</th><th>CPU</th><th>RAM</th><th>DISCO</th><th>PROCESSOS</th></tr></thead><tbody>' + sampleRows + '</tbody></table></div>' : '<div class="subtle-empty">Nenhuma amostra histórica no período.</div>') + '</section>');
    } catch (e) { $('#reportBody').textContent = e.message; }
  };
  $('#reportRange').value = String(state.reportDays); $('#reportRange').onchange = e => load(Number(e.target.value)); load(state.reportDays);
}
function bindPageActions() {
  document.querySelectorAll('[data-pair]').forEach(b => b.onclick = () => showPairModal().catch(error => { toast(error.message); if (error.upgradeRequired) { state.page = 'plans'; render(); } }));
  document.querySelectorAll('[data-page]').forEach(b => { if (b.classList.contains('quiet')) b.onclick = () => { state.page = b.dataset.page; state.detailId = null; document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === state.page)); render(); }; });
  document.querySelectorAll('[data-machine]').forEach(row => row.onclick = () => { state.detailId = row.dataset.machine; renderDetail(state.detailId); });
}
async function showPairModal() {
  const pairing = await api('/api/pairings', { method: 'POST', body: '{}' });
  const net = await api('/api/config').catch(() => ({ ips: [], port: 3000 }));
  const serverUrl = `http://${net.ips[0] || 'IP-DO-ADMIN'}:${net.port}`;
  const installerQuery = `server=${encodeURIComponent(serverUrl)}`;
  const modal = document.createElement('div'); modal.className = 'modal-backdrop'; modal.innerHTML = `<div class="modal"><button class="modal-close" aria-label="Fechar">×</button><div class="eyebrow">INSTALAR E VINCULAR ENDPOINT</div><h2>Adicionar computador</h2><p>Baixe e execute o instalador no computador autorizado. No assistente, informe o endereço LAN, o nome do PC e este código de conexão.</p><div class="copy-row"><div class="copy-value">${esc(serverUrl)}</div><button class="button quiet" id="copyAddress">Copiar</button></div><div class="copy-row"><div class="copy-value" id="pairingCode">${esc(pairing.code)}</div><button class="button quiet" id="copyPairing">Copiar código</button></div><div class="installer-actions"><a class="button primary" href="/downloads/ARGUS.cmd?${installerQuery}">Baixar ARGUS.cmd</a></div><div class="steps"><b>1.</b><span>O código expira em ${Math.floor(pairing.expiresIn / 60)} minutos e só pode ser usado uma vez. Gere outro se expirar.</span></div><div class="pair-expiry"><i class="pulse"></i> Não compartilhe o código fora do computador que deseja conectar.</div><div class="modal-footer"><span id="pairStatus">Aguardando a conexão do computador…</span><button class="button primary" id="donePair">Concluído</button></div></div>`;
  document.body.appendChild(modal); modal.querySelector('.modal-close').onclick = () => modal.remove(); modal.querySelector('#donePair').onclick = () => modal.remove();
  modal.querySelector('#copyAddress').onclick = async () => { await navigator.clipboard?.writeText(serverUrl); toast('Endereço copiado.'); };
  modal.querySelector('#copyPairing').onclick = async () => { await navigator.clipboard?.writeText(pairing.code); toast('Código de conexão copiado.'); };
  if (socket) socket.once('update', () => { modal.querySelector('#pairStatus').textContent = 'Computador conectado. Ele já aparece na lista.'; });
}
async function renderDetail(machineId) {
  try {
    const data = await api(`/api/machines/${machineId}?days=${state.machineReportDays}`);
    const machine = data.machine;
    const web = data.webActivity || [];
    const appReport = data.applicationReport;
    const runningApps = (machine.apps || []).filter(app => app.status === 'running' && machine.status === 'online');
    const recentApps = (machine.apps || []).slice(0, 8);
    let appsPanel = '';
    let reportPanel = '';
    if (appReport) {
      const reportMaxDay = Math.max(1, ...appReport.daily.map(day => day.durationMilliseconds));
      const reportMaxApp = Math.max(1, ...appReport.applications.map(application => application.durationMilliseconds));
      const dailyBars = appReport.daily.map(day => `<div class="resource-row"><div><b>${new Date(`${day.date}T00:00:00Z`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</b><span>${durationLabel(Math.floor(day.durationMilliseconds/1000))} · ${day.occurrences} mudanças para primeiro plano</span></div><div class="bar"><i style="width:${Math.max(day.durationMilliseconds ? 2 : 0, Math.round(day.durationMilliseconds / reportMaxDay * 100))}%"></i></div></div>`).join('');
      const reportRows = appReport.applications.map(application => {
        const current = application.status === 'foreground' && machine.status === 'online' && appReport.measurementSupported;
        const width = Math.max(application.durationMilliseconds ? 2 : 0, Math.round(application.durationMilliseconds / reportMaxApp * 100));
        const stateLabel = current ? 'Em primeiro plano agora' : appReport.measurementSupported ? 'Não está em primeiro plano' : appReport.hasMeasuredData ? 'Sem estado foreground atual' : 'Medição indisponível';
        return `<tr><td><b>${esc(application.name)}</b><small class="process-subtitle">${esc(application.processName)}</small><div class="bar"><i style="width:${width}%"></i></div></td><td>${durationLabel(Math.floor(application.durationMilliseconds/1000))}</td><td>${application.occurrences}</td><td><span class="app-state ${current?'is-running':''}">${stateLabel}</span></td><td>${fmtDate(application.lastSeenAt)}</td></tr>`;
      }).join('');
      const maxRetention = state.data.plan?.retentionDays || 7;
      const rangeOptions = [1, 7, 30, 90, 365].filter(days => days <= maxRetention).map(days => `<option value="${days}">${days === 1 ? 'Hoje' : `${days} dias`}</option>`).join('');
      appsPanel = `<section class="panel"><div class="panel-heading"><div><h2>Processos na última amostra</h2><p>Atualizados pelo agente a cada heartbeat</p></div></div>${runningApps.length ? `<div class="process-list">${runningApps.map(app => `<div><b>${esc(app.name)}</b><span>${app.cpu==null?'CPU —':`${Number(app.cpu).toFixed(1)}% CPU`}</span><span>${app.memory} MB</span></div>`).join('')}</div>` : '<div class="subtle-empty">Nenhum processo ativo identificado no último sinal.</div>'}<div class="panel-heading app-history-heading"><div><h2>Aplicações observadas</h2><p>Lista recente de processos deste computador</p></div></div>${recentApps.length ? recentApps.map(app => `<div class="app-summary-row"><b>${esc(app.name)}</b><span>${app.status==='running'&&machine.status==='online'?'Em execução':'Não observada na amostra atual'}</span><span>${appDuration(app)}</span></div>`).join('') : '<div class="subtle-empty">Histórico ainda indisponível.</div>'}</section>`;
      reportPanel = `<section class="panel full-panel detail-events"><div class="panel-heading"><div><h2>Relatório de uso em primeiro plano</h2><p>Tempo medido neste computador</p></div><select id="machineReportRange" class="select" aria-label="Período do relatório">${rangeOptions}</select></div><div class="notice" id="machineReportNotice"></div><div class="metric-grid">${metricCard('Tempo observado',appReport.totalSeconds,'no período','◷','Somatório das aplicações')}${metricCard('Aplicações',appReport.applications.length,'identificadas','▧','Neste computador')}${metricCard('Identificações',appReport.totalOccurrences,'ocorrências','⌁','Sessões observadas')}${metricCard('Em execução',appReport.runningCount,'agora','●','Na última amostra','green')}</div><div class="panel-heading app-history-heading"><div><h2>Uso estimado por dia</h2><p>Somatório das aplicações observadas</p></div></div><div class="daily-usage-list">${dailyBars}</div><div class="panel-heading app-history-heading"><div><h2>Aplicações deste computador</h2><p>Tempo, identificações e estado atual no período selecionado</p></div></div>${reportRows ? `<div class="table-wrap"><table><thead><tr><th>APLICAÇÃO</th><th>TEMPO ESTIMADO</th><th>IDENTIFICAÇÕES</th><th>ESTADO</th><th>ÚLTIMA AMOSTRA</th></tr></thead><tbody>${reportRows}</tbody></table></div>` : '<div class="subtle-empty">Ainda não há tempo de uso registrado neste período.</div>'}</section>`;
    }
    const webPanel = `<section class="panel"><div class="panel-heading"><div><h2>Atividade web recente</h2><p>${esc(machine.webActivity || 'Aguardando configuração')}</p></div></div>${web.length ? web.slice(0,8).map(entry => `<div class="resource-row"><div><b>${esc(entry.domain)}</b><span>${durationLabel(entry.durationSeconds)}</span></div><div class="resource-meta"><span>${entry.visits} amostras</span><span>${fmtDate(entry.lastSeen)}</span></div></div>`).join('') : '<div class="subtle-empty">Sem atividade web registrada. Confira consentimento e extensão.</div>'}</section>`;
    $('#pageContent').innerHTML = `<button class="back-link" id="backMachines">← Voltar aos computadores</button>${pageHead('DETALHE DO ENDPOINT', esc(machine.name), `${esc(machine.userName || 'Usuário não identificado')} · ${esc(machine.os || 'Sistema aguardando dados')}`, statusBadge(machine))}<div class="metric-grid">${metricCard('CPU', machine.metrics?.cpu ?? 0, '%', '⌁', 'Uso atual do processador', 'blue')}${metricCard('Memória', machine.metrics?.ram ?? 0, '%', '▤', `${fmtBytes(machine.metrics?.memoryUsed)} de ${fmtBytes(machine.metrics?.memoryTotal)}`, 'green')}${metricCard('Disco', machine.metrics?.disk ?? 0, '%', '▧', 'Uso do volume principal', 'amber')}${metricCard('Tempo ligado', fmtUptime(machine.uptime), '', '◷', `Último sinal: ${fmtDate(machine.lastSeen)}`, 'gray')}</div><div class="lower-grid">${appsPanel}${webPanel}</div>${reportPanel}<section class="panel full-panel detail-events"><div class="panel-heading"><div><h2>Histórico do dispositivo</h2><p>Eventos operacionais e aplica\u00e7\u00f5es identificadas</p></div></div><div class="event-list">${eventMarkup(data.events)}</div></section>`;
    if (appReport) {
      $('#machineReportNotice').textContent = appReport.measurementSupported ? 'O Windows mede qual aplicação estava em primeiro plano enquanto há entrada do usuário. Períodos ociosos (60 s sem entrada) são excluídos; isto mede a janela foreground, não atividade humana.' : appReport.hasMeasuredData ? 'Watcher foreground indisponível no último heartbeat; o relatório contém apenas medições reais já recebidas.' : 'Medição foreground indisponível neste computador. O relatório não usa estimativas baseadas em processos ou heartbeats.';
      $('#machineReportRange').value = String(state.machineReportDays);
      $('#machineReportRange').onchange = event => { state.machineReportDays = Number(event.target.value); renderDetail(machineId); };
    }
    $('#backMachines').onclick = () => { state.detailId = null; state.page = 'computers'; render(); };
  } catch (error) { toast(error.message); state.detailId = null; render(); }
}
function fmtBytes(bytes) { if (!bytes) return '—'; return `${(bytes / 1073741824).toFixed(1)} GB`; }
function optimizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const image = new Image(), objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('Não foi possível preparar esta imagem.'));
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Não foi possível ler esta imagem.')); };
    image.src = objectUrl;
  });
}
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2800); }
const helpTopics = [
  { label: 'Conectar computador', answer: 'No painel, escolha Adicionar computador e baixe ARGUS.cmd. No endpoint autorizado, execute o arquivo, informe o endereço LAN do servidor e use o código exibido. O código vale por 15 minutos e só pode ser usado uma vez.' },
  { label: 'Servidor e MySQL', answer: 'Inicie o MySQL. No Workbench, abra Platform/database/schema.sql, copie todo o conteúdo para uma nova consulta SQL e clique em Executar. Em Platform/.env, configure MYSQL_USER e MYSQL_PASSWORD com uma conta MySQL existente e MYSQL_DATABASE=argus. Isso conecta o servidor ao banco; a conta ARGUS é criada na tela Criar conta. Prepare e inicie a Platform pelo ARGUS.cmd ou execute npm start dentro de Platform. Para somente a Platform, use Node.js 18 ou superior; para o projeto completo, use Node 20.19+ ou 22.12+ LTS. O painel abre em http://localhost:3000.' },
  { label: 'Erro no Node.js', answer: 'No terminal, confira node --version e npm --version. A Platform precisa de Node.js 18 ou superior; para o projeto completo, use Node 20.19+ ou 22.12+ LTS. Feche e reabra o terminal depois de instalar. Se o instalador automático falhar, instale uma versão LTS do Node.js e execute novamente Preparar servidor no ARGUS.cmd.' },
  { label: 'Computador offline', answer: 'Confirme que o agente ARGUS está em execução e que o endpoint alcança http://IP-DO-SERVIDOR:3000 pela mesma rede local. Libere a porta 3000 no firewall do servidor. Os logs do agente ficam em %LOCALAPPDATA%\\ARGUS\\Logs.' },
  { label: 'Plano', answer: 'A contrata\u00e7\u00e3o e o gerenciamento do plano s\u00e3o feitos no ARGUS Web, na \u00e1rea de Monetiza\u00e7\u00e3o.' },
  { label: 'Atividade web', answer: 'A coleta começa desativada. Em Configurações, autorize a coleta e carregue Platform/browser-extension sem compactação em chrome://extensions ou edge://extensions. Configure bridgeKey e bridgePort a partir do config.json do agente. A extensão registra somente domínio e duração aproximada, não a URL completa nem o conteúdo da página.' },
  { label: 'Métricas de aplicativos', answer: 'No Windows, o watcher mede o tempo em que uma janela fica em primeiro plano com entrada recente; não lê títulos, documentos, teclas ou conteúdo. O histórico começa após a instalação do agente.' },
  { label: 'Métricas de aplicativos', answer: 'No Windows, o watcher mede o tempo em que uma janela fica em primeiro plano com entrada recente; não lê títulos, documentos, teclas ou conteúdo. O histórico começa após a instalação do agente.' },
  { label: 'Privacidade', answer: 'Use o ARGUS somente em computadores autorizados e informe as pessoas monitoradas. A coleta web exige consentimento separado e pode ser revogada em Configurações; ao revogar, o histórico web da conta é apagado.' },
  { label: 'Perfil compartilhado', answer: 'Web e Platform usam o mesmo perfil no banco ARGUS. Altere foto, nome ou e-mail em Configurações; a mudança aparece nas duas interfaces. A recuperação de senha também atualiza a conta compartilhada.' },
  { label: 'Tema claro e cinza', answer: 'Abra Configurações e escolha Escuro, Cinza ou Claro. O tema é salvo neste navegador e aplicado imediatamente.' },
];
function appendHelpMessage(message, kind = 'bot') {
  const node = document.createElement('div');
  node.className = `help-bot-message ${kind}`;
  node.textContent = message;
  $('#helpBotMessages').appendChild(node);
  $('#helpBotMessages').scrollTop = $('#helpBotMessages').scrollHeight;
}
function answerHelpQuestion(question) {
  const text = String(question || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/plano|assin|limite|compr|pagamento|upgrade/.test(text)) {
    const subscription = state.subscription?.assinatura || { plan: state.user?.plan || 'Free' };
    const limits = state.subscription?.limites || state.data?.plan || { computers: 10, retentionDays: 7, reports: false, alerts: false };
    const usage = state.subscription?.uso?.computadores ?? state.data?.usage?.computers ?? 0;
    return 'Sua conta está no plano ' + subscription.plan + ' e usa ' + usage + ' computador(es). O limite é ' + (limits.computers === null ? 'ilimitado' : limits.computers) + ', com retenção de ' + limits.retentionDays + ' dias. Abra “Planos e cobrança” no menu para comparar opções e simular um pagamento; a mesma assinatura vale para Web e Platform.';
  }
  if (/perfil|avatar|foto|email|nome/.test(text)) return helpTopics.find(topic => topic.label === 'Perfil compartilhado').answer;
  if (/tema|claro|cinza|escuro|aparencia/.test(text)) return helpTopics.find(topic => topic.label === 'Tema claro e cinza').answer;
  if (/banco|desconect|offline|sem rede|sem internet|enviar|fila|guardar|armazen/.test(text)) {
    return 'O agente coleta as leituras localmente e mantém uma fila local gravada em disco enquanto não alcança a API. Quando a conexão retorna, reenvia as amostras pendentes em ordem. A fila tem limite local; confira também se a API Platform e o MySQL voltaram a ficar disponíveis.';
  }
  if (/computador|conectar|vincular|endpoint/.test(text)) return helpTopics.find(topic => topic.label === 'Conectar computador').answer;
  if (/mysql|servidor|banco|api/.test(text)) return helpTopics.find(topic => topic.label === 'Servidor e MySQL').answer;
  if (/navega|dominio|web|extens/.test(text)) return helpTopics.find(topic => topic.label === 'Atividade web').answer;
  if (/aplic|processo|foreground|primeiro plano/.test(text)) return helpTopics.find(topic => topic.label === 'Métricas de aplicativos').answer;
  if (/privacidade|consent|termo|dados/.test(text)) return helpTopics.find(topic => topic.label === 'Privacidade').answer;
  if (/node|instal/.test(text)) return helpTopics.find(topic => topic.label === 'Erro no Node.js').answer;
  return 'Ainda não encontrei essa resposta na ajuda local. Posso orientar sobre planos, conexão de computadores, banco/API, coleta web, métricas de aplicativos e privacidade. Escolha um assunto ou tente outra pergunta.';
}
function initializeHelpBot() {
  const toggle = $('#helpBotToggle'), panel = $('#helpBotPanel'), close = $('#helpBotClose');
  const setOpen = open => { panel.classList.toggle('hidden', !open); toggle.setAttribute('aria-expanded', String(open)); };
  toggle.onclick = () => { const opening = panel.classList.contains('hidden'); setOpen(opening); if (opening && !$('#helpBotMessages').children.length) appendHelpMessage('Olá! Sou o assistente ARGUS para Web e Platform. Pergunte diretamente ou escolha um assunto para receber orientações rápidas.'); };
  close.onclick = () => setOpen(false);
  $('#helpBotForm').onsubmit = event => {
    event.preventDefault();
    const input = $('#helpBotInput'), question = input.value.trim();
    if (!question) return;
    appendHelpMessage(question, 'user');
    appendHelpMessage(answerHelpQuestion(question));
    input.value = '';
  };
  const topicLabels = new Set();
  helpTopics.forEach(topic => {
    if (topicLabels.has(topic.label)) return;
    topicLabels.add(topic.label);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'help-bot-topic'; button.textContent = topic.label;
    button.onclick = () => { appendHelpMessage(topic.label, 'user'); appendHelpMessage(answerHelpQuestion(topic.label)); };
    $('#helpBotTopics').appendChild(button);
  });
}
initializeHelpBot();

async function boot() {
  try { const result = await api('/api/auth/me'); state.user = result.user; enterApp(); }
  catch { showAuth(); }
}
setAuthMode('login');
boot();
