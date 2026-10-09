const { isIP } = require('node:net');

function isValidHostname(hostname) {
  const address = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
  if (isIP(address)) return true;
  if (!address || address.length > 253) return false;
  const labels = address.replace(/\.$/, '').split('.');
  return labels.every(label => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}

function normalizeServerUrl(value) {
  try {
    const url = new URL(value);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    const valid = ['http:', 'https:'].includes(url.protocol)
      && isValidHostname(url.hostname)
      && !url.username && !url.password
      && url.pathname === '/' && !url.search && !url.hash
      && port >= 1 && port <= 65535;
    return valid ? url.origin : null;
  } catch {
    return null;
  }
}

function createInstaller(serverAddress) {
  const serverUrl = normalizeServerUrl(serverAddress);
  if (!serverUrl) return null;

  return `@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "ARGUS_SERVER_URL=${serverUrl}"\r\nset "ARGUS_AGENT_ONLY=1"\r\nset "ARGUS_INSTALL_ONLY=1"\r\nset "ARGUS_HELPER_PATH=%~dp0argus-control.ps1"\r\nif not exist "%ARGUS_HELPER_PATH%" (\r\n  echo Baixando componentes de suporte do ARGUS...\r\n  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri ($env:ARGUS_SERVER_URL + '/downloads/argus-control.ps1') -OutFile $env:ARGUS_HELPER_PATH"\r\n  if errorlevel 1 (echo Nao foi possivel baixar o suporte. Confira a rede e tente novamente.& pause & exit /b 1)\r\n)\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_HELPER_PATH%"\r\n`;
}

module.exports = { normalizeServerUrl, createInstaller, isValidHostname };
