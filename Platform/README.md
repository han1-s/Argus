# ARGUS Platform

Este guia mostra como instalar e usar a **Platform**, o protótipo local do ARGUS. `Web/Frontend` e `Web/Backend` são aplicações separadas do site. O Web Backend compartilha com a Platform a base MySQL `argus`, contas e sessões; as aplicações continuam sendo processos independentes.

O ARGUS foi feito para computadores autorizados em uma rede local. Não o exponha diretamente à internet.

## Como funciona

- Um computador servidor executa o painel, a API e o MySQL.
- Cada computador autorizado executa o agente ARGUS e envia métricas e informações de processos ao servidor.
- No Windows, o agente também observa qual aplicativo está em primeiro plano e mede esse tempo localmente.
- A extensão de navegador é opcional. Ela envia somente domínio e duração aproximada, após consentimento separado.

```text
PC monitorado: agente ARGUS ── rede local ──> PC servidor: API + painel + MySQL
               extensão opcional ── loopback ──> agente
```

O agente nunca acessa o MySQL diretamente. A porta `3306` do banco deve ficar disponível somente no computador servidor.

## Requisitos

- Windows 10/11 no servidor e nos computadores que serão conectados pelo instalador guiado.
- Node.js 18 ou superior no computador servidor. Nos endpoints, o instalador tenta instalar Node.js LTS usando `winget` se necessário.
- MySQL 8 ou superior instalado e em execução no computador servidor.
- Rede local entre servidor e endpoints; permitir a porta `3000` no firewall do servidor.

## 1. Preparar o servidor

1. Instale e inicie o MySQL no computador que será o servidor.
2. Crie uma base e um usuário exclusivos para o ARGUS. No MySQL Workbench ou console MySQL, execute:

   ```sql
   CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```

3. Abra PowerShell na pasta `Platform` e instale as dependências:

   ```powershell
   npm install
   ```

4. Se ainda não existir, crie `Platform/.env` copiando `.env.example`. Configure nele `MYSQL_USER=argus_app`, `MYSQL_PASSWORD` com a senha que escolheu, `MYSQL_DATABASE=argus` e `MYSQL_AUTO_CREATE_DATABASE=false`. O arquivo `.env` contém segredos locais: não o publique nem o envie para outras pessoas.
5. O primeiro início cria ou atualiza uma única vez o administrador inicial configurado por `ARGUS_ADMIN_EMAIL` e `ARGUS_ADMIN_PASSWORD` (padrão local: `hanielshz@gmail.com` / `12345678`). Um marcador no mesmo MySQL impede que reinícios restaurem a senha; altere os valores antes de usar em ambiente compartilhado.
5. Inicie o servidor:

   ```powershell
   npm start
   ```

6. No próprio servidor, abra <http://localhost:3000>, crie a conta administradora e aceite os termos.

Também é possível abrir `Platform/ARGUS.cmd` e escolher **Preparar servidor** e depois **Iniciar servidor e abrir o painel**. O MySQL precisa estar iniciado antes.

## 2. Conectar um computador

Repita estes passos em cada endpoint autorizado:

1. No painel ARGUS do servidor, clique em **Adicionar computador** e baixe o `ARGUS.cmd`.
2. Copie o código exibido no painel. Ele expira em 15 minutos e só pode ser usado uma vez.
3. Leve o arquivo ao computador que será monitorado e execute-o. Confirme a instalação quando o Windows solicitar.
4. O assistente local abrirá no navegador. Informe:
   - o endereço LAN do servidor, por exemplo `http://192.168.1.10:3000`;
   - um nome para este computador;
   - o código de conexão copiado do painel.
5. Leia e aceite os termos e aguarde o painel indicar o computador como online. Não é necessário entrar com e-mail ou senha neste computador.

O endereço `127.0.0.1` do assistente é local ao endpoint; ele **não** é o endereço do servidor. Use o IP LAN do computador que executa a Platform. O botão **Cancelar instalação** encerra o assistente sem conectar o PC.

Após conectar, o agente inicia com o Windows. Para parar ou iniciar o agente, use o `ARGUS.cmd` de controle no próprio endpoint. A opção de parar encerra também o observador foreground.

## 3. Ver computadores e uso de aplicações

- **Visão geral** mostra computadores conectados, estado, recursos e alertas.
- Abra **Computadores** e clique em uma linha para ver somente aquele PC.
- O detalhe individual mostra métricas, processos detectados e o **Relatório de uso em primeiro plano**. Selecione hoje, 7 ou 30 dias.
- **Aplicações** mostra nomes de aplicações por computador. O tempo medido e as mudanças para primeiro plano vêm do Windows.
- Se o watcher não estiver ativo ou o sistema não for Windows, o painel informa que a medição foreground está indisponível; não substitui o valor por uma estimativa de processo.

