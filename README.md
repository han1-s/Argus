# ARGUS

ARGUS reúne um site de apresentação (`Web/`) e uma plataforma de monitoramento para computadores autorizados em uma rede local (`Platform/`). O site e a Platform são processos independentes. O Web Backend e a Platform compartilham a mesma base MySQL `argus`, incluindo contas e sessões; o site pode consultar dados da Platform para exibir máquinas, eventos, alertas e notificações da conta autenticada.

## Instalação completa no Windows

### Requisitos

- Windows 10 ou 11.
- Node.js 20.19 ou superior, ou 22.12 ou superior (inclui npm; exigido pelo Vite do Web Frontend).
- MySQL 8 ou superior em execução no computador servidor.
- Rede local entre o servidor e os computadores que serão monitorados.

### Preparar o banco

Crie a base e um usuário MySQL para o ARGUS. Execute no MySQL Workbench ou no console, trocando a senha:

```sql
CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Copie `Platform/.env.example` para `Platform/.env` e configure `MYSQL_USER=argus_app`, `MYSQL_PASSWORD`, `MYSQL_DATABASE=argus` e `MYSQL_AUTO_CREATE_DATABASE=false`. Mantenha o `.env` privado. O primeiro início prepara o administrador definido em `ARGUS_ADMIN_EMAIL` e `ARGUS_ADMIN_PASSWORD` (padrão local: `hanielshz@gmail.com` / `12345678`); altere esses valores antes de usar em rede compartilhada.

### Instalar dependências e iniciar

Execute `ARGUS.cmd` na raiz. Na primeira execução, escolha **Instalar todas as dependências** para instalar os pacotes da Platform, Web Backend e Web Frontend em sequência. O comando informa qual etapa falhou caso ocorra um erro. Também é possível executar `scripts/install-dependencies.cmd` diretamente.

No menu principal, escolha **Iniciar ARGUS Web** para iniciar backend e frontend em segundo plano na mesma janela e abrir a tela de login. No menu Web, você pode parar os serviços ou abrir os logs. Para a Platform, abra seu menu e escolha o painel de controle, somente a API, **Parar o servidor da Platform** ou abrir seus logs. Os serviços iniciados pelos menus rodam em segundo plano; a Platform usa a porta `3000`, o Web Backend `3001` e o Vite `5173` durante o desenvolvimento. Para abrir manualmente:

```powershell
npm --prefix Platform start
npm --prefix Web/Backend start
npm --prefix Web/Frontend run dev
```

Deixe o MySQL em execução. A Platform fica em `http://localhost:3000` e o site em `http://localhost:5173`. O Vite encaminha as chamadas `/api` ao Web Backend. Ambos os backends usam `Platform/.env` e a mesma base MySQL; não inicie duas instâncias do MySQL.

### Conectar computadores autorizados

No painel Platform, use **Adicionar computador**, baixe `ARGUS.cmd` e execute-o no endpoint autorizado. O assistente pede o endereço LAN do servidor, o nome do computador e a autenticação da conta ARGUS. Consulte [Platform/README.md](Platform/README.md) para configuração detalhada, extensão opcional e privacidade.

## Recursos Web

- Cadastro, login e sessão por cookie HttpOnly no banco compartilhado.
- Recuperação de senha demonstrativa: o sistema gera um código temporário e o mostra na interface como simulação de e-mail. Nenhuma mensagem é enviada por um provedor de e-mail.
- Assinatura Free, Pro ou Business guardada na tabela `subscriptions`. A seleção é demonstrativa e não processa pagamentos.
- Configurações da conta e preferências locais; a seção de notificações consulta eventos e alertas da Platform associados à conta.
- Página de download gera o `ARGUS.cmd` pelo Web Backend. A Platform precisa estar ativa e acessível quando o instalador for executado para obter os componentes do agente.

## Verificação

Na raiz, execute `scripts/test-all.cmd` para rodar o smoke test da Platform, testes do Web Backend, lint e build do Frontend e auditoria das dependências, em sequência. Também é possível executar as verificações manualmente:

```powershell
npm --prefix Platform test
npm --prefix Web/Backend test
npm --prefix Web/Frontend run lint
npm --prefix Web/Frontend run build
```

Para incluir o teste de integração MySQL do Web Backend, mantenha MySQL e API Web ativos e rode `npm --prefix Web/Backend run test:integration` (ele cria e remove contas de teste). `npm --prefix Web/Backend test` também executa essa integração quando `ARGUS_RUN_MYSQL_INTEGRATION_TESTS=1`. O smoke test da Platform usa armazenamento de teste e cobre backend, instalador, agente e watcher Windows. Não há envio real de e-mail nem cobrança real.

## Créditos e horas

- Haniel: frontend e Platform.
- Matheus: backend Web.
- Kaique: banco de dados geral.
- Demais integrantes da equipe: testes e demais contribuições do projeto.

Estimativa informada pela equipe: aproximadamente **53 horas** no total. O valor ainda precisa de confirmação pelos registros de trabalho.

## Organização

```text
ARGUS.cmd                    Menu principal
scripts/                     Instalação conjunta de dependências
Platform/                    Painel, API, banco, agente e extensão opcional
Web/Backend/                 API Express do site
Web/Frontend/                Site React + TypeScript + Vite
```
