require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const os = require('os');
const mysqlStore = require('../database/mysql');

const TERMS_VERSION = '2026-09-v1';
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const OFFLINE_TIMEOUT_MS = Number(process.env.OFFLINE_TIMEOUT_MS || 45000);
const OFFLINE_CHECK_INTERVAL_MS = Number(process.env.OFFLINE_CHECK_INTERVAL_MS || 10000);
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let db;
const sessions = new Map();

function id() { return crypto.randomUUID(); }
function safeUser(user) { return { id: user.id, name: user.name, email: user.email, webConsent: Boolean(user.webConsent), termsVersion: user.termsVersion || null }; }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') }; }
function cookie(name, value, maxAge) { return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
function sessionToken(req) { const t = (req.headers.cookie || '').match(/(?:^|;\s*)argus_session=([^;]+)/)?.[1]; try { return t ? decodeURIComponent(t) : null; } catch { return null; } }
async function auth(req, res, next) {
  try {
    const token = sessionToken(req);
    if (!token) return res.status(401).json({ error: 'Sessão não informada.' });
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    const user = await mysqlStore.findSessionUser(digest);
    if (!user) {
      sessions.delete(token);
      return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    }
    sessions.set(token, user.id);
    let cachedUser = db.users.find(entry => entry.id === user.id);
    if (!cachedUser) {
      await mysqlStore.refreshUsers(db);
      cachedUser = db.users.find(entry => entry.id === user.id);
    }
    if (cachedUser) {
      cachedUser.name = user.name;
      cachedUser.email = user.email;
      cachedUser.webConsent = user.webConsent;
      cachedUser.termsVersion = user.termsVersion;
    }
    req.user = cachedUser || user;
    next();
  } catch (error) {
    next(error);
  }
}
function addEvent(machine, type, message) {
  db.events.unshift({ id: id(), machineId: machine.id, machineName: machine.name, type, message, at: new Date().toISOString() });
  db.events.length = Math.min(db.events.length, 500);
}
function publicMachine(machine) { const { token, ...visible } = machine; return visible; }
function clamp(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; }
function ownerForMachine(machineId) { const machine = db.machines.find(m => m.id === machineId); return machine && db.users.find(u => u.id === machine.userId); }
const APP_NAMES = Object.freeze({
  chrome:'Google Chrome', msedge:'Microsoft Edge', firefox:'Mozilla Firefox', firefoxesr:'Mozilla Firefox ESR', brave:'Brave Browser', opera:'Opera', opera_gx:'Opera GX', vivaldi:'Vivaldi', browser:'Chromium Browser', chromium:'Chromium', chromium_browser:'Chromium Browser', waterfox:'Waterfox', librewolf:'LibreWolf', zen:'Zen Browser', arc:'Arc Browser', safari:'Safari', tor:'Tor Browser', thorium:'Thorium Browser', yandex:'Yandex Browser', floorp:'Floorp Browser', maxthon:'Maxthon Browser', palemoon:'Pale Moon', seamonkey:'SeaMonkey', iexplore:'Internet Explorer', webviewhost:'Microsoft Edge WebView2', msedgewebview2:'Microsoft Edge WebView2',
  winword:'Microsoft Word', excel:'Microsoft Excel', powerpnt:'Microsoft PowerPoint', outlook:'Microsoft Outlook', outlooknew:'Microsoft Outlook', teams:'Microsoft Teams', 'ms-teams':'Microsoft Teams', onenote:'Microsoft OneNote', onenotem:'Microsoft OneNote', onedrive:'Microsoft OneDrive', onedrive_sync:'Microsoft OneDrive', msaccess:'Microsoft Access', mspub:'Microsoft Publisher', visio:'Microsoft Visio', winproj:'Microsoft Project', lync:'Microsoft Lync', groove:'Microsoft OneDrive', officeclicktorun:'Microsoft Office Click-to-Run', officec2rclient:'Microsoft Office Click-to-Run', soffice:'LibreOffice', swriter:'LibreOffice Writer', scalc:'LibreOffice Calc', simpress:'LibreOffice Impress', sdraw:'LibreOffice Draw', sbase:'LibreOffice Base', smath:'LibreOffice Math', libreoffice:'LibreOffice', wps:'WPS Office', wpp:'WPS Presentation', et:'WPS Spreadsheets', wpspdf:'WPS PDF', onlyoffice:'ONLYOFFICE',
  code:'Visual Studio Code', code_insiders:'Visual Studio Code Insiders', devenv:'Visual Studio', rider64:'JetBrains Rider', idea64:'IntelliJ IDEA', pycharm64:'PyCharm', webstorm64:'WebStorm', phpstorm64:'PhpStorm', clion64:'CLion', goland64:'GoLand', datagrip64:'DataGrip', rubymine64:'RubyMine', appcode:'AppCode', studio64:'Android Studio', cursor:'Cursor', windsurf:'Windsurf', zed:'Zed Editor', sublime_text:'Sublime Text', notepadplusplus:'Notepad++', notepad:'Bloco de Notas', notepad_:'Bloco de Notas', atom:'Atom Editor', brackets:'Brackets Editor', lapce:'Lapce Editor', geany:'Geany', kate:'Kate Editor', gedit:'GNOME Text Editor', mousepad:'Mousepad', vim:'Vim', gvim:'GVim', nvim:'Neovim', emacs:'Emacs', idle:'Python IDLE', spyder:'Spyder IDE', eclipse:'Eclipse IDE', netbeans:'Apache NetBeans', bluej:'BlueJ', qtcreator:'Qt Creator', codeblocks:'Code::Blocks', clion:'CLion', devcpp:'Dev-C++', xcode:'Xcode', unity:'Unity Editor', unityhub:'Unity Hub', unreal:'Unreal Editor', godot:'Godot Engine', blender:'Blender', robloxstudio:'Roblox Studio',
  node:'Node.js', nodejs:'Node.js', npm:'Node Package Manager', pnpm:'pnpm', yarn:'Yarn', bun:'Bun', deno:'Deno', python:'Python', pythonw:'Python', python3:'Python', py:'Python Launcher', java:'Java Runtime', javaw:'Java Runtime', javac:'Java Compiler', dotnet:'Microsoft .NET', dotnet_host:'Microsoft .NET', wsl:'Windows Subsystem for Linux', wslhost:'Windows Subsystem for Linux', docker:'Docker', dockerd:'Docker Engine', dockerdesktop:'Docker Desktop', com_docker_backend:'Docker Desktop', podman:'Podman', kubectl:'Kubernetes CLI', git:'Git', gitbash:'Git Bash', ssh:'OpenSSH', putty:'PuTTY', winscp:'WinSCP', filezilla:'FileZilla', postman:'Postman', insomnia:'Insomnia', bruno:'Bruno API Client', dbeaver:'DBeaver', mysqlworkbench:'MySQL Workbench', pgadmin:'pgAdmin', redisinsight:'Redis Insight', mongodbcompass:'MongoDB Compass', heidisql:'HeidiSQL', tableplus:'TablePlus', workbench:'MySQL Workbench',
  discord:'Discord', slack:'Slack', zoom:'Zoom Workplace', zoomworkplace:'Zoom Workplace', zoomus:'Zoom Workplace', skype:'Skype', whatsapp:'WhatsApp', whatsappbeta:'WhatsApp', telegram:'Telegram', signal:'Signal', viber:'Viber', teamspeak:'TeamSpeak', ts3client_win64:'TeamSpeak 3', mumble:'Mumble', guilded:'Guilded', element:'Element', mattermost:'Mattermost', wire:'Wire', webex:'Cisco Webex', webexmta:'Cisco Webex', lync:'Microsoft Lync', meet:'Google Meet',
  spotify:'Spotify', spotifywebhelper:'Spotify', vlc:'VLC media player', vlc_media_player:'VLC media player', wmplayer:'Windows Media Player', music:'Windows Media Player', groove:'Windows Media Player', itunes:'Apple Music', apple_music:'Apple Music', apple_music_classical:'Apple Music Classical', musicbee:'MusicBee', foobar2000:'foobar2000', audacity:'Audacity', reaper:'REAPER', ableton:'Ableton Live', flstudio:'FL Studio', obs64:'OBS Studio', obs32:'OBS Studio', obs:'OBS Studio', streamlabs:'Streamlabs Desktop', streamlabsobs:'Streamlabs Desktop', xsplit:'XSplit Broadcaster', ndi:'NDI Tools', davinciresolve:'DaVinci Resolve', premierepro:'Adobe Premiere Pro', afterfx:'Adobe After Effects', photoshop:'Adobe Photoshop', illustrator:'Adobe Illustrator', indesign:'Adobe InDesign', lightroom:'Adobe Lightroom', acrobat:'Adobe Acrobat', acrobatreader:'Adobe Acrobat Reader', foxitreader:'Foxit PDF Reader', gimp:'GIMP', inkscape:'Inkscape', krita:'Krita', paintdotnet:'Paint.NET', affinityphoto2:'Affinity Photo', affinitydesigner2:'Affinity Designer', figma:'Figma', canva:'Canva',
  explorer:'Explorador de Arquivos', searchhost:'Pesquisa do Windows', searchapp:'Pesquisa do Windows', searchindexer:'Indexador de Pesquisa do Windows', startmenuexperiencehost:'Menu Iniciar do Windows', shellexperiencehost:'Experiência do Shell do Windows', textinputhost:'Entrada de Texto do Windows', ctfmon:'Serviço de Texto do Windows', taskmgr:'Gerenciador de Tarefas', control:'Painel de Controle', systemsettings:'Configurações do Windows', applicationframehost:'Aplicativos do Windows', runtimebroker:'Runtime Broker do Windows', backgroundtaskhost:'Host de Tarefas em Segundo Plano do Windows', smartscreen:'Microsoft Defender SmartScreen', securityhealthsystray:'Segurança do Windows', securityhealthservice:'Segurança do Windows', msmpeng:'Microsoft Defender Antivirus', mpcmdrun:'Microsoft Defender Antivirus', msascuil:'Segurança do Windows', windowsdefender:'Microsoft Defender', defender:'Microsoft Defender', dwm:'Gerenciador de Janelas da Área de Trabalho', winlogon:'Logon do Windows', logonui:'Tela de Logon do Windows', lsass:'Autoridade de Segurança Local do Windows', services:'Serviços do Windows', svchost:'Host de Serviço do Windows', csrss:'Processo de Sistema do Windows', wininit:'Inicialização do Windows', smss:'Gerenciador de Sessão do Windows', system:'Kernel do Windows', registry:'Registro do Windows', audiodg:'Isolamento de Gráfico de Áudio do Windows', spoolsv:'Spooler de Impressão do Windows', wudfhost:'Driver Foundation do Windows', dllhost:'COM Surrogate do Windows', rundll32:'Processo de Biblioteca do Windows', taskhostw:'Host de Tarefas do Windows', conhost:'Host do Console do Windows', cmd:'Prompt de Comando', powershell:'Windows PowerShell', pwsh:'PowerShell', windowsterminal:'Terminal do Windows', wt:'Terminal do Windows', openconsole:'Terminal do Windows', mmc:'Console de Gerenciamento do Windows', regedit:'Editor do Registro do Windows', mstsc:'Conexão de Área de Trabalho Remota', quickassist:'Assistência Rápida do Windows', magnify:'Lupa do Windows', narrator:'Narrador do Windows', osk:'Teclado Virtual do Windows', snippingtool:'Ferramenta de Captura do Windows', screenclippinghost:'Captura de Tela do Windows', photos:'Fotos do Windows', mspaint:'Paint', calculator:'Calculadora do Windows', calc:'Calculadora do Windows', notepad:'Bloco de Notas', write:'WordPad', charmap:'Mapa de Caracteres do Windows', stikynot:'Notas Autoadesivas', sticky_notes:'Notas Autoadesivas', clock:'Relógio do Windows', weather:'Clima do Windows', widgets:'Widgets do Windows', phoneexperiencehost:'Vincular ao Celular', yourphone:'Vincular ao Celular', crossdeviceresume:'Experiências entre Dispositivos',
  systemd:'systemd', systemd_journald:'systemd Journal', gnome_shell:'GNOME Shell', gnome_terminal:'Terminal GNOME', konsole:'Konsole Terminal', plasma:'KDE Plasma', kwin:'KDE Window Manager', xfce4_session:'Sessão XFCE', xfwm4:'Gerenciador de Janelas XFCE', cinnamon:'Cinnamon Desktop', mate_session:'MATE Desktop', xorg:'Servidor X.Org', Xorg:'Servidor X.Org', wayland:'Wayland Display Server', xwayland:'XWayland', nautilus:'Arquivos GNOME', dolphin:'Dolphin File Manager', thunar:'Thunar File Manager', nemo:'Nemo File Manager', caja:'Caja File Manager', gnome_control_center:'Configurações GNOME', gnome_software:'GNOME Software', packagekitd:'PackageKit', apt:'APT Package Manager', dpkg:'Debian Package Manager', snapd:'Snap Package Manager', flatpak:'Flatpak', discover:'KDE Discover', firefox_esr:'Mozilla Firefox ESR',
  steam:'Steam', steamwebhelper:'Steam', epicgameslauncher:'Epic Games Launcher', goggalaxy:'GOG Galaxy', galaxyclient:'GOG Galaxy', battle:'Battle.net', battle_net:'Battle.net', riotclientservices:'Riot Client', riotclientux:'Riot Client', leagueclient:'League of Legends', valorant:'VALORANT', vanguard:'Riot Vanguard', ubisoftconnect:'Ubisoft Connect', upc:'Ubisoft Connect', origin:'EA app', eadesktop:'EA app', eaapp:'EA app', eaanticheat:'EA AntiCheat', epic:'Epic Games Launcher', minecraftlauncher:'Minecraft Launcher', minecraft:'Minecraft', robloxplayerbeta:'Roblox', r5apex:'Apex Legends', cs2:'Counter-Strike 2', csgo:'Counter-Strike: Global Offensive', dota2:'Dota 2', overwatch:'Overwatch', overwatch2:'Overwatch 2', fortnite:'Fortnite', destiny2:'Destiny 2', gw2:'Guild Wars 2', warframe:'Warframe', genshinimpact:'Genshin Impact', honkai:'Honkai: Star Rail', hoyoplay:'HoYoPlay', ff14:'Final Fantasy XIV', ffxiv_dx11:'Final Fantasy XIV', wow:'World of Warcraft', wowclassic:'World of Warcraft Classic', eldenring:'Elden Ring', cyberpunk2077:'Cyberpunk 2077',
  dropbox:'Dropbox', googledrivesync:'Google Drive', google_drive:'Google Drive', drivefs:'Google Drive', googledrivefs:'Google Drive', box:'Box Drive', boxdrive:'Box Drive', icloud:'iCloud', icloudservices:'iCloud', nextcloud:'Nextcloud', syncthing:'Syncthing', mega:'MEGA', megasync:'MEGA', resilio:'Resilio Sync', synologydrive:'Synology Drive',
  teamviewer:'TeamViewer', anydesk:'AnyDesk', rustdesk:'RustDesk', parsec:'Parsec', remotedesktop:'Microsoft Remote Desktop', remoting_host:'Chrome Remote Desktop', chromeremotedesktop:'Chrome Remote Desktop', ultraviewer:'UltraViewer', vncviewer:'VNC Viewer', tvnviewer:'TightVNC Viewer', vncserver:'VNC Server',
  qttabbar:'QTTabBar', '7zfm':'7-Zip File Manager', '7zg':'7-Zip', winrar:'WinRAR', bandizip:'Bandizip', peazip:'PeaZip', everything:'Everything Search', wiztree:'WizTree', windirstat:'WinDirStat', treesize:'TreeSize', powertoys:'Microsoft PowerToys', powertoys_fancyzones:'Microsoft PowerToys FancyZones', powertoys_run:'Microsoft PowerToys Run', sharex:'ShareX', greenshot:'Greenshot', lightshot:'Lightshot', 'f.lux':'f.lux', flux:'f.lux', powertoys_colorpicker:'Microsoft PowerToys Color Picker',
  avast:'Avast Antivirus', avg:'AVG Antivirus', avgui:'AVG Antivirus', avguard:'Avira Antivirus', avira:'Avira Antivirus', mcshield:'McAfee Antivirus', mcafee:'McAfee Security', nortonsecurity:'Norton Security', norton:'Norton Security', kaspersky:'Kaspersky', avp:'Kaspersky Antivirus', eset:'ESET Security', egui:'ESET Security', ekrn:'ESET Service', bitdefender:'Bitdefender', bdagent:'Bitdefender', sophos:'Sophos Endpoint', sentinelagent:'SentinelOne', sentinelone:'SentinelOne', crowdstrike:'CrowdStrike Falcon', csfalconservice:'CrowdStrike Falcon', malwarebytes:'Malwarebytes', mbam:'Malwarebytes', windefend:'Microsoft Defender Antivirus',
  obsidian:'Obsidian', notion:'Notion', evernote:'Evernote', todoist:'Todoist', trello:'Trello', clickup:'ClickUp', asana:'Asana', jira:'Jira', confluence:'Confluence', linear:'Linear', postman:'Postman', notion_calendar:'Notion Calendar',
});
function friendlyAppName(processName) { const key = String(processName || '').toLowerCase().replace(/\.exe$/, ''); return APP_NAMES[key] || key.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Aplicação sem identificação'; }
function updateApplicationSnapshot(machine, processes, foregroundUsage, foregroundApp, foregroundBatchId, foregroundTelemetryAvailable, now) {
  const retainAfter = Date.now() - 90 * 86400000;
  const history = Array.isArray(machine.apps) ? machine.apps : [];
  for (const app of history) {
    if (!app.processName) { app.processName = String(app.name || ''); app.name = friendlyAppName(app.processName); app.status = 'not_observed'; app.durationSeconds = 0; app.occurrences = 0; app.lastSeenAt = machine.lastSeen || now; }
    app.durationSeconds = 0;
    app.occurrences = 0;
    delete app.dailyUsage;
    app.foregroundDailyUsage = Array.isArray(app.foregroundDailyUsage) ? app.foregroundDailyUsage.filter(day => Date.parse(`${day.date}T00:00:00Z`) >= retainAfter) : [];
    app.foregroundDurationMilliseconds = Math.max(0, Number(app.foregroundDurationMilliseconds) || 0);
    app.foregroundOccurrences = Math.max(0, Number(app.foregroundOccurrences) || 0);
    app.foregroundBatchIds = Array.isArray(app.foregroundBatchIds) ? app.foregroundBatchIds.slice(-128) : [];
    app.timeType = foregroundTelemetryAvailable ? 'tempo observado em primeiro plano pelo Windows' : 'medição foreground indisponível neste sistema';
  }
  const active = new Map(history.filter(a => a.status === 'running').map(a => [String(a.processName || a.name).toLowerCase(), a]));
  const detected = new Set();
  for (const item of Array.isArray(processes) ? processes.slice(0, 25) : []) {
    const processName = String(item.processName || item.name || '').replace(/\.exe$/i, '').slice(0, 100);
    const key = processName.toLowerCase(); if (!key || detected.has(key)) continue; detected.add(key);
    let app = history.find(a => String(a.processName || a.name).toLowerCase() === key);
    const isNewSession = !active.has(key) || active.get(key).status !== 'running';
    if (!app) { app = { processName, name: friendlyAppName(processName), durationSeconds: 0, occurrences: 0, foregroundDurationMilliseconds: 0, foregroundOccurrences: 0, foregroundDailyUsage: [], foregroundBatchIds: [], firstSeenAt: now, lastSeenAt: now, status: 'running', cpu: 0, memory: 0, timeType: foregroundTelemetryAvailable ? 'tempo observado em primeiro plano pelo Windows' : 'medição foreground indisponível neste sistema' }; history.push(app); }
    app.processName = processName; app.name = friendlyAppName(processName); app.status = 'running'; app.cpu = Number.isFinite(Number(item.cpu)) ? Number(item.cpu) : null; app.memory = Number(item.memory) || 0;
    if (isNewSession) app.firstSeenAt = now;
    app.lastSeenAt = now;
    if (isNewSession) addEvent(machine, 'application', `Aplicação identificada: ${app.name}`);
  }
  for (const item of Array.isArray(foregroundUsage) ? foregroundUsage.slice(0, 100) : []) {
    const processName = String(item.processName || '').replace(/\.exe$/i, '').trim().slice(0, 100);
    const date = String(item.date || '');
    const durationMilliseconds = Math.floor(Number(item.durationMilliseconds));
    const occurrences = Math.floor(Number(item.occurrences));
    const dateTimestamp = Date.parse(`${date}T00:00:00Z`);
    if (typeof foregroundBatchId !== 'string' || !/^[\da-f-]{36}$/i.test(foregroundBatchId) || !processName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(dateTimestamp) || new Date(dateTimestamp).toISOString().slice(0, 10) !== date || dateTimestamp < retainAfter || dateTimestamp > Date.now() + 86400000 || !Number.isFinite(durationMilliseconds) || durationMilliseconds < 0 || durationMilliseconds > 86400000 || !Number.isFinite(occurrences) || occurrences < 0 || occurrences > 1000000) continue;
    let app = history.find(entry => String(entry.processName || entry.name).toLowerCase() === processName.toLowerCase());
    if (!app) {
      app = { processName, name: friendlyAppName(processName), durationSeconds: 0, occurrences: 0, foregroundDurationMilliseconds: 0, foregroundOccurrences: 0, foregroundDailyUsage: [], foregroundBatchIds: [], firstSeenAt: now, lastSeenAt: now, status: 'not_observed', cpu: null, memory: 0, timeType: foregroundTelemetryAvailable ? 'tempo observado em primeiro plano pelo Windows' : 'medição foreground indisponível neste sistema' };
      history.push(app);
    }
    app.foregroundBatchIds = Array.isArray(app.foregroundBatchIds) ? app.foregroundBatchIds : [];
    if (app.foregroundBatchIds.includes(foregroundBatchId)) continue;
    app.foregroundBatchIds.push(foregroundBatchId);
    app.foregroundBatchIds = app.foregroundBatchIds.slice(-128);
    app.foregroundDurationMilliseconds += durationMilliseconds;
    app.foregroundOccurrences += occurrences;
    let day = app.foregroundDailyUsage.find(entry => entry.date === date);
    if (!day) { day = { date, durationMilliseconds: 0, occurrences: 0 }; app.foregroundDailyUsage.push(day); }
    day.durationMilliseconds += durationMilliseconds;
    day.occurrences += occurrences;
    app.lastSeenAt = now;
    app.timeType = foregroundTelemetryAvailable ? 'tempo observado em primeiro plano pelo Windows' : 'medição foreground indisponível neste sistema';
  }
  const reportedForegroundApp = String(foregroundApp || '').replace(/\.exe$/i, '').trim().slice(0, 100);
  machine.foregroundApp = reportedForegroundApp || null;
  machine.foregroundObservedAt = now;
  for (const app of history) if (app.status === 'running' && !detected.has(String(app.processName || app.name).toLowerCase())) app.status = 'not_observed';
  machine.apps = history.sort((a,b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt)).slice(0, 100);
}
function applicationSummary(machines) {
  const grouped = new Map();
  for (const machine of machines) for (const app of machine.apps || []) {
    const key = String(app.processName || app.name).toLowerCase();
    const item = grouped.get(key) || { name: app.name, processName: app.processName, durationMilliseconds: 0, occurrences: 0, machineIds: new Set(), runningMachines: 0, lastSeenAt: app.lastSeenAt, timeType: 'tempo observado em primeiro plano pelo Windows' };
    item.durationMilliseconds += Number(app.foregroundDurationMilliseconds) || 0; item.occurrences += Number(app.foregroundOccurrences) || 0; item.machineIds.add(machine.id);
    if (machine.status === 'online' && machine.foregroundApp && String(machine.foregroundApp).toLowerCase() === key) item.runningMachines++;
    if (Date.parse(app.lastSeenAt) > Date.parse(item.lastSeenAt)) item.lastSeenAt = app.lastSeenAt;
    grouped.set(key, item);
  }
  return [...grouped.values()].map(({machineIds,...a}) => ({...a, durationSeconds: Math.floor(a.durationMilliseconds / 1000), machineCount:machineIds.size})).sort((a,b) => b.durationMilliseconds-a.durationMilliseconds).slice(0,50);
}
function machineApplicationReport(machine, days) {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const firstDay = new Date(today.getTime() - (days - 1) * 86400000);
  const firstDate = firstDay.toISOString().slice(0, 10);
  const dayTotals = Array.from({ length: days }, (_, index) => ({
    date: new Date(firstDay.getTime() + index * 86400000).toISOString().slice(0, 10),
    durationMilliseconds: 0,
    durationSeconds: 0,
    occurrences: 0
  }));
  const daysByDate = new Map(dayTotals.map(day => [day.date, day]));
  const applications = (machine.apps || []).map(app => {
    const usage = (Array.isArray(app.foregroundDailyUsage) ? app.foregroundDailyUsage : []).filter(day => day.date >= firstDate);
    const durationMilliseconds = usage.reduce((total, day) => total + (Number(day.durationMilliseconds) || 0), 0);
    const occurrences = usage.reduce((total, day) => total + (Number(day.occurrences) || 0), 0);
    for (const day of usage) {
      const total = daysByDate.get(day.date);
      if (total) { total.durationMilliseconds += Number(day.durationMilliseconds) || 0; total.occurrences += Number(day.occurrences) || 0; }
    }
    return {
      name: app.name,
      processName: app.processName || app.name,
      durationMilliseconds,
      durationSeconds: Math.floor(durationMilliseconds / 1000),
      occurrences,
      status: machine.foregroundApp && String(machine.foregroundApp).toLowerCase() === String(app.processName || app.name).toLowerCase() ? 'foreground' : 'not_foreground',
      cpu: app.cpu,
      memory: app.memory,
      firstSeenAt: app.firstSeenAt,
      lastSeenAt: app.lastSeenAt,
      timeType: app.timeType || 'medição foreground indisponível neste sistema'
    };
  }).filter(app => app.durationMilliseconds > 0 || app.occurrences > 0 || app.status === 'foreground');
  applications.sort((a, b) => b.durationMilliseconds - a.durationMilliseconds || a.name.localeCompare(b.name));
  return {
    days,
    from: firstDate,
    through: today.toISOString().slice(0, 10),
    totalMilliseconds: applications.reduce((total, app) => total + app.durationMilliseconds, 0),
    totalSeconds: Math.floor(applications.reduce((total, app) => total + app.durationMilliseconds, 0) / 1000),
    totalOccurrences: applications.reduce((total, app) => total + app.occurrences, 0),
    runningCount: applications.filter(app => machine.status === 'online' && app.status === 'foreground').length,
    measurementSupported: machine.foregroundTelemetryAvailable === true,
    hasMeasuredData: applications.some(app => app.durationMilliseconds > 0 || app.occurrences > 0),
    timeType: 'tempo observado em primeiro plano pelo Windows; resolução de amostragem de 250 ms',
    applications,
    daily: dayTotals.map(day => ({ ...day, durationSeconds: Math.floor(day.durationMilliseconds / 1000) }))
  };
}
function webSummary(userId, days = 30) {
  const machines = new Map(db.machines.filter(m => m.userId === userId).map(m => [m.id, m.name]));
  const since = Date.now() - days * 86400000;
  const grouped = new Map();
  for (const entry of db.webActivity) {
    const machineName = machines.get(entry.machineId); if (!machineName || Date.parse(entry.at) < since) continue;
    const key = `${entry.machineId}:${entry.domain}`;
    const item = grouped.get(key) || { machineId: entry.machineId, machineName, domain: entry.domain, durationSeconds: 0, visits: 0, lastSeen: entry.at };
    item.durationSeconds += entry.durationSeconds; item.visits += 1;
    if (Date.parse(entry.at) > Date.parse(item.lastSeen)) item.lastSeen = entry.at;
    grouped.set(key, item);
  }
  return [...grouped.values()].sort((a,b) => b.durationSeconds - a.durationSeconds).slice(0, 200);
}
function validDomain(value) {
  const domain = String(value || '').trim().toLowerCase().replace(/\.$/, '');
  if (domain.length > 253 || domain.length < 4 || domain.includes('/') || domain.includes(':') || domain === 'localhost') return null;
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return null;
  return domain;
}
function validServerAddress(value) {
  try {
    const url = new URL(value);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    return ['http:', 'https:'].includes(url.protocol)
      && Boolean(url.hostname)
      && !url.username && !url.password
      && url.pathname === '/' && !url.search && !url.hash
      && port >= 1 && port <= 65535;
  } catch {
    return false;
  }
}
async function issueSession(user, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 86400000);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = { tokenHash, userId: user.id, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
  await mysqlStore.createSession(session);
  db.sessions.push(session);
  sessions.set(token, user.id);
  res.setHeader('Set-Cookie', cookie('argus_session', token, 60 * 60 * 24 * 7));
}
async function save() { await mysqlStore.save(db); }

app.use(express.json({ limit: '256kb' }));
app.use(express.static(require('path').join(__dirname, '..', 'frontend')));
app.get('/downloads/argus-agent.js', (req,res) => res.sendFile(require('path').join(__dirname, '..', 'agent', 'agent.js')));
app.get('/downloads/argus-setup.js', (req,res) => res.sendFile(require('path').join(__dirname, '..', 'agent', 'setup.js')));
app.get('/downloads/argus-foreground-watcher.ps1', (req,res) => res.download(require('path').join(__dirname, '..', 'agent', 'foreground-watcher.ps1'), 'argus-foreground-watcher.ps1'));
app.get('/downloads/argus-control.ps1', (req,res) => res.download(require('path').join(__dirname, '..', 'scripts', 'argus-control.ps1'), 'argus-control.ps1'));
function agentCommandDownload(req, res) {
  const host = String(req.query.server || '').trim(); const code = String(req.query.code || '').trim().toUpperCase();
  if (!validServerAddress(host) || code) return res.status(400).send('Endereço do servidor inválido. Baixe um instalador ARGUS válido.');
  const content = `@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "ARGUS_SERVER_URL=${host}"\r\nset "ARGUS_AGENT_ONLY=1"\r\nset "ARGUS_INSTALL_ONLY=1"\r\nset "ARGUS_HELPER_PATH=%~dp0argus-control.ps1"\r\nif not exist "%ARGUS_HELPER_PATH%" (\r\n  echo Baixando componentes de suporte do ARGUS...\r\n  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri ($env:ARGUS_SERVER_URL + '/downloads/argus-control.ps1') -OutFile $env:ARGUS_HELPER_PATH"\r\n  if errorlevel 1 (echo Nao foi possivel baixar o suporte. Confira a rede e tente novamente.& pause & exit /b 1)\r\n)\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_HELPER_PATH%"\r\n`;
  res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Content-Disposition', 'attachment; filename="ARGUS.cmd"'); res.send(content);
}
app.get('/downloads/ARGUS.cmd', agentCommandDownload);
app.get('/api/legal/terms', (req,res) => res.json({ version: TERMS_VERSION, url: '/terms.html' }));

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    await mysqlStore.refreshUsers(db);
    const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' });
    if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) return res.status(400).json({ error: 'Leia e aceite os termos atuais antes de criar a conta.' });
    if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'Este e-mail já possui uma conta.' });
    const now = new Date().toISOString(); const credentials = hashPassword(password);
    const user = { id: id(), name, email, ...credentials, createdAt: now, termsVersion: TERMS_VERSION, termsAcceptedAt: now, webConsent: req.body.webConsent === true };
    db.users.push(user); db.termAcceptances.push({ userId: user.id, version: TERMS_VERSION, acceptedAt: now, webConsent: user.webConsent }); await save(); await issueSession(user, res);
    res.status(201).json({ user: safeUser(user) });
  } catch (e) { next(e); }
});
app.post('/api/auth/login', async (req, res, next) => {
  try {
    await mysqlStore.refreshUsers(db);
    const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || ''); const user = db.users.find(u => u.email === email);
    const candidate = user && crypto.scryptSync(password, user.salt, 64);
    if (!user || !crypto.timingSafeEqual(candidate, Buffer.from(user.hash, 'hex'))) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) return res.status(428).json({ error: 'Leia e aceite a versão atual dos termos para continuar.' });
    const now = new Date().toISOString(); user.termsVersion = TERMS_VERSION; user.termsAcceptedAt = now;
    if (Object.prototype.hasOwnProperty.call(req.body, 'webConsent')) user.webConsent = req.body.webConsent === true;
    db.termAcceptances.push({ userId: user.id, version: TERMS_VERSION, acceptedAt: now, webConsent: user.webConsent });
    if (!user.webConsent) { db.webActivity = db.webActivity.filter(w => !db.machines.some(m => m.userId === user.id && m.id === w.machineId)); await mysqlStore.acknowledgeConsentRevocation(user.id); }
    await save(); await issueSession(user, res); res.json({ user: safeUser(user) });
  } catch (e) { next(e); }
});
app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    const code = await mysqlStore.createPasswordReset(email);
    res.json({ message: 'Se o e-mail estiver cadastrado, o ARGUS enviaria uma mensagem de recuperação.', simulated: true, simulatedEmail: code ? { to: email, subject: 'Recuperação de senha ARGUS', code, expiresInMinutes: 15 } : null });
  } catch (e) { next(e); }
});
app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = String(req.body.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code) || password.length < 10) return res.status(400).json({ error: 'Informe e-mail válido, código de 6 dígitos e senha com pelo menos 10 caracteres.' });
    const userId = await mysqlStore.completePasswordReset(email, code, password);
    if (!userId) return res.status(400).json({ error: 'Código inválido ou expirado. Solicite uma nova recuperação.' });
    for (const [token, owner] of sessions) if (owner === userId) sessions.delete(token);
    await mysqlStore.refreshUsers(db);
    res.json({ ok: true, message: 'Senha alterada. Entre novamente com a nova senha.' });
  } catch (e) { next(e); }
});
app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = sessionToken(req);
    if (token) {
      sessions.delete(token);
      const digest = crypto.createHash('sha256').update(token).digest('hex');
      db.sessions = db.sessions.filter(session => session.tokenHash !== digest);
      await mysqlStore.deleteSession(digest);
    }
    res.setHeader('Set-Cookie', cookie('argus_session', '', 0));
    res.json({ ok: true });
  } catch (error) { next(error); }
});
app.get('/api/auth/me', auth, (req,res) => res.json({ user: safeUser(req.user) }));

