const test = require('node:test');
const assert = require('node:assert/strict');
const { createInstaller, normalizeServerUrl } = require('../src/installer');

test('normalizes HTTP and HTTPS server addresses', () => {
  assert.equal(normalizeServerUrl('http://192.168.1.10:3000/'), 'http://192.168.1.10:3000');
  assert.equal(normalizeServerUrl('https://argus.example.com'), 'https://argus.example.com');
  assert.equal(normalizeServerUrl('http://[::1]:3000'), 'http://[::1]:3000');
});

test('rejects malformed, credentialed, and non-origin server addresses', () => {
  for (const input of [
    '', 'not-a-url', 'file:///tmp/argus', 'ftp://argus.example.com',
    'http://user:pass@argus.example.com', 'http://argus.example.com/path',
    'http://argus.example.com/?next=elsewhere', 'http://argus.example.com/#fragment',
    'http://argus.example.com:70000', 'http://argus.example.com:0',
  ]) {
    assert.equal(normalizeServerUrl(input), null, `expected rejection: ${input}`);
  }
});

test('generated CMD includes the selected server and guided setup flags', () => {
  const installer = createInstaller('http://127.0.0.1:3000/');
  assert.ok(installer);
  assert.match(installer, /^@echo off\r\n/);
  assert.match(installer, /set "ARGUS_SERVER_URL=http:\/\/127\.0\.0\.1:3000"/);
  assert.match(installer, /set "ARGUS_AGENT_ONLY=1"/);
  assert.match(installer, /set "ARGUS_INSTALL_ONLY=1"/);
  assert.match(installer, /\/downloads\/argus-control\.ps1/);
  assert.ok(installer.endsWith('\r\n'));
});

test('installer generation does not depend on a running Platform API', () => {
  assert.ok(createInstaller('http://192.168.1.20:3000'));
});

test('does not put command separators or line breaks into the generated CMD', () => {
  for (const input of [
    'http://argus.example.com&whoami',
    'http://argus.example.com/%0d%0aecho-injected',
    'http://argus.example.com%0d%0a',
  ]) {
    const installer = createInstaller(input);
    if (installer) {
      assert.equal(installer.includes('echo-injected'), false);
      assert.equal(installer.includes('whoami'), false);
      assert.equal(installer.includes('\nset '), false);
    }
  }
});
