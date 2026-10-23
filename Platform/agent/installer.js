'use strict';

const { isIP } = require('node:net');

function isValidHostname(hostname) {
  const address = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  if (isIP(address)) return true;
  if (!address || address.length > 253) return false;
  return address.replace(/\.$/, '').split('.').every(label => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
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
  } catch { return null; }
}

function createInstaller(serverAddress) {
  const serverUrl = normalizeServerUrl(serverAddress);
  if (!serverUrl) return null;
  return [
    '@echo off',
    'setlocal EnableExtensions',
    'cd /d "%~dp0"',
    `set "ARGUS_SERVER_URL=${serverUrl}"`,
    'set "ARGUS_AGENT_ONLY=1"',
    'set "ARGUS_INSTALL_ONLY=1"',
    'set "ARGUS_HELPER_PATH=%~dp0argus-control.ps1"',
    'where powershell.exe >nul 2>nul',
    'if errorlevel 1 (echo O Windows PowerShell nao foi encontrado.& pause & exit /b 1)',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference=\'SilentlyContinue\'; try { Invoke-WebRequest -UseBasicParsing -Uri ($env:ARGUS_SERVER_URL + \'/downloads/argus-control.ps1\') -OutFile $env:ARGUS_HELPER_PATH; exit 0 } catch { exit 1 }"',
    'if errorlevel 1 if not exist "%ARGUS_HELPER_PATH%" (echo Nao foi possivel baixar os componentes do ARGUS. Confira o endereco e a rede.& pause & exit /b 1)',
    'if not exist "%ARGUS_HELPER_PATH%" (echo O controlador de instalacao nao foi baixado.& pause & exit /b 1)',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_HELPER_PATH%"',
    'if errorlevel 1 (echo A instalacao do agente nao foi concluida. Confira a mensagem acima e tente novamente.& pause & exit /b 1)',
    'exit /b 0',
    '',
  ].join('\r\n');
}

module.exports = { isValidHostname, normalizeServerUrl, createInstaller };