app.post('/api/pairings', auth, async (req, res, next) => {
  try {
    const code = `ARG-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    db.pairings = db.pairings.filter(p => p.expiresAt > Date.now()); db.pairings.push({ code, userId: req.user.id, expiresAt: Date.now() + 900000 }); await save();
    res.status(201).json({ code, expiresIn: 900 });
  } catch (e) { next(e); }
});
app.post('/api/agent/connect', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').toUpperCase().trim(); const index = db.pairings.findIndex(p => p.code === code && p.expiresAt > Date.now());
    if (index < 0) return res.status(400).json({ error: 'Código inválido ou expirado. Gere um novo no dashboard.' });
    const pairing = db.pairings.splice(index, 1)[0]; const name = String(req.body.name || 'Computador').slice(0,80);
    let machine = db.machines.find(m => m.userId === pairing.userId && m.name.toLowerCase() === name.toLowerCase());
    const token = crypto.randomBytes(32).toString('hex'); const now = new Date().toISOString();
    if (!machine) { machine = { id: id(), userId: pairing.userId, name, status: 'online', createdAt: now, firstSeenAt: now, metrics: {}, apps: [], lastSeen: now, token, webActivity: 'Extensão de navegação ainda não conectada.' }; db.machines.push(machine); addEvent(machine,'connected','Novo computador conectado'); }
    else { machine.token = token; machine.status = 'online'; machine.lastSeen = now; }
    await save(); io.to(`user:${pairing.userId}`).emit('update'); res.json({ token, machineId: machine.id, serverTime: now });
  } catch(e) { next(e); }
});
app.post('/api/agent/heartbeat', async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const machine = db.machines.find(m => m.token && m.token === token);
    if (!machine) return res.status(401).json({ error: 'Agente não autorizado. Conecte usando um novo código.' });
    const body = req.body || {}; const previousStatus = machine.status;
    machine.name = String(body.name || machine.name).slice(0,80); machine.userName = String(body.userName || 'Não informado').slice(0,100);
    machine.os = String(body.os || 'Sistema desconhecido').slice(0,120); machine.arch = String(body.arch || '').slice(0,30); machine.uptime = Number(body.uptime) || 0;
    machine.metrics = { cpu: clamp(body.metrics?.cpu), ram: clamp(body.metrics?.ram), disk: clamp(body.metrics?.disk), memoryUsed: Number(body.metrics?.memoryUsed) || 0, memoryTotal: Number(body.metrics?.memoryTotal) || 0 };
    const heartbeatAt = new Date().toISOString(); machine.foregroundTelemetryAvailable = body.foregroundTelemetryAvailable === true; updateApplicationSnapshot(machine, body.apps, body.foregroundUsage, body.foregroundApp, body.foregroundBatchId, machine.foregroundTelemetryAvailable, heartbeatAt); machine.lastSeen = heartbeatAt; machine.status = 'online';
    if (previousStatus !== 'online') addEvent(machine,'connected','Computador voltou a ficar online');
    if ((machine.metrics.cpu >= 85 || machine.metrics.ram >= 90) && !db.alerts.some(a => a.machineId === machine.id && a.open && a.kind === (machine.metrics.cpu >= 85 ? 'cpu' : 'ram'))) {
      const kind = machine.metrics.cpu >= 85 ? 'cpu' : 'ram'; const alert = { id:id(),machineId:machine.id,machineName:machine.name,kind,message:kind === 'cpu' ? 'CPU acima de 85%' : 'RAM acima de 90%',at:machine.lastSeen,open:true }; db.alerts.unshift(alert); addEvent(machine,'alert',alert.message);
    }
    const owner = ownerForMachine(machine.id);
    if (owner?.webConsent && Array.isArray(body.navigation)) {
      const grouped = new Map();
      for (const item of body.navigation.slice(0,40)) { const domain = validDomain(item.domain); const seconds = Math.floor(Number(item.durationSeconds)); if (!domain || !Number.isFinite(seconds) || seconds < 1 || seconds > 60) continue; grouped.set(domain,(grouped.get(domain)||0)+seconds); }
      for (const [domain,durationSeconds] of grouped) db.webActivity.unshift({ id:id(),machineId:machine.id,domain,durationSeconds:Math.min(60,durationSeconds),at:machine.lastSeen });
      db.webActivity.length = Math.min(db.webActivity.length,5000);
      if (grouped.size) machine.webActivity = 'Extensão instalada; domínios e tempo em aba ativa.';
    } else if (!owner?.webConsent) machine.webActivity = 'Coleta desativada: consentimento não concedido.';
    await save(); io.to(`user:${machine.userId}`).emit('update'); res.json({ ok:true,serverTime:machine.lastSeen,webCollection:!!owner?.webConsent });
  } catch(e) { next(e); }
});

app.get('/api/dashboard', auth, (req,res) => {
  const machines = db.machines.filter(m => m.userId === req.user.id).map(publicMachine); const online = machines.filter(m => m.status === 'online').length;
  const machineIds = new Set(machines.map(m => m.id)); const alerts = db.alerts.filter(a => a.open && machineIds.has(a.machineId));
  res.json({ summary:{total:machines.length,online,offline:machines.length-online,users:new Set(machines.filter(m=>m.status==='online').map(m=>m.userName).filter(Boolean)).size,alerts:alerts.length},machines,applications:applicationSummary(machines),events:db.events.filter(e=>machineIds.has(e.machineId)).slice(0,30),alerts:alerts.slice(0,20),webActivity:webSummary(req.user.id) });
});
app.get('/api/machines/:id', auth, (req,res) => {
  const machine = db.machines.find(m => m.id === req.params.id && m.userId === req.user.id); if (!machine) return res.status(404).json({error:'Computador não encontrado.'});
  const requestedDays = Number(req.query.days);
  const days = [1, 7, 30].includes(requestedDays) ? requestedDays : 7;
  res.json({ machine:publicMachine(machine),events:db.events.filter(e=>e.machineId===machine.id).slice(0,100),webActivity:webSummary(req.user.id).filter(w=>w.machineId===machine.id),applicationReport:machineApplicationReport(machine,days) });
});
app.get('/api/reports', auth, (req,res) => {
  const days = Math.min(30,Math.max(1,Number(req.query.days)||7)); const since=Date.now()-days*86400000; const machines=db.machines.filter(m=>m.userId===req.user.id); const ids=new Set(machines.map(m=>m.id));
  res.json({days,machines:machines.map(publicMachine),events:db.events.filter(e=>ids.has(e.machineId)&&Date.parse(e.at)>=since),alerts:db.alerts.filter(a=>ids.has(a.machineId)&&Date.parse(a.at)>=since),webActivity:webSummary(req.user.id,days)});
});
app.get('/api/config', auth, (req,res) => { const nets=os.networkInterfaces(); const ips=Object.values(nets).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).map(x=>x.address); res.json({ips,port:PORT}); });
app.get('/api/privacy/export', auth, (req,res) => { const machines=db.machines.filter(m=>m.userId===req.user.id); const ids=new Set(machines.map(m=>m.id)); res.json({user:safeUser(req.user),machines:machines.map(publicMachine),events:db.events.filter(e=>ids.has(e.machineId)),alerts:db.alerts.filter(a=>ids.has(a.machineId)),webActivity:db.webActivity.filter(w=>ids.has(w.machineId)),terms:db.termAcceptances.filter(t=>t.userId===req.user.id)}); });
app.post('/api/privacy/web-consent', auth, async (req,res,next) => {
  try { req.user.webConsent=req.body.enabled===true; const consentAt=new Date().toISOString(); db.termAcceptances.push({userId:req.user.id,version:TERMS_VERSION,acceptedAt:consentAt,webConsent:req.user.webConsent}); if(!req.user.webConsent){db.webActivity=db.webActivity.filter(w=>!db.machines.some(m=>m.userId===req.user.id&&m.id===w.machineId));await mysqlStore.acknowledgeConsentRevocation(req.user.id);} await save(); io.to(`user:${req.user.id}`).emit('update'); res.json({webConsent:req.user.webConsent}); }
  catch(e){next(e);}
});
app.post('/api/privacy/delete-account', auth, async (req,res,next) => {
  try { if(req.user.email===String(process.env.ARGUS_ADMIN_EMAIL||'hanielshz@gmail.com').trim().toLowerCase())return res.status(403).json({error:'A conta administradora inicial não pode ser excluída.'});const userId=req.user.id; await mysqlStore.deleteUser(userId); db.users=db.users.filter(u=>u.id!==userId); const machines=db.machines.filter(m=>m.userId===userId);const ids=new Set(machines.map(m=>m.id));db.machines=db.machines.filter(m=>m.userId!==userId);db.events=db.events.filter(e=>!ids.has(e.machineId));db.alerts=db.alerts.filter(a=>!ids.has(a.machineId));db.webActivity=db.webActivity.filter(w=>!ids.has(w.machineId));db.pairings=db.pairings.filter(p=>p.userId!==userId);db.termAcceptances=db.termAcceptances.filter(t=>t.userId!==userId);for(const [token,owner] of sessions)if(owner===userId)sessions.delete(token);res.setHeader('Set-Cookie',cookie('argus_session','',0));res.json({ok:true}); }
  catch(e){next(e);}
});
app.post('/api/alerts/:id/ack', auth, async (req,res,next) => { try { const a=db.alerts.find(x=>x.id===req.params.id&&db.machines.some(m=>m.id===x.machineId&&m.userId===req.user.id));if(!a)return res.status(404).json({error:'Alerta não encontrado.'});a.open=false;await save();io.to(`user:${req.user.id}`).emit('update');res.json({ok:true});}catch(e){next(e);} });

io.use(async (socket, next) => {
  const raw = socket.handshake.headers.cookie?.match(/(?:^|;\s*)argus_session=([^;]+)/)?.[1];
  let token;
  try { token = raw && decodeURIComponent(raw); } catch { return next(new Error('unauthorized')); }
  if (!token) return next(new Error('unauthorized'));
  try {
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    const user = await mysqlStore.findSessionUser(digest);
    if (!user) { sessions.delete(token); return next(new Error('unauthorized')); }
    sessions.set(token, user.id);
    socket.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
});
io.on('connection',socket=>socket.join(`user:${socket.userId}`));
setInterval(async()=>{if(!db)return;let changed=false;for(const machine of db.machines)if(machine.status!=='offline'&&Date.now()-Date.parse(machine.lastSeen)>OFFLINE_TIMEOUT_MS){machine.status='offline';for(const app of machine.apps||[])if(app.status==='running')app.status='not_observed';addEvent(machine,'offline',`Conexão perdida — sem heartbeat há ${Math.round(OFFLINE_TIMEOUT_MS/1000)} segundos`);db.alerts.unshift({id:id(),machineId:machine.id,machineName:machine.name,kind:'offline',message:'Conexão perdida',at:new Date().toISOString(),open:true});changed=true;}if(changed){try{await save();for(const user of db.users)io.to(`user:${user.id}`).emit('update');}catch(e){console.error('Falha ao salvar status offline:',e.message);}}},OFFLINE_CHECK_INTERVAL_MS).unref();

app.use((err,req,res,next)=>{console.error(err);if(!res.headersSent)res.status(500).json({error:'Erro interno do ARGUS. Verifique o log do backend.'});});

async function start(){
  try{db=await mysqlStore.initialize();db.sessions=db.sessions||[];const cleanup=setInterval(async()=>{db.pairings=db.pairings.filter(p=>p.expiresAt>Date.now());db.sessions=db.sessions.filter(s=>Date.parse(s.expiresAt)>Date.now());db.webActivity=db.webActivity.filter(w=>Date.parse(w.at)>Date.now()-90*86400000);await mysqlStore.prune().catch(e=>console.error('Falha na limpeza de retenção:',e.message));},3600000);cleanup.unref();server.listen(PORT,HOST,()=>console.log(`ARGUS backend inicializado em http://localhost:${PORT} (LAN: http://<IP-do-administrador>:${PORT})`));}
  catch(error){await mysqlStore.close().catch(()=>{});console.error('Não foi possível iniciar o ARGUS. Confira o MySQL local e as variáveis do arquivo .env.');console.error(error.message);process.exitCode=1;}
}
start();
process.on('SIGINT',async()=>{await mysqlStore.close().catch(()=>{});process.exit(0);});
