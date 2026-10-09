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
3. No MySQL Workbench, abra `Platform/database/schema.sql`. Copie todo o conteúdo, cole em uma nova consulta SQL e clique em **Executar**. Isso cria o banco `argus` e suas tabelas.
4. Abra `ARGUS.cmd`. No menu inicial, escolha **3 > 1** para preparar a instalação.
5. Confira `Platform/.env`. Configure `MYSQL_USER` e `MYSQL_PASSWORD` com uma conta MySQL que já exista (por exemplo, a mesma usada para conectar no Workbench) e deixe `MYSQL_DATABASE=argus`. Esses dados conectam o ARGUS ao banco; não são o cadastro da conta do sistema.
6. No menu inicial, escolha **2** para abrir o menu da Platform. Escolha **1** para abrir o controle e, nele, **1** para preparar o servidor e **2** para iniciar o painel em <http://localhost:3000>.
7. Para iniciar o Web, volte ao menu inicial, escolha **1** e depois **1 (Iniciar Web)**. Ele abre em <http://localhost:5173/login>.

O cadastro de acesso ao ARGUS é feito na tela pelo botão **Criar conta**. O MySQL precisa continuar ativo enquanto o sistema estiver em uso.

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
