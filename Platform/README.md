# ARGUS

ARGUS é um protótipo acadêmico para monitorar computadores autorizados em uma rede local. Ele reúne um painel administrativo, uma API, um banco MySQL, um agente instalado em cada computador acompanhado e uma extensão opcional para navegadores Chromium.

Este documento explica a arquitetura, os dados coletados, os fluxos principais e como executar o projeto em ambiente de desenvolvimento ou demonstração. O projeto foi pensado para uma rede privada e não está preparado para exposição pública ou uso organizacional sem revisão técnica, de segurança, jurídica e de privacidade.

## Índice

- [Visão geral](#visão-geral)
- [Componentes e arquitetura](#componentes-e-arquitetura)
- [Dados coletados](#dados-coletados)
- [Requisitos](#requisitos)
- [Instalação do servidor](#instalação-do-servidor)
- [Conectar um computador](#conectar-um-computador)
- [Atividade web opcional](#atividade-web-opcional)
- [Funcionalidades do painel](#funcionalidades-do-painel)
- [API](#api)
- [Banco de dados e persistência](#banco-de-dados-e-persistência)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Limitações conhecidas](#limitações-conhecidas)
- [Execução e encerramento](#execução-e-encerramento)
- [Testes](#testes)
- [Estrutura de pastas](#estrutura-de-pastas)

## Visão geral

O computador administrador hospeda o painel, a API e o MySQL. Cada endpoint autorizado executa o agente ARGUS, que envia periodicamente informações de estado para a API pela rede local. Se a atividade web tiver sido habilitada separadamente, uma extensão do navegador comunica domínios ativos ao agente local.

```text
Computador monitorado                       Computador administrador
┌───────────────────────────┐               ┌─────────────────────────────┐
│ Agente Node.js            │── HTTP/LAN ──▶│ API Express + Socket.IO     │
│  • sistema e métricas     │               │  • autenticação e sessões   │
│  • processos ativos       │               │  • pareamento dos agentes   │
│                           │               │  • dados para o painel      │
│ Extensão Chrome/Edge      │── HTTP local ▶│ MySQL                       │
│  • domínio ativo opcional │               └──────────────┬──────────────┘
└───────────────────────────┘                              │ Socket.IO
                                                    ┌───────▼─────────────┐
                                                    │ Painel HTML/CSS/JS  │
                                                    └─────────────────────┘
```

O agente nunca se conecta diretamente ao MySQL. Ele envia os dados à API na porta 3000 por padrão. O MySQL deve permanecer acessível apenas pelo computador administrador; não libere a porta 3306 para os endpoints.

## Componentes e arquitetura

### Painel (`frontend/`)

Interface web em HTML, CSS e JavaScript sem etapa de compilação. Após a autenticação, apresenta computadores, métricas, processos, eventos, atividade de navegação, relatórios, alertas e configurações. Atualizações recebidas por Socket.IO permitem atualizar os dados sem recarregar a página. O painel usa escala visual ampliada por padrão, equivalente aproximadamente a 125% de zoom em desktop.

### Backend (`backend/server.js`)

Servidor Node.js com Express e Socket.IO. Serve os arquivos do painel, verifica credenciais e sessões, cria códigos de pareamento, recebe heartbeats, disponibiliza relatórios e aplica controles de privacidade. O backend escuta em `0.0.0.0:3000` por padrão para aceitar conexões da rede local.

### Banco (`database/`)

MySQL é a persistência principal. `schema.sql` define tabelas e relações; `mysql.js` inicializa o banco, carrega e grava os dados e executa as rotinas de retenção. O esquema é conferido/criado durante a inicialização. Se houver um `database/data.json` legado e o banco ainda não tiver usuários, os registros são importados; o arquivo legado não é apagado automaticamente.

### Agente (`agent/`)

Processo Node.js instalado em cada computador monitorado. Coleta nome do computador e usuário, sistema operacional, arquitetura, tempo ligado, CPU, RAM, disco e uma lista limitada de processos. Também hospeda uma ponte HTTP apenas em loopback para a extensão opcional.

### Extensão (`browser-extension/`)

Extensão Manifest V3 compatível com Chrome e Edge. Desativada por padrão, estima o tempo em que um domínio HTTP/HTTPS fica na aba ativa. Não envia a URL completa. A extensão envia seus dados à ponte local do agente, que os encaminha à API somente quando o servidor confirma que a coleta foi autorizada.

## Dados coletados

| Categoria | Dados | Frequência/observações |
|---|---|---|
| Conta administrativa | Nome, e-mail, derivação da senha com salt e escolhas de termos/consentimento | Criados no cadastro; sessões expiram em sete dias |
| Computador | Nome, usuário do sistema, sistema operacional, arquitetura, uptime | Enviados pelo agente em cada heartbeat |
| Métricas | CPU, RAM, disco, memória usada e total | Instantâneo; heartbeat a cada 10 segundos por padrão |
| Processos e aplicações | Até 12 processos retornados pela coleta do agente | Instantâneo; nomes, CPU e memória aproximada. No Windows, o percentual de CPU por processo só fica disponível após comparação entre amostras |
| Eventos e alertas | Conexões, desconexões e limites de recursos | CPU ≥ 85%, RAM ≥ 90% e ausência de heartbeat por 45 segundos |
| Navegação opcional | Domínio e duração aproximada em aba ativa | Só com coleta web habilitada; histórico retido por até 90 dias |

As métricas são instantâneos. Para aplicações, o painel também estima o tempo observado somando os intervalos entre heartbeats consecutivos; isso não confirma todo o tempo real de uso. Os intervalos do agente e os limites offline podem ser configurados por variáveis descritas abaixo.

## Requisitos

- Node.js 18 ou superior no administrador e nos endpoints.
- MySQL 8 ou superior no computador administrador.
- Rede local entre o administrador e os endpoints; TCP/3000 permitido no firewall do administrador.
- Chrome ou Microsoft Edge somente se a coleta web opcional for utilizada.

## Instalação do servidor

### 1. Preparar o MySQL

Instale e inicie o MySQL no computador administrador. Crie um banco e um usuário exclusivo para o ARGUS. Exemplo no console MySQL como administrador:

```sql
CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'uma-senha-forte';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

O usuário da aplicação precisa das permissões para operar as tabelas. Não exponha o serviço MySQL à LAN.

### 2. Instalar dependências

Na pasta do projeto, execute:

```sh
npm install
```

### 3. Configurar o backend

Copie `.env.example` para `.env` e informe as configurações locais:

```env
PORT=3000
HOST=0.0.0.0
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=argus_app
MYSQL_PASSWORD=uma-senha-forte
MYSQL_DATABASE=argus
MYSQL_AUTO_CREATE_DATABASE=false
```

`MYSQL_AUTO_CREATE_DATABASE=false` é apropriado para o usuário restrito do exemplo, já que o banco foi criado antes. Se definido como `true` (ou omitido), o backend tenta criar o banco; o usuário MySQL precisa então ter essa permissão. O esquema de tabelas é criado/verificado pelo aplicativo na inicialização.

Variáveis opcionais para o estado offline:

```env
OFFLINE_TIMEOUT_MS=45000
OFFLINE_CHECK_INTERVAL_MS=10000
```

### 4. Iniciar

```sh
npm start
```

No Windows, abra `ARGUS.cmd` e escolha **Iniciar servidor e abrir painel**. Acesse `http://localhost:3000` no computador administrador. No primeiro acesso, crie a conta e leia/aceite a versão atual dos termos. O endereço LAN do servidor também é exibido na configuração de pareamento.

## Conectar um computador

### Instalação guiada (Windows)

1. No painel, escolha **Adicionar computador** para gerar um código temporário. Ele expira em 15 minutos e pode parear um computador.
2. Baixe o `ARGUS.cmd` personalizado e execute-o no endpoint autorizado.
3. Escolha **1 — Instalar/conectar este computador**. O comando baixa o controlador e o agente, cria a configuração e inicia o pareamento. Node.js LTS é instalado via `winget` se ainda não estiver disponível.
4. Depois do pareamento, o agente é configurado para iniciar quando a pessoa entrar no Windows. O arquivo `config.json` fica em `%LOCALAPPDATA%\ARGUS\Agent`; proteja-o, pois contém o token do agente e a chave da ponte local.

### Instalação manual (desenvolvimento)

1. Copie a pasta `agent` para o endpoint autorizado e instale Node.js 18 ou superior. Não é necessário copiar o painel nem instalar pacotes npm no endpoint.
2. Crie `agent/config.json` copiando `agent/config.example.json` e informe o endereço do servidor e o código de pareamento:

   ```json
   {
     "serverUrl": "http://192.168.0.10:3000",
     "connectionCode": "ARG-AB12-CD34",
     "heartbeatSeconds": 10,
     "bridgePort": 43172
   }
   ```

3. Execute `node agent.js` a partir da pasta `agent`.
4. Depois do pareamento, o agente salva `deviceToken` e `bridgeKey` no `config.json`. Proteja esse arquivo: o token autoriza o agente e a chave permite comunicação local com a extensão.

O agente envia o primeiro heartbeat ao iniciar e continua no intervalo configurado (mínimo de cinco segundos). Se o computador parar de enviar heartbeats, o painel marca-o offline depois do limite configurado, 45 segundos por padrão. Para parear novamente, gere um novo código no painel e remova `deviceToken` e `connectionCode` antigos da configuração antes de iniciar o agente.

O histórico de aplicações é mantido no campo JSON de processos da máquina já existente no MySQL, sem exigir migração de tabela. Computadores já cadastrados passam a acumular estimativas e contagens depois da atualização; dados anteriores não podem ser reconstruídos.

## Atividade web opcional

A coleta de navegação é independente das métricas do computador e começa desativada. Só habilite após informar as pessoas afetadas e confirmar a autorização e a base legal adequadas ao contexto.

1. No login/cadastro, aceite os termos. A opção de coleta web é separada e opcional. Ela também pode ser alterada em **Configurações**.
2. No Chrome ou Edge, abra `chrome://extensions` ou `edge://extensions`, habilite o modo do desenvolvedor e carregue sem compactação a pasta `browser-extension`.
3. Abra o popup **ARGUS WEB**. Informe a `bridgeKey` e `bridgePort` salvas pelo agente em `agent/config.json`, confirme que as pessoas foram informadas e ative a coleta.
4. Mantenha o agente e o navegador em execução. A extensão acompanha a aba ativa usando alarmes e eventos do navegador e envia amostras à ponte local. O agente encaminha lotes à API nos heartbeats.

A extensão registra apenas domínios de páginas HTTP/HTTPS e tempo aproximado em primeiro plano. Não coleta caminhos ou parâmetros de URL, buscas, conteúdo da página, teclas digitadas, cookies, senhas, histórico anterior ou abas anônimas. Páginas internas e endereços sem domínio público são ignorados. Trocas rápidas de aba podem gerar tempos aproximados ou pequenas lacunas. Se agente, extensão, consentimento ou rede estiverem desligados, os dados não chegam ao servidor.

Ao revogar a coleta web, o servidor deixa de aceitar novas amostras e elimina os registros web da conta. Desative também a extensão nos navegadores dos endpoints.

## Funcionalidades do painel

- **Visão geral:** quantidade de computadores online/offline, usuários ativos, alertas e eventos recentes.
- **Computadores:** lista de endpoints, estado de conexão e métricas atuais; detalhes por computador.
- **Atividades:** eventos de conexão, desconexão e alertas.
- **Aplicações:** processos amostrados, com nomes amigáveis, estado observado, número de identificações e tempo aproximado acumulado entre heartbeats consecutivos (até 60 segundos por intervalo). A lista é limitada pelo agente; “não observado” não afirma que o processo terminou.
- **Navegação web:** domínios agregados, tempo aproximado, computador e período, se a coleta estiver habilitada.
- **Relatórios:** eventos, alertas e atividade web dentro de um período selecionado (até 30 dias na consulta).
- **Alertas:** CPU alta, RAM alta e endpoint offline; alertas podem ser reconhecidos.
- **Configurações:** consentimento web, endereço do servidor e ações relacionadas à conta e aos dados.
- **Privacidade:** exportação dos registros da conta e solicitação de exclusão da conta pelo painel.

## API

As rotas são servidas pelo backend na porta configurada em `PORT`. Rotas do painel exigem sessão autenticada, exceto cadastro, login e rotas públicas indicadas.

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/legal/terms` | Versão e caminho dos termos atuais |
| `POST` | `/api/auth/signup` | Criar conta; exige aceite dos termos atuais |
| `POST` | `/api/auth/login` | Entrar; exige aceite da versão atual |
| `POST` | `/api/auth/logout` | Encerrar sessão |
| `GET` | `/api/auth/me` | Consultar conta da sessão |
| `POST` | `/api/pairings` | Gerar código temporário de pareamento |
| `POST` | `/api/agent/connect` | Parear um agente com um código válido |
| `POST` | `/api/agent/heartbeat` | Receber métricas e, se autorizado, amostras web |
| `GET` | `/api/dashboard` | Obter dados agregados do painel |
| `GET` | `/api/machines/:id` | Consultar detalhes de um computador da conta |
| `GET` | `/api/reports?days=7` | Consultar relatório de 1 a 30 dias |
| `GET` | `/api/config` | Obter IPs locais e porta do servidor |
| `GET` | `/api/privacy/export` | Exportar registros da conta em JSON |
| `POST` | `/api/privacy/web-consent` | Habilitar ou revogar coleta web |
| `POST` | `/api/privacy/delete-account` | Excluir conta e dados relacionados |
| `POST` | `/api/alerts/:id/ack` | Reconhecer um alerta da conta |

Os agentes autenticam os heartbeats com token Bearer emitido no pareamento. O painel usa cookie de sessão e Socket.IO autenticado para receber atualizações.

## Banco de dados e persistência

O esquema (`database/schema.sql`) contém as tabelas:

- `users`: contas e derivação das senhas;
- `terms_acceptances`: histórico de versões aceitas e opção de coleta web;
- `sessions`: hashes de tokens de sessão e validade;
- `machines`: computadores pareados, token do agente e estado atual;
- `pairings`: códigos temporários;
- `events` e `alerts`: histórico operacional;
- `web_activity`: domínio, duração aproximada e horário.

O backend carrega os dados do MySQL ao iniciar e persiste alterações em transações. Eventos, alertas e atividade web têm limites de volume em memória para as consultas atuais. Uma rotina horária elimina sessões expiradas e dados de retenção vencida; registros web e eventos têm retenção de 90 dias, e alertas já reconhecidos antigos também podem ser removidos.

## Privacidade e segurança

- O software foi feito para monitoramento autorizado, visível e em rede privada.
- Senhas são armazenadas como hash derivado por `scrypt` com salt; tokens de sessão são armazenados como hash.
- A extensão é opcional e a coleta web é desativada até que a conta a habilite.
- A ponte do agente escuta apenas em `127.0.0.1`, verifica a chave compartilhada e restringe a origem a extensões de navegador.
- O painel requer aceite da versão atual dos termos para cadastro e login. A opção web é separada.
- Revogar o consentimento web apaga os registros dessa categoria. Excluir a conta remove os dados relacionados.
- O documento de termos em `frontend/terms.html` é um modelo informativo para protótipo acadêmico. O aceite não determina por si só a licitude do monitoramento nem substitui informar os titulares e definir/documentar a base legal aplicável.

O protótipo não oferece TLS, alta disponibilidade, múltiplos papéis administrativos, rotação de chaves, cópias de segurança automáticas ou auditoria de segurança para produção. Não exponha a API à Internet. Revise a configuração, o termo e as obrigações aplicáveis antes de qualquer uso real.

## Limitações conhecidas

- Os valores de CPU, RAM, disco e processos representam amostras pontuais, não médias históricas nem tempo efetivo de uso.
- A atividade web é aproximada e depende do navegador, agente, consentimento e conectividade.
- Não há criptografia TLS no tráfego HTTP padrão da LAN; use somente rede confiável.
- Há uma conta administrativa sem separação de papéis ou permissões por função.
- O projeto não implementa atualizações automáticas, backups automáticos ou recuperação de desastre.
- A execução e a coleta de processos variam conforme sistema operacional e permissões disponíveis.

## Execução e encerramento

| Ação | Comando |
|---|---|
| Instalar dependências | `npm install` |
| Iniciar servidor | `npm start` |
| Iniciar agente diretamente | `npm run agent` (requer `agent/config.json`) |
| Executar smoke test | `npm test` |

No Windows, abra **`ARGUS.cmd`** para o menu unificado. A opção **7 — Saiba mais** explica cada número. As opções permitem preparar o servidor (Node.js, pacotes e `.env`), iniciar o painel, instalar/conectar o agente neste computador, iniciar o agente já instalado ou parar o servidor e o agente locais. A opção de preparação abre `.env` para configurar MySQL quando o arquivo ainda não existe. Inicie o MySQL antes de iniciar o servidor. No menu baixado para endpoints, a opção **5 — Saiba mais** explica as opções do agente.

Para encerrar rapidamente os componentes locais, execute `ARGUS.cmd /stop`; isso também remove o início automático do agente naquele computador. A parada remota de agentes em outros computadores não é controlada por esse comando local; cada endpoint continua executando o próprio agente até ser parado nele.

## Testes

O comando `npm test` executa `scripts/smoke-test.js`. O smoke test inicia a API com um adaptador MySQL em memória e cobre cadastro e aceite dos termos, login, pareamento, downloads do `ARGUS.cmd` e do controlador, coleta de métricas e processos, identificação e agregação de aplicações, ponte de navegação, revogação, exclusão de conta e transições online/offline. Ele não grava nem altera o banco MySQL configurado para uso normal.

Para validar a integração real com MySQL, configure o `.env`, inicie o backend e confira no log a conexão e a criação/verificação do esquema. Em seguida, crie uma conta, reinicie o backend e confirme que os dados persistiram.

## Estrutura de pastas

```text
.
├── agent/
│   ├── agent.js                 # coleta local, heartbeat e ponte do navegador
│   ├── config.example.json      # exemplo de configuração do agente
├── backend/
│   └── server.js                # API Express, Socket.IO e regras de negócio
├── browser-extension/
│   ├── background.js            # amostragem da aba ativa
│   ├── manifest.json            # permissões e configuração da extensão
│   └── popup.*                  # tela de configuração da extensão
├── database/
│   ├── mysql.js                 # inicialização e persistência MySQL
│   └── schema.sql               # tabelas e relações
├── frontend/
│   ├── app.js                   # navegação, chamadas à API e renderização
│   ├── index.html               # estrutura do painel e autenticação
│   ├── styles.css               # estilos
│   └── terms.html               # termos e aviso de privacidade
├── scripts/
│   ├── argus-control.ps1        # ações do menu unificado do Windows
│   └── smoke-test.js            # teste integrado com armazenamento em memória
├── .env.example                 # variáveis do backend
├── ARGUS.cmd                    # menu central de instalação, início e parada
├── package.json                 # dependências e comandos npm
└── README.md                    # esta documentação
```

## Referências de privacidade

O projeto foi documentado tendo como referência geral a [Lei Geral de Proteção de Dados (LGPD)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), o [guia da ANPD sobre cookies e proteção de dados pessoais](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais) e as informações da ANPD sobre [direitos das pessoas titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares). Consulte orientação jurídica para avaliar o contexto concreto de uso.
