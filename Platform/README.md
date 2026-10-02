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

Processo Node.js instalado em cada computador monitorado. Coleta nome do computador e usuário, sistema operacional, arquitetura, tempo ligado, CPU, RAM, disco e uma lista limitada de processos. No Windows, um watcher PowerShell usa as APIs locais de janela foreground e última entrada para acumular duração por processo em intervalos de 250 ms, excluindo períodos após 60 segundos sem teclado/mouse. Não lê título da janela, conteúdo, teclas, documentos ou credenciais e não exige modo desenvolvedor nem elevação administrativa. Em outros sistemas, o relatório informa que a medição foreground não está disponível, sem inventar uma duração. Também hospeda uma ponte HTTP apenas em loopback para a extensão opcional.

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

As métricas de CPU/RAM/disco são instantâneos. O tempo de aplicações no Windows vem de amostras da aplicação em primeiro plano enquanto há entrada recente, acumuladas localmente e enviadas com IDs de lote para evitar dupla contagem em retries. A resolução é limitada ao intervalo de amostragem e ao agendamento do Windows: é uma medida observada de foreground, não prova atividade humana ou atenção. Os intervalos do agente e os limites offline podem ser configurados por variáveis descritas abaixo.

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

No Windows, abra `ARGUS.cmd` e escolha **Iniciar servidor e abrir painel**. Acesse `http://localhost:3000` no computador administrador. No primeiro acesso, crie a conta e leia/aceite a versão atual dos termos. O endereço LAN do servidor é exibido no painel e será informado no assistente do computador monitorado.

## Conectar um computador

### Instalação guiada (Windows)

1. No painel, escolha **Adicionar computador** e baixe o `ARGUS.cmd`. O arquivo contém apenas o endereço de onde baixar os componentes; não contém nome, senha nem código de autenticação.
2. Execute o arquivo no PC autorizado. Ele instala Node.js LTS via `winget` se necessário e abre o assistente local no navegador.
3. No assistente, informe o endereço LAN do servidor (por exemplo, `http://192.168.1.10:3000`), o nome desejado para o computador e a conta administradora ARGUS. É possível abrir os termos atuais pelo próprio assistente. Após o aceite, ele autentica a conta, solicita ao servidor um código de pareamento de uso único e o consome imediatamente para vincular o PC. A senha não é salva localmente; use somente uma rede confiável, pois o protótipo não oferece TLS no HTTP padrão. **Cancelar instalação** encerra o assistente sem parear o computador.
4. Após a configuração, o agente inicia e fica programado para iniciar quando a pessoa entrar no Windows. O arquivo `%LOCALAPPDATA%\ARGUS\Agent\config.json` contém o token do agente e a chave da ponte local; proteja-o. O menu ARGUS continua disponível para iniciar ou parar o agente depois.

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

O agente envia o primeiro heartbeat ao iniciar e continua no intervalo configurado (mínimo de cinco segundos). No Windows, também inicia `foreground-watcher.ps1` em segundo plano; **Parar agente** encerra o watcher. Se o computador parar de enviar heartbeats, o painel marca-o offline depois do limite configurado, 45 segundos por padrão. Para parear novamente, gere um novo código no painel e remova `deviceToken` e `connectionCode` antigos da configuração antes de iniciar o agente.

O histórico foreground medido é mantido no campo JSON de aplicações já existente no MySQL, sem exigir migração de tabela. O relatório individual usa hoje/7/30 dias e isola os dados da máquina aberta. Computadores já cadastrados começam a acumular medições ao instalar/atualizar o agente; uso passado não pode ser reconstruído. Totais estimados legados não são apresentados como tempo foreground real.

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
- **Computadores:** lista de endpoints, estado de conexão e métricas atuais; clicar em uma máquina abre seu detalhe individual com processos da última amostra e relatório de aplicações filtrável por hoje, 7 ou 30 dias.
- **Atividades:** eventos de conexão, desconexão e alertas.
- **Aplicações:** processos detectados e, no Windows, nome do processo em primeiro plano, duração foreground observada e mudanças de foco, separados por computador. O detalhe de cada máquina mostra totais por aplicação e distribuição diária, isolados daquele computador. A amostragem é limitada a 250 ms e ao agendamento do sistema; períodos sem entrada por 60 segundos são excluídos. Não lê conteúdo ou título de janela e não prova atenção humana. Sistemas sem watcher informam que não há medição, em vez de usar estimativas de heartbeat.
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
| `GET` | `/api/machines/:id?days=7` | Consultar detalhes e relatório foreground observado daquela máquina (1, 7 ou 30 dias) |
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

O comando `npm test` executa `scripts/smoke-test.js` neste próprio computador. O smoke test inicia a API em uma porta local livre com um adaptador MySQL em memória, executa o assistente local HTTP real com credenciais de teste e inicia um agente real de teste. Cobre autenticação, termos, instalador, assistente e cancelamento, sintaxe JavaScript/PowerShell, uma amostra real do watcher Windows, métricas, processos, deltas foreground/idempotência de lote, relatório isolado entre computadores, filtros de período, alertas, ponte de navegação, consentimento, exportação/exclusão e transições online/offline. Não instala serviços, altera a inicialização do Windows nem grava no MySQL normal. A validação da persistência MySQL real continua sendo manual.

Para validar a integração real com MySQL, configure o `.env`, inicie o backend e confira no log a conexão e a criação/verificação do esquema. Em seguida, crie uma conta, reinicie o backend e confirme que os dados persistiram.

## Estrutura de pastas

```text
.
├── agent/
│   ├── agent.js                 # coleta local, heartbeat e ponte do navegador
│   ├── foreground-watcher.ps1   # observação foreground/idle via APIs locais do Windows
│   ├── setup.js                 # assistente web local de autenticação e pareamento
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