### O que o tempo foreground significa

No Windows, o watcher consulta a janela em primeiro plano e o estado de inatividade usando APIs locais do sistema, em amostras de aproximadamente 250 ms. Não lê título da janela, texto, documentos, teclas, credenciais ou conteúdo. Após 60 segundos sem teclado ou mouse, os intervalos são tratados como inativos.

É uma medida do tempo em que um aplicativo esteve em primeiro plano enquanto havia entrada recente, não uma prova de atenção humana ou produtividade. O escalonamento do Windows e mudanças muito rápidas podem afetar a resolução. O ARGUS não requer modo desenvolvedor nem execução elevada. O tempo começa a ser medido após instalar esta versão; atividade passada não pode ser reconstruída.

## 4. Navegação web opcional

Esta coleta é separada da medição de aplicações e começa desativada.

1. Informe previamente as pessoas afetadas e confirme que a coleta está autorizada.
2. No servidor, habilite **Permitir coleta web** em **Configurações**.
3. No Chrome ou Edge do endpoint, abra `chrome://extensions` ou `edge://extensions`, habilite o modo do desenvolvedor e carregue sem compactação `Platform/browser-extension`.
4. Abra o popup **ARGUS WEB**, informe o `bridgeKey` e a porta `bridgePort` do arquivo `%LOCALAPPDATA%\ARGUS\Agent\config.json`, confirme a informação aos titulares e ative a coleta.

A extensão envia apenas domínio e duração aproximada da aba HTTP/HTTPS ativa, não a URL completa nem o conteúdo da página. Desative a opção em Configurações para revogar; o histórico web da conta é apagado.

## 5. Testar o projeto

Na raiz do repositório:

```powershell
npm --prefix Platform test
npm --prefix Web/Frontend run lint
npm --prefix Web/Frontend run build
```

O teste da Platform usa uma base MySQL em memória e endpoints locais temporários. No Windows, também executa uma amostra do watcher foreground. Não modifica a base MySQL normal nem instala o agente no computador. `Web/Frontend` e `Web/Backend` são as camadas do site; inicie `npm --prefix Web/Backend start` e `npm --prefix Web/Frontend run dev`. O Vite encaminha `/api` para `http://127.0.0.1:3001`. A API Web e a API Platform usam as mesmas credenciais, sessões e tabelas no mesmo serviço e banco MySQL; veja `Web/Backend/README.md` para iniciar todas as partes.

## Problemas comuns

- **O endpoint não encontra o servidor:** confira o IP LAN do computador servidor, confirme que ambos estão na mesma rede e permita a porta `3000` no firewall do servidor.
- **O painel não inicia ou mostra erro MySQL:** confira se o serviço MySQL está em execução e se usuário, senha e base no `.env` estão corretos. Não compartilhe esse arquivo.
- **O computador aparece offline:** confira se o agente está em execução e se consegue acessar `http://IP-DO-SERVIDOR:3000`.
- **Relatório diz “Medição indisponível”:** a medição foreground depende do watcher PowerShell instalado pelo `ARGUS.cmd` em Windows. Execute novamente a instalação guiada ou confira os logs em `%LOCALAPPDATA%\ARGUS\Logs`.
- **Não há atividade anterior à instalação:** isso é esperado; o sistema não reconstrói uso passado.

## Segurança e privacidade

- Use somente em computadores autorizados e rede confiável. HTTP na LAN não usa TLS nesta versão.
- Proteja `%LOCALAPPDATA%\ARGUS\Agent\config.json`: ele contém o token do agente e a chave da extensão.
- A senha da conta usada no assistente não é gravada no PC monitorado.
- A extensão é opcional e exige consentimento separado.
- O projeto é um protótipo acadêmico; os termos não substituem análise jurídica nem informam automaticamente as pessoas monitoradas.

## Pastas principais

| Pasta/arquivo | Para que serve |
|---|---|
| `agent/` | Agente, assistente local e watcher foreground Windows |
| `backend/` | API, autenticação, heartbeats e relatórios |
| `database/` | Esquema MySQL e adaptador de persistência |
| `frontend/` | Painel administrativo da Platform |
| `browser-extension/` | Extensão opcional Chromium |
| `scripts/` | Controlador Windows e smoke test |
| `ARGUS.cmd` | Menu de instalação, início e parada |

## Créditos

- Haniel: frontend e Platform.
- Matheus: backend Web.
- Kaique: banco de dados geral.
- Demais integrantes: testes e outras contribuições.

Estimativa informada pela equipe: aproximadamente **53 horas** trabalhadas no projeto; confirmar com os registros da equipe.
