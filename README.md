# ARGUS

ARGUS reúne um site de apresentação (`Web/`) e uma plataforma de monitoramento para computadores autorizados em uma rede local (`Platform/`). O site e a Platform são processos independentes. O Web Backend e a Platform compartilham a mesma base MySQL `argus`, incluindo contas e sessões; o site pode consultar dados da Platform para exibir máquinas, eventos, alertas e notificações da conta autenticada.

## Instalação completa no Windows

### Pré-requisitos

- Windows 10 ou 11.
- MySQL Server 8 ou superior instalado no computador servidor. O [MySQL Installer oficial](https://dev.mysql.com/downloads/installer/) pode instalar o servidor e o MySQL Workbench; o Workbench é a interface gráfica usada nos passos abaixo.
- Rede local entre o servidor e os computadores que serão monitorados.
- O Node.js LTS é instalado pelo CMD principal com `winget` quando possível. Sem `winget`, instale [Node.js LTS](https://nodejs.org/) manualmente e abra um novo CMD. O Web requer Node.js 20.19+ ou 22.12+.

### Instalação guiada em um Windows recém-instalado

1. Baixe o projeto como ZIP do GitHub e extraia a pasta `Argus` para um local permanente, por exemplo `Documentos\Argus`. Não execute o projeto de dentro do ZIP.
2. Instale o MySQL Server. Durante a configuração, anote a senha de `root`, mantenha o serviço MySQL iniciado e instale o Workbench para executar o SQL.
3. Abra o Workbench, conecte-se ao servidor local usando a senha de `root` e abra uma aba SQL. Crie a base e um usuário exclusivo do ARGUS. Troque `SUA_SENHA_FORTE` por uma senha criada por você e execute:

```sql
CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

4. Na pasta extraída, dê duplo clique em `ARGUS.cmd`. Abra **Ferramentas > Preparar primeira instalação**. O CMD tenta instalar Node.js LTS pelo `winget` se necessário, instala as dependências dos três projetos e cria `Platform/.env` a partir do modelo.
5. Quando o Bloco de Notas abrir, confirme `MYSQL_HOST=127.0.0.1`, `MYSQL_PORT=3306`, `MYSQL_USER=argus_app`, `MYSQL_PASSWORD` com a mesma senha do SQL e `MYSQL_DATABASE=argus`. Salve e feche o arquivo. Não compartilhe `Platform/.env`; ele contém credenciais e é ignorado pelo Git. Se o CMD disser que Node.js foi recém-instalado mas não reconhece `node`, feche e abra `ARGUS.cmd` novamente.
6. No menu principal, escolha **2 > 1 (Preparar servidor)**. Essa etapa também confirma/cria as dependências da Platform e preserva o `.env` configurado.
7. Ainda no menu da Platform, escolha **2 (Iniciar servidor)**. O primeiro início cria as tabelas automaticamente no banco `argus` e abre o painel em `http://localhost:3000`. A conta inicial é definida por `ARGUS_ADMIN_EMAIL` e `ARGUS_ADMIN_PASSWORD` no `.env`; altere os valores padrão antes de usar em uma rede compartilhada.
8. Volte ao menu principal e escolha **1** para iniciar o Web. Ele inicia API e frontend juntos e abre `http://localhost:5173/login`. O Web compartilha a mesma base MySQL e as tabelas criadas pela Platform.

Se `winget` não existir no Windows, instale Node.js LTS pelo site oficial, reabra o CMD e repita a etapa 4. Se a instalação do MySQL não estiver pronta, conclua a instalação, inicie o serviço MySQL e só então inicie a Platform ou o Web.

### Menu principal e portas

No menu principal, escolha **1** para iniciar/controlar o Web, **2** para abrir o menu da Platform, **3** para preparar dependências, executar testes ou abrir este README, **4** para encerrar os serviços ARGUS desta máquina ou **5** para sair. Os processos de servidor rodam em segundo plano; os logs ficam em `%LOCALAPPDATA%\ARGUS\Logs`. Se o Edge não estiver instalado, o navegador padrão será usado. A Platform usa a porta `3000`; o Web Backend `3001` e o Vite `5173` durante o desenvolvimento. O MySQL usa `3306` e deve permanecer em execução. Para iniciar manualmente, depois de instalar Node, dependências, banco e `.env`:

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
- Assinatura Free, Pro ou Business guardada na tabela `subscriptions`. O checkout demonstra PIX, crédito e débito e registra transações em `payment_transactions`; não há cobrança real. Do cartão, somente bandeira e quatro últimos dígitos são salvos. Nunca use dados financeiros reais neste modo.
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

Total de horas trabalhadas informado pela equipe: **61 horas**.

## Organização

```text
ARGUS.cmd                    Menu principal
scripts/                     Instalação conjunta de dependências
Platform/                    Painel, API, banco, agente e extensão opcional
Web/Backend/                 API Express do site
Web/Frontend/                Site React + TypeScript + Vite
```
