# ARGUS

O ARGUS é um projeto de monitoramento de computadores autorizados em uma rede local. Este repositório reúne duas entregas complementares: um site público de apresentação e um protótipo funcional de monitoramento. O site apresenta a proposta e os fluxos do produto; o protótipo demonstra a coleta local, o painel administrativo e os serviços que sustentam essa coleta.

> O site e o protótipo são aplicações separadas. No estado atual, cadastro, login, preferências e planos do site são demonstrativos e usam o armazenamento local do navegador. Eles não autenticam contra a API do protótipo, e o site não consulta os dados coletados pelo painel.

## Do protótipo ao site

O protótipo (`Platform/`) explora o funcionamento técnico do ARGUS em uma rede local: um servidor Node.js recebe dados dos agentes, armazena-os no MySQL e apresenta os resultados em um painel administrativo. Um agente instalado em cada computador envia métricas e processos periodicamente. Uma extensão opcional para Chrome e Edge pode enviar somente domínios visitados, mediante consentimento explícito.

O site (`Web/Frontend/`) é a camada pública e demonstrativa do produto, construída depois para explicar a proposta, orientar a navegação e apresentar páginas de informações, download, configurações e planos. A organização atual permite desenvolver e executar cada aplicação de forma independente. Não há uma etapa automática que transforme telas do protótipo em páginas do site, nem uma integração de dados entre elas.

```text
Computador monitorado                Servidor da rede local
┌──────────────────────┐              ┌──────────────────────────┐
│ Agente ARGUS         │── HTTP/LAN ─▶│ API Express + Socket.IO  │
│ Extensão opcional    │── loopback ─▶│ MySQL                    │
└──────────────────────┘              │ Painel administrativo   │
                                      └──────────────────────────┘

Site público: React + TypeScript + Vite (aplicação separada)
```

## Aplicações

### Site — `Web/Frontend/`

Site em React 19, TypeScript, React Router e Vite. As rotas incluem início, saiba mais, planos, download, login, cadastro e configurações. Os dados de demonstração e o estado de autenticação são mantidos no navegador; não representam uma conta ou transação validada por servidor.

```powershell
cd Web/Frontend
npm install
npm run dev
```

O Vite informa o endereço local, normalmente `http://localhost:5173`. Para gerar a versão de produção e analisar o código:

```powershell
npm run build
npm run lint
npm run preview
```

### Protótipo — `Platform/`

Aplicação Node.js com Express e Socket.IO. Inclui painel HTML/CSS/JavaScript, API, persistência MySQL, agente Node.js e extensão de navegador opcional. O agente envia nome e usuário do computador, sistema operacional, tempo ligado, métricas de CPU/RAM/disco e processos. No Windows, mede localmente a aplicação em primeiro plano enquanto há entrada do usuário e apresenta esse tempo por computador; não captura conteúdo nem teclas e não exige modo desenvolvedor. A extensão, se habilitada separadamente, envia domínio e duração aproximada da aba ativa, não a URL completa.

Requisitos: Node.js 18 ou superior, MySQL 8 ou superior e conectividade de rede local. Configure `Platform/.env` com base em `.env.example`, criando um usuário MySQL próprio para o ARGUS. Não exponha a porta do MySQL aos computadores monitorados.

```powershell
cd Platform
npm install
npm start
```

Abra `http://localhost:3000` no computador servidor. Para conectar um computador autorizado, baixe `ARGUS.cmd` em **Adicionar computador** e execute no endpoint. O instalador prepara o agente e abre um assistente local; nele, informe o nome do PC, o endereço LAN do servidor e autentique sua conta ARGUS. O assistente cria e usa o código temporário sem gravar a senha. O menu `Platform/ARGUS.cmd` também auxilia a execução do servidor e o gerenciamento local do agente. Este fluxo pertence exclusivamente à `Platform`; não integra autenticação ou dados com o site `Web`. Para executar o agente manualmente, crie `Platform/agent/config.json` a partir de `config.example.json` e rode `npm run agent`.

O protótipo possui um teste de integração que executa API, assistente local e agente usando armazenamento em memória:

```powershell
cd Platform
npm test
```

O teste não instala serviços no Windows nem verifica uma instalação MySQL real. O fluxo manual com MySQL e navegador deve ser validado no ambiente onde o servidor será usado.

## Privacidade e escopo

Use o protótipo apenas em computadores autorizados e em uma rede privada. O painel exige conta e aceite dos termos. A coleta de navegação é opcional, depende de consentimento e pode ser revogada; o sistema então apaga os registros dessa categoria. O protótipo não deve ser exposto diretamente à internet sem revisão de segurança, privacidade e operação. Consulte `Platform/README.md` para detalhes de endpoints, dados, retenção e configuração.

## Estrutura

```text
Platform/
├── agent/              # agente instalado nos computadores
├── backend/            # API Express e comunicação Socket.IO
├── browser-extension/  # extensão opcional Chromium
├── database/           # schema e adaptador MySQL
├── frontend/           # painel do protótipo
└── scripts/            # teste de integração e utilitários

Web/Frontend/
├── public/             # arquivos públicos e imagens
└── src/
    ├── components/     # componentes compartilhados
    ├── layouts/        # estruturas de navegação e autenticação
    ├── pages/          # páginas do site
    └── services/       # preferências, autenticação demo e dados locais
```
