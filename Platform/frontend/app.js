const $ = s => document.querySelector(s);
const state = { user: null, data: null, page: 'dashboard', detailId: null, authMode: 'login', reportDays: 7 };
const TERMS_VERSION = '2026-09-v1';
const pages = { dashboard: 'Visão geral', computers: 'Computadores', activity: 'Atividades', applications: 'Aplicações', web: 'Navegação web', reports: 'Relatórios', alerts: 'Alertas', settings: 'Configurações' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = value => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtUptime = sec => { const h = Math.floor((Number(sec) || 0) / 3600), d = Math.floor(h / 24); return d ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((sec % 3600) / 60)}min`; };
async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && !url.startsWith('/api/auth/')) showAuth(); throw new Error(data.error || 'Não foi possível concluir a solicitação.'); }
  return data;
}
function showAuth() { $('#authView').classList.remove('hidden'); $('#appView').classList.add('hidden'); }
function showApp() { $('#authView').classList.add('hidden'); $('#appView').classList.remove('hidden'); }
function setAuthMode(mode) {
  state.authMode = mode; const signup = mode === 'signup';
  $('#authTitle').textContent = signup ? 'Criar sua conta' : 'Acesso seguro';
  $('#authSubtitle').textContent = signup ? 'Configure seu acesso ao console ARGUS.' : 'Entre para monitorar os dispositivos da sua rede.';
  $('#nameWrap').classList.toggle('hidden', !signup); $('#confirmWrap').classList.toggle('hidden', !signup);
  $('#confirmInput').required = signup; $('#nameInput').required = signup;
  $('#webConsentWrap').classList.toggle('hidden', !signup);
  $('#termsAccepted').checked = false; $('#webConsent').checked = false;
  $('#authSubmit').innerHTML = signup ? 'Criar conta <span>→</span>' : 'Entrar no console <span>→</span>';
  $('#switchText').textContent = signup ? 'Já possui acesso?' : 'Ainda não tem acesso?'; $('#authSwitch').textContent = signup ? 'Fazer login' : 'Criar conta'; $('#authError').classList.add('hidden');
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
function enterApp() {
  showApp(); $('#userName').textContent = state.user.name; $('#avatar').textContent = state.user.name.slice(0, 1).toUpperCase();
  refresh().then(render); connectSocket(); loadNetworkConfig(); render();
}
let socket;
function connectSocket() {
  if (!window.io) return;
  if (socket) socket.disconnect(); socket = io(); socket.on('update', () => { refresh().then(render); if (state.detailId) renderDetail(state.detailId); });
}
async function refresh() { try { state.data = await api('/api/dashboard'); } catch {} }
async function loadNetworkConfig() {
  try { const c = await api('/api/config'); $('#serverAddress').textContent = c.ips[0] ? `${c.ips[0]}:${c.port}` : `localhost:${c.port}`; } catch {}
}
$('#logoutButton').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); state.user = null; if (socket) socket.disconnect(); showAuth(); };
document.querySelectorAll('.nav-item').forEach(button => button.onclick = () => { state.page = button.dataset.page; state.detailId = null; document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b === button)); $('#pageCrumb').textContent = pages[state.page]; render(); document.querySelector('.sidebar').classList.remove('open'); });
$('#mobileMenu').onclick = () => $('.sidebar').classList.toggle('open');
function render() {
  if (!state.data) { $('#pageContent').innerHTML = '<div class="loading">Conectando ao servidor local…</div>'; return; }
  $('#navComputerCount').textContent = state.data.summary.total; $('#navAlertCount').textContent = state.data.summary.alerts;
  if (state.detailId) return renderDetail(state.detailId);
  $('#pageCrumb').textContent = pages[state.page];
  const renderPage = { dashboard: renderDashboard, computers: renderComputers, activity: renderActivity, applications: renderApplications, web: renderWeb, reports: renderReports, alerts: renderAlerts, settings: renderSettings }[state.page] || renderDashboard;
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
  const { summary, machines, events, alerts, applications = [] } = state.data;
  $('#pageContent').innerHTML = `${pageHead('MONITORAMENTO DA REDE', 'Visão geral', 'Estado e atividade dos dispositivos conectados à sua rede.', '<button class="button primary" data-pair>＋ <span>Adicionar computador</span></button>')}
    <div class="metric-grid">${metricCard('Computadores', summary.total, 'dispositivos', '▣', 'Registrados no ambiente')}${metricCard('Online', summary.online, 'ativos', '●', 'Heartbeat nos últimos 45s', 'green')}${metricCard('Offline', summary.offline, 'inativos', '◌', 'Sem comunicação recente', 'gray')}${metricCard('Alertas ativos', summary.alerts, 'abertos', '◇', 'CPU, memória e conexão', 'amber')}</div>
    <div class="content-grid"><section class="panel computers-panel"><div class="panel-heading"><div><h2>Computadores</h2><p>Endpoints registrados nesta conta</p></div><button class="button quiet" data-page="computers">Ver todos <span>→</span></button></div>${computerRows(machines.slice(0, 6))}</section><section class="panel activity-panel"><div class="panel-heading"><div><h2>Atividade recente</h2><p>Eventos recebidos pelo servidor</p></div><span class="tiny-live"><i></i> AO VIVO</span></div><div class="event-list">${eventMarkup(events)}</div></section></div>
    <div class="lower-grid"><section class="panel"><div class="panel-heading"><div><h2>Uso de recursos</h2><p>Visão atual dos endpoints online</p></div></div>${resourceBars(machines)}</section><section class="panel"><div class="panel-heading"><div><h2>Alertas</h2><p>Ocorrências que precisam de atenção</p></div><button class="button quiet" data-page="alerts">Ver alertas →</button></div>${alerts.length ? alerts.slice(0, 4).map(alertLine).join('') : '<div class="subtle-empty">Nenhum alerta ativo.</div>'}</section></div>
    <section class="panel app-overview"><div class="panel-heading"><div><h2>Aplicações identificadas</h2><p>Tempo aproximado agregado a partir dos heartbeats recebidos</p></div><button class="button quiet" data-page="applications">Ver aplicações →</button></div>${applications.length ? applications.slice(0,5).map(a => `<div class="app-summary-row"><b>${esc(a.name)}</b><span>${a.machineCount} ${a.machineCount===1?'máquina':'máquinas'}</span><span>${appDuration(a)} <small>estimados</small></span></div>`).join('') : '<div class="subtle-empty">Ainda não há amostras de aplicações dos agentes.</div>'}</section>`;
  bindPageActions();
}
function resourceBars(machines) {
  const active = machines.filter(m => m.status === 'online'); if (!active.length) return '<div class="subtle-empty">Métricas reais aparecerão após conectar um agente.</div>';
  return active.slice(0, 4).map(m => `<div class="resource-row"><div><b>${esc(m.name)}</b><span>${m.metrics?.cpu ?? 0}% CPU</span></div><div class="bar"><i style="width:${m.metrics?.cpu ?? 0}%"></i></div><div class="resource-meta"><span>RAM ${m.metrics?.ram ?? 0}%</span><span>Disco ${m.metrics?.disk ?? 0}%</span></div></div>`).join('');
}
function renderComputers() { $('#pageContent').innerHTML = `${pageHead('ENDPOINTS', 'Computadores', 'Dispositivos vinculados ao seu ambiente.', '<button class="button primary" data-pair>＋ <span>Adicionar computador</span></button>')}<section class="panel full-panel">${computerRows(state.data.machines)}</section>`; bindPageActions(); }
function renderActivity() { $('#pageContent').innerHTML = `${pageHead('LINHA DO TEMPO', 'Atividades', 'Eventos recentes enviados pelos agentes conectados.')}<section class="panel full-panel"><div class="event-list roomy">${eventMarkup(state.data.events)}</div></section>`; bindPageActions(); }
function renderApplications() {
  const apps = state.data.machines.flatMap(m => (m.apps || []).map(a => ({ ...a, machine: m.name, machineStatus:m.status }))).sort((a, b) => Date.parse(b.lastSeenAt)-Date.parse(a.lastSeenAt));
  $('#pageContent').innerHTML = `${pageHead('APLICAÇÕES OBSERVADAS', 'Aplicações', 'Identificação amigável e histórico aproximado com base nos processos amostrados pelos agentes.')}<section class="panel full-panel"><div class="notice">O tempo é uma estimativa entre amostras consecutivas do agente, limitada a intervalos de até 60 segundos. Não equivale a foco da janela ou uso ativo pela pessoa. O agente observa uma lista limitada de processos; “não observado” não confirma que o processo foi encerrado. Aplicações anteriores à implantação do histórico não têm duração disponível.</div>${apps.length ? `<div class="table-wrap"><table><thead><tr><th>APLICAÇÃO</th><th>COMPUTADOR</th><th>ESTADO</th><th>TEMPO ESTIMADO</th><th>VEZES IDENTIFICADA</th><th>ÚLTIMA IDENTIFICAÇÃO</th></tr></thead><tbody>${apps.map(a => `<tr><td><b>${esc(a.name)}</b><small class="process-subtitle">${esc(a.processName)}</small></td><td>${esc(a.machine)}</td><td><span class="app-state ${a.status==='running'&&a.machineStatus==='online'?'is-running':''}">${a.status==='running'&&a.machineStatus==='online'?'Em execução':'Não observada na amostra atual'}</span></td><td>${appDuration(a)}</td><td>${a.occurrences||'—'}</td><td>${fmtDate(a.lastSeenAt)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><div class="empty-icon">▧</div><b>Sem aplicações identificadas</b><p>Quando um agente estiver conectado, os processos amostrados aparecerão aqui.</p></div>'}</section><section class="panel web-note"><div class="panel-heading"><div><h2>Navegação web</h2><p>Coleta opcional via extensão autorizada</p></div></div><p>Habilite o consentimento em Configurações e instale ARGUS Web no navegador do endpoint. <button class="text-button" data-page="web">Ver atividade web →</button></p></section>`; bindPageActions();
}
function durationLabel(seconds) { const value=Math.max(0,Number(seconds)||0); if(value>0&&value<60)return '<1 min'; const minutes=Math.floor(value/60); return minutes<60?`${minutes} min`:`${Math.floor(minutes/60)}h ${minutes%60}min`; }
function appDuration(app) { return Number(app.durationSeconds)>0 ? durationLabel(app.durationSeconds) : 'Amostras insuficientes'; }
function renderWeb() {
  const items=state.data.webActivity||[];
  const action=state.user.webConsent?'<span class="consent-on"><i></i> COLETA AUTORIZADA</span>':'<span class="consent-off">COLETA DESATIVADA</span>';
  $('#pageContent').innerHTML=`${pageHead('DOMÍNIOS E TEMPO APROXIMADO','Navegação web','A extensão registra domínios de abas ativas, somente com consentimento.',action)}<section class="panel full-panel"><div class="notice">O protótipo armazena o domínio, dispositivo, duração aproximada e horário. Não armazena URL completa, caminho, busca ou conteúdo da página. A extensão precisa estar instalada e ativada em cada navegador monitorado.</div>${items.length?`<div class="table-wrap"><table><thead><tr><th>DOMÍNIO</th><th>COMPUTADOR</th><th>TEMPO ATIVO</th><th>AMOSTRAS</th><th>ÚLTIMA ATIVIDADE</th></tr></thead><tbody>${items.map(w=>`<tr><td><b>${esc(w.domain)}</b></td><td>${esc(w.machineName)}</td><td>${durationLabel(w.durationSeconds)}</td><td>${w.visits}</td><td>${fmtDate(w.lastSeen)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><div class="empty-icon">◎</div><b>Nenhuma atividade web recebida</b><p>Ative o consentimento em Configurações e instale a extensão autorizada no navegador do endpoint.</p><button class="button quiet" data-page="settings">Configurar coleta →</button></div>'}</section>`;bindPageActions();
}
function renderSettings() {
  $('#pageContent').innerHTML=`${pageHead('PRIVACIDADE E AMBIENTE','Configurações','Gerencie consentimento, dados e conexão do protótipo.')}<div class="lower-grid"><section class="panel settings-panel"><div class="panel-heading"><div><h2>Coleta de navegação web</h2><p>Preferência e revogação de consentimento</p></div></div><label class="toggle-row"><span><b>Permitir coleta web</b><small>Domínios e duração aproximada das abas ativas, via extensão.</small></span><input id="webConsentToggle" type="checkbox" ${state.user.webConsent?'checked':''}></label><p class="privacy-help">Ao desativar, o agente deixa de aceitar novos dados e o histórico de navegação guardado será eliminado.</p><div class="notice">Em cada navegador: abra <b>chrome://extensions</b> → ative o modo do desenvolvedor → carregue sem compactação a pasta <code>browser-extension</code>. Depois abra a extensão, cole o <code>bridgeKey</code> mostrado em <code>agent/config.json</code>, confirme que os titulares foram informados e ative a coleta. Repita em cada PC monitorado.</div></section><section class="panel settings-panel"><div class="panel-heading"><div><h2>Seus dados</h2><p>Exportação e exclusão local</p></div></div><p class="privacy-help">Exporte uma cópia dos registros da sua conta ou remova a conta e seus dispositivos do banco MySQL.</p><div class="settings-actions"><button id="exportData" class="button quiet">Baixar meus dados (JSON)</button><button id="deleteAccount" class="button danger">Excluir conta e dados</button></div><a class="terms-link" href="/terms.html" target="_blank">Ler Termos de Uso e Aviso de Privacidade ↗</a></section></div>`;
  $('#webConsentToggle').onchange=async e=>{try{const result=await api('/api/privacy/web-consent',{method:'POST',body:JSON.stringify({enabled:e.target.checked})});state.user.webConsent=result.webConsent;await refresh();toast(result.webConsent?'Coleta web habilitada. Configure a extensão nos endpoints.':'Consentimento revogado e histórico web eliminado.');render();}catch(error){e.target.checked=state.user.webConsent;toast(error.message);}};
  $('#exportData').onclick=async()=>{try{const data=await api('/api/privacy/export');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='argus-meus-dados.json';link.click();URL.revokeObjectURL(link.href);}catch(e){toast(e.message);}};
  $('#deleteAccount').onclick=async()=>{if(!confirm('Excluir sua conta e todos os dispositivos e registros associados? Esta ação não pode ser desfeita.'))return;try{await api('/api/privacy/delete-account',{method:'POST',body:'{}'});state.user=null;state.data=null;if(socket)socket.disconnect();showAuth();toast('Conta e dados excluídos.');}catch(e){toast(e.message);}};
}
function alertLine(a) { return `<div class="alert-row"><span class="alert-symbol ${esc(a.kind)}">${a.kind === 'cpu' ? '↗' : a.kind === 'offline' ? '⌁' : '◇'}</span><div><b>${esc(a.message)}</b><small>${esc(a.machineName)} · ${fmtDate(a.at)}</small></div><button class="text-button" data-ack="${esc(a.id)}">Reconhecer</button></div>`; }
function renderAlerts() { $('#pageContent').innerHTML = `${pageHead('SAÚDE DO AMBIENTE', 'Alertas', 'Limites de recursos e mudanças no estado de conexão.')}<section class="panel full-panel">${state.data.alerts.length ? state.data.alerts.map(alertLine).join('') : '<div class="empty-state"><div class="empty-icon">◇</div><b>Nenhum alerta ativo</b><p>Alertas aparecerão aqui quando a CPU superar 85%, a RAM 90% ou um dispositivo ficar offline.</p></div>'}</section>`; bindPageActions(); document.querySelectorAll('[data-ack]').forEach(b => b.onclick = async () => { await api(`/api/alerts/${b.dataset.ack}/ack`, { method: 'POST' }); await refresh(); render(); }); }
async function renderReports() {
  $('#pageContent').innerHTML = `${pageHead('DADOS DO AMBIENTE', 'Relatórios', 'Resumo do histórico realmente armazenado pelo servidor.', `<select id="reportRange" class="select"><option value="1">Hoje</option><option value="7" selected>Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select>`)}<div id="reportBody" class="loading">Carregando histórico…</div>`;
  const load = async days => {
    state.reportDays = days;
    try {
      const report = await api(`/api/reports?days=${days}`), online = report.machines.filter(m => m.status === 'online').length;
      $('#reportBody').innerHTML = `<div class="metric-grid">${metricCard('Computadores', report.machines.length, 'registrados', '▣', 'No ambiente')}${metricCard('Eventos', report.events.length, 'registrados', '◷', `Nos últimos ${days} dia(s)`, 'blue')}${metricCard('Alertas', report.alerts.length, 'ocorrências', '◇', 'No período', 'amber')}${metricCard('Ativos agora', online, 'online', '●', 'Heartbeat recente', 'green')}</div><div class="lower-grid"><section class="panel"><div class="panel-heading"><div><h2>Resumo por computador</h2><p>Status e última comunicação</p></div></div>${computerRows(report.machines)}</section><section class="panel"><div class="panel-heading"><div><h2>Eventos do período</h2><p>Histórico recebido e persistido</p></div></div><div class="event-list">${eventMarkup(report.events)}</div></section></div><section class="panel web-note"><div class="panel-heading"><div><h2>Atividade web</h2><p>Domínios e tempo em abas ativas</p></div></div>${report.webActivity.length ? `<div class="table-wrap"><table><thead><tr><th>DOMÍNIO</th><th>DISPOSITIVO</th><th>TEMPO ATIVO</th><th>AMOSTRAS</th></tr></thead><tbody>${report.webActivity.map(w => `<tr><td><b>${esc(w.domain)}</b></td><td>${esc(w.machineName)}</td><td>${durationLabel(w.durationSeconds)}</td><td>${w.visits}</td></tr>`).join('')}</tbody></table></div>` : '<div class="subtle-empty">Nenhuma atividade web no período.</div>'}</section>`; bindPageActions();
    } catch (e) { $('#reportBody').textContent = e.message; }
  };
  $('#reportRange').value = String(state.reportDays); $('#reportRange').onchange = e => load(Number(e.target.value)); load(state.reportDays);
}
function bindPageActions() {
  document.querySelectorAll('[data-pair]').forEach(b => b.onclick = showPairModal);
  document.querySelectorAll('[data-page]').forEach(b => { if (b.classList.contains('quiet')) b.onclick = () => { state.page = b.dataset.page; state.detailId = null; document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === state.page)); render(); }; });
  document.querySelectorAll('[data-machine]').forEach(row => row.onclick = () => { state.detailId = row.dataset.machine; renderDetail(state.detailId); });
}
async function showPairModal() {
  let pairing; try { pairing = await api('/api/pairings', { method: 'POST', body: '{}' }); } catch (e) { return toast(e.message); }
  const net = await api('/api/config').catch(() => ({ ips: [], port: 3000 }));
  const serverUrl = `http://${net.ips[0] || 'IP-DO-ADMIN'}:${net.port}`;
  const installerQuery = `server=${encodeURIComponent(serverUrl)}&code=${encodeURIComponent(pairing.code)}`;
  const modal = document.createElement('div'); modal.className = 'modal-backdrop'; modal.innerHTML = `<div class="modal"><button class="modal-close" aria-label="Fechar">×</button><div class="eyebrow">VINCULAR ENDPOINT</div><h2>Adicionar computador</h2><p>Baixe e execute o ARGUS.cmd. O comando obtém automaticamente os componentes necessários; servidor e código já ficam preenchidos.</p><div class="pair-code">${esc(pairing.code)}</div><div class="copy-row"><div class="copy-value">${esc(serverUrl)}</div><button class="button quiet" id="copyAddress">Copiar</button></div><div class="installer-actions"><a class="button primary" href="/downloads/ARGUS.cmd?${installerQuery}">Baixar ARGUS.cmd</a></div><div class="steps"><b>1.</b><span>Execute <code>ARGUS.cmd</code> no endpoint. No menu, escolha <b>1</b> para instalar/conectar o agente. O comando instala Node.js LTS via winget quando necessário.</span></div><details class="advanced-setup"><summary>Configuração avançada para desenvolvedores</summary><pre>{
  "serverUrl": "http://${esc(net.ips[0] || 'IP-DO-ADMIN')}:${net.port}",
  "connectionCode": "${esc(pairing.code)}",
  "heartbeatSeconds": 10
}</pre></details><div class="pair-expiry"><i class="pulse"></i> Código expira em 15 minutos e é válido para um computador.</div><div class="modal-footer"><span id="pairStatus">Aguardando o primeiro sinal do agente…</span><button class="button primary" id="donePair">Concluído</button></div></div>`;
  document.body.appendChild(modal); modal.querySelector('.modal-close').onclick = () => modal.remove(); modal.querySelector('#donePair').onclick = () => modal.remove();
  modal.querySelector('#copyAddress').onclick = async () => { await navigator.clipboard?.writeText(`http://${net.ips[0] || 'IP-DO-ADMIN'}:${net.port}`); toast('Endereço copiado.'); };
  if (socket) socket.once('update', () => { modal.querySelector('#pairStatus').textContent = 'Computador conectado. Ele já aparece na lista.'; });
}
async function renderDetail(machineId) {
  try {
    const data = await api(`/api/machines/${machineId}`); const m = data.machine;
    const web = data.webActivity || [];
    const runningApps = (m.apps || []).filter(a => a.status === 'running' && m.status === 'online');
    const recentApps = (m.apps || []).slice(0, 8);
    $('#pageContent').innerHTML = `<button class="back-link" id="backMachines">← Voltar aos computadores</button>${pageHead('DETALHE DO ENDPOINT', esc(m.name), `${esc(m.userName || 'Usuário não identificado')} · ${esc(m.os || 'Sistema aguardando dados')}`, statusBadge(m))}<div class="metric-grid">${metricCard('CPU', m.metrics?.cpu ?? 0, '%', '⌁', 'Uso atual do processador', 'blue')}${metricCard('Memória', m.metrics?.ram ?? 0, '%', '▤', `${fmtBytes(m.metrics?.memoryUsed)} de ${fmtBytes(m.metrics?.memoryTotal)}`, 'green')}${metricCard('Disco', m.metrics?.disk ?? 0, '%', '▧', 'Uso do volume principal', 'amber')}${metricCard('Tempo ligado', fmtUptime(m.uptime), '', '◷', `Último sinal: ${fmtDate(m.lastSeen)}`, 'gray')}</div><div class="lower-grid"><section class="panel"><div class="panel-heading"><div><h2>Processos atuais</h2><p>Amostra mais recente do agente</p></div></div>${runningApps.length ? `<div class="process-list">${runningApps.map(a => `<div><b>${esc(a.name)}</b><span>${a.cpu==null?'CPU —':`${Number(a.cpu).toFixed(1)}% CPU`}</span><span>${a.memory} MB</span></div>`).join('')}</div>` : '<div class="subtle-empty">Nenhum processo ativo identificado no último sinal.</div>'}<div class="panel-heading app-history-heading"><div><h2>Aplicações recentes</h2><p>Tempo aproximado entre amostras, limitado a 60 s por intervalo</p></div></div>${recentApps.length ? recentApps.map(a => `<div class="app-summary-row"><b>${esc(a.name)}</b><span>${a.status==='running'&&m.status==='online'?'Em execução':'Não observada na amostra atual'}</span><span>${appDuration(a)}</span></div>`).join('') : '<div class="subtle-empty">Histórico ainda indisponível.</div>'}</section><section class="panel"><div class="panel-heading"><div><h2>Atividade web recente</h2><p>${esc(m.webActivity || 'Aguardando configuração')}</p></div></div>${web.length ? web.slice(0,8).map(w => `<div class="resource-row"><div><b>${esc(w.domain)}</b><span>${durationLabel(w.durationSeconds)}</span></div><div class="resource-meta"><span>${w.visits} amostras</span><span>${fmtDate(w.lastSeen)}</span></div></div>`).join('') : '<div class="subtle-empty">Sem atividade web registrada. Confira consentimento e extensão.</div>'}</section></div><section class="panel full-panel detail-events"><div class="panel-heading"><div><h2>Histórico do dispositivo</h2><p>Eventos operacionais e aplicações identificadas</p></div></div><div class="event-list">${eventMarkup(data.events)}</div></section>`;
    $('#backMachines').onclick = () => { state.detailId = null; state.page = 'computers'; document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'computers')); render(); };
  } catch (e) { toast(e.message); state.detailId = null; render(); }
}
function fmtBytes(bytes) { if (!bytes) return '—'; return `${(bytes / 1073741824).toFixed(1)} GB`; }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2800); }
async function boot() {
  try { const result = await api('/api/auth/me'); state.user = result.user; enterApp(); }
  catch { showAuth(); }
}
setAuthMode('login');
boot();
