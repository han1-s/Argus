# ARGUS

O ARGUS tem duas partes: a **Platform**, que monitora computadores autorizados na rede local, e o **Web**, que oferece o site e uma API. As duas usam a mesma base MySQL.

## Instalação no Windows

Você vai precisar de Windows 10 ou 11 e MySQL Server 8 ou superior. O projeto completo usa Node.js 20.19+ ou 22.12+ LTS; o preparo tenta instalá-lo automaticamente pelo `winget`.

### 1. Prepare o MySQL

Instale o MySQL Server 8 ou superior e mantenha o serviço em execução. O MySQL Workbench facilita a execução do SQL abaixo. Crie uma base e um usuário para o ARGUS, trocando `SUA_SENHA_FORTE` por uma senha sua:

```sql
CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### 2. Prepare o ARGUS

1. Baixe o projeto como ZIP e extraia a pasta `Argus` em um local permanente. Não execute o programa de dentro do ZIP.
2. Abra `ARGUS.cmd` e escolha **Ferramentas > Preparar primeira instalação**.
3. O preparo instala as dependências e cria `Platform/.env` a partir de um modelo. Se o Node.js não estiver instalado, o CMD tenta instalá-lo com `winget`.
4. Quando o Bloco de Notas abrir, preencha `MYSQL_USER=argus_app`, `MYSQL_PASSWORD` com a senha criada no passo 1 e `MYSQL_DATABASE=argus`. Salve e feche o arquivo.

O `.env` guarda credenciais locais; não o compartilhe nem o envie ao GitHub. Ele é criado automaticamente, mas as credenciais do MySQL precisam ser preenchidas por você. Se o instalador acabou de instalar o Node.js e o CMD não o encontrar, feche o terminal, abra `ARGUS.cmd` novamente e repita o preparo.

O arquivo também define o e-mail e a senha da conta administradora inicial. Troque os valores de exemplo antes de usar o sistema em uma rede compartilhada.

### 3. Inicie os serviços

Deixe o MySQL em execução. No menu principal do `ARGUS.cmd`:

1. Escolha **2. Platform** e depois **1. Iniciar somente a API Platform**. O primeiro início cria as tabelas e abre o painel em <http://localhost:3000>.
2. Volte ao menu principal e escolha **1. Iniciar / controlar o Web**. O site abre em <http://localhost:5173/login>.

Na Platform, as opções **2**, **3** e **4** servem para parar o servidor, abrir os logs e voltar ao menu principal. Os serviços iniciados pelos CMDs rodam em segundo plano; os logs ficam em `%LOCALAPPDATA%\ARGUS\Logs`.

O Web Backend usa a porta `3001`, e o frontend usa a porta `5173`. O MySQL usa a porta `3306`. O Web e a Platform compartilham a mesma base; não é necessário iniciar duas instâncias do MySQL.

### Iniciar manualmente

Depois de preparar dependências, `.env` e MySQL, também é possível iniciar cada parte em um terminal separado:

```powershell
npm --prefix Platform start
npm --prefix Web/Backend start
npm --prefix Web/Frontend run dev
```

## Conectar um computador

No painel da Platform, escolha **Adicionar computador** e baixe `ARGUS.cmd`. Execute esse arquivo no computador autorizado e siga o assistente: informe o endereço LAN do servidor, dê um nome ao computador e use o código de conexão gerado no painel. O código é de uso único e expira em 15 minutos. Depois de conectado, o agente inicia em segundo plano quando o usuário entra no Windows.

O servidor e os computadores monitorados precisam estar na mesma rede local, e a porta `3000` deve estar acessível nos computadores. Para detalhes sobre a coleta, a extensão opcional e privacidade, consulte [Platform/README.md](Platform/README.md).

## Testes e verificações

Na raiz do projeto, `scripts/test-all.cmd` executa os testes da Platform e do Web Backend, o lint e o build do frontend e a auditoria das dependências. Para rodar as principais verificações manualmente:

```powershell
npm --prefix Platform test
npm --prefix Web/Backend test
npm --prefix Web/Frontend run lint
npm --prefix Web/Frontend run build
```

O teste de integração do Web Backend precisa de MySQL e da API Web ativos. Ele cria e remove contas temporárias:

```powershell
npm --prefix Web/Backend run test:integration
```

## Sobre os recursos do Web

- A recuperação de senha é demonstrativa: o código aparece na interface e nenhum e-mail real é enviado.
- Os planos e pagamentos são simulações. Nenhuma cobrança é processada; não use dados financeiros reais.
- Para baixar os componentes do agente, a Platform precisa estar ativa e acessível.

## Pastas principais

| Caminho | Conteúdo |
|---|---|
| `ARGUS.cmd` | Menu principal e preparo da instalação |
| `Platform/` | Painel, API, banco de dados, agente e extensão opcional |
| `Web/Backend/` | API do site |
| `Web/Frontend/` | Site em React e TypeScript |
| `scripts/` | Inicialização, parada e verificações do projeto |

## Créditos

- Haniel: frontend e Platform.
- Matheus: backend Web.
- Kaique: banco de dados geral.
- Demais integrantes: testes e outras contribuições.

Total de horas trabalhadas informado pela equipe: **61 horas**.
