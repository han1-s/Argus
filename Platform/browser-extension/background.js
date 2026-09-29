const ALARM = 'argus-active-tab-sample';
const PERIOD_MINUTES = 0.5;

chrome.runtime.onInstalled.addListener(() => chrome.alarms.create(ALARM, { periodInMinutes: PERIOD_MINUTES }));
chrome.runtime.onStartup.addListener(() => chrome.alarms.create(ALARM, { periodInMinutes: PERIOD_MINUTES }));
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === ALARM) sample(); });
chrome.tabs.onActivated.addListener(() => sample());
chrome.tabs.onUpdated.addListener((_id, change) => { if (change.status === 'complete') sample(); });
chrome.storage.onChanged.addListener((_changes, area) => { if (area === 'local') sample(); });

async function sample() {
  const { enabled, bridgeKey, bridgePort } = await chrome.storage.local.get(['enabled', 'bridgeKey', 'bridgePort']);
  if (!enabled || !bridgeKey) { await chrome.storage.session.remove('previous'); return; }
  const now = Date.now();
  try {
    const idle = await chrome.idle.queryState(60);
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    let domain = null;
    if (idle === 'active' && tab && !tab.incognito && /^https?:/i.test(tab.url || '')) {
      try { domain = new URL(tab.url).hostname.toLowerCase(); } catch {}
      if (domain === 'localhost' || !domain.includes('.')) domain = null;
    }
    const { previous } = await chrome.storage.session.get('previous');
    if (domain && previous?.domain === domain && now > previous.at) {
      const durationSeconds = Math.min(60, Math.floor((now - previous.at) / 1000));
      if (durationSeconds > 0) {
        try {
          await fetch(`http://127.0.0.1:${Number(bridgePort) || 43172}/navigation`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Argus-Bridge-Key': bridgeKey },
            body: JSON.stringify({ domain, durationSeconds })
          });
        } catch { /* the agent may be offline; no browsing data is retained by the extension */ }
      }
    }
    if (domain) await chrome.storage.session.set({ previous: { domain, at: now } });
    else await chrome.storage.session.remove('previous');
  } catch { /* permissions may be unavailable until the extension is reloaded */ }
}
