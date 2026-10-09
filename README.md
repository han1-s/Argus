# ARGUS

O ARGUS reúne um site e uma plataforma para acompanhar computadores autorizados na mesma rede local. A Platform recebe dados dos agentes instalados nos computadores; o site usa a mesma conta e o mesmo banco MySQL.

## O que você precisa

- Windows 10 ou 11.
- Node.js 20.19+ ou 22.12+ (LTS). O instalador do ARGUS tenta instalar a versão LTS com `winget`.
- MySQL Server 8 ou superior, instalado e em execução no computador servidor.
- Uma rede local entre o servidor e os computadores autorizados.

## Instalar e iniciar

1. Baixe e extraia o projeto. Não execute arquivos de dentro do ZIP.
2. Instale e inicie o MySQL no computador servidor.
3. No MySQL Workbench, abra `Platform/database/schema.sql`. Copie todo o conteúdo, cole em uma nova consulta SQL e clique em **Executar**. Isso cria o banco `argus` e as tabelas.
4. Crie um usuário para o ARGUS no MySQL. Troque `SUA_SENHA_FORTE` por uma senha sua:

```sql
CREATE USER IF NOT EXISTS 'argus_app'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON argus.* TO 'argus_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

5. Abra `ARGUS.cmd` e escolha **Ferramentas > Preparar primeira instalação**.
6. Confira `Platform/.env`: informe `MYSQL_USER=argus_app`, a senha criada e `MYSQL_DATABASE=argus`. Não compartilhe esse arquivo: ele guarda credenciais.
7. No menu principal, escolha **2 > 1** para abrir o controle da Platform. Escolha **1** para preparar o servidor e **2** para iniciá-lo em <http://localhost:3000>.
8. Para iniciar o site, volte ao menu principal e escolha **1 > 1**. Ele abre em <http://localhost:5173/login>.

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
