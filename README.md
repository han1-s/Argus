# ARGUS

O ARGUS reúne um site e uma plataforma para acompanhar computadores autorizados na mesma rede local. A Platform recebe dados dos agentes instalados nos computadores; o site usa a mesma conta e o mesmo banco MySQL.

## O que você precisa

- Windows 10 ou 11.
- Node.js 20.19+ ou 22.12+ (LTS). O instalador do ARGUS tenta instalar a versão LTS com `winget`.
- MySQL Server 8 ou superior, instalado e em execução no computador servidor.
- Uma rede local entre o servidor e os computadores autorizados.

## Instalar e iniciar

1. Baixe o projeto e extraia a pasta. Não execute os arquivos de dentro do ZIP.
2. No MySQL Workbench, crie o banco e o usuário do ARGUS. Troque `SUA_SENHA_FORTE` por uma senha sua:

   ```sql
   CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```

3. Abra `ARGUS.cmd` e escolha **Ferramentas > Preparar primeira instalação**. O instalador prepara as dependências e cria `Platform/.env`.
4. No arquivo `Platform/.env`, informe o usuário e a senha MySQL que você criou. Salve e feche o arquivo. Não compartilhe esse arquivo: ele contém credenciais.
5. No menu principal, escolha **2 > 1** para abrir o controle da Platform. Escolha **1** para preparar o servidor e, depois, **2** para iniciar o painel em <http://localhost:3000>.
6. Volte ao menu principal, escolha **1** e depois **1** para iniciar o site em <http://localhost:5173/login>.

O MySQL precisa continuar ativo enquanto o ARGUS estiver em uso. O Web Backend usa a porta `3001`; o Vite usa `5173` durante o desenvolvimento.

## Conectar um computador

No painel Platform, escolha **Adicionar computador** e baixe o instalador `ARGUS.cmd`. Execute-o no computador autorizado e informe o endereço LAN do servidor, por exemplo `http://192.168.1.10:3000`, além do código de conexão exibido no painel. Mais detalhes estão no [guia da Platform](Platform/README.md).

## Testes

Para rodar a suíte principal, abra `ARGUS.cmd` e escolha **Ferramentas > Executar verificações e testes**. Isso executa o smoke test da Platform, os testes do Web Backend, o lint e o build do frontend, além da auditoria de dependências.

Para rodar manualmente:

```powershell
npm --prefix Platform test
npm --prefix Web/Backend test
npm --prefix Web/Frontend run lint
npm --prefix Web/Frontend run build
```

O teste de integração do Web Backend exige que o MySQL e a API Web estejam ativos. Ele cria e remove contas de teste:

```powershell
npm --prefix Web/Backend run test:integration
```

## Limites do protótipo

- A recuperação de senha mostra um código de demonstração; não envia e-mail.
- Planos e pagamentos são simulados. Não há cobrança real.
- A extensão de navegador é opcional e coleta domínios somente após consentimento.
- O ARGUS foi feito para uma rede local. Não exponha as portas do serviço diretamente à internet.

## Pastas principais

- `Platform/`: painel, API, banco, agente e extensão opcional.
- `Web/Backend/`: API do site.
- `Web/Frontend/`: interface do site.
- `scripts/`: instalação, testes e encerramento dos serviços.
