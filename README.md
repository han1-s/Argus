# ARGUS

O ARGUS reúne um site e uma Platform para acompanhar computadores autorizados. As duas interfaces compartilham contas, sessões, planos e o banco MySQL. Os agentes enviam dados à API Platform; eles não acessam o banco diretamente.

## Equipe de desenvolvimento

Projeto desenvolvido pela equipe do curso de Informática para Internet do SENAI:

- Haniel Sousa e Souza — Prototipagem, interface e frontend.
- Gabriel Henrique Bispo Costa — Testes e documentação.
- Matheus Pereira de Jesus — Backend e banco de dados.
- Kaique de Souza Nunes da Silva — Banco de dados e testes.
- Rafaela Victoria do Rosário Portugal — Documentação.
- Tais Millena Bispo Caldas — Documentação.

Orientador: Prof. Adalberto Teixeira Santana — SENAI.

## Requisitos

- Windows 10 ou 11 no computador servidor.
- Node.js 20.19+ ou 22.12+ LTS. O instalador tenta obter Node.js LTS pelo `winget` quando necessário.
- MySQL Server 8 ou superior instalado no computador servidor.
- Rede local entre o servidor e os computadores autorizados.

## Instalar e iniciar

1. Extraia o projeto para uma pasta local; não execute arquivos dentro do ZIP.
2. Instale e inicie o MySQL no computador servidor.
3. Abra `ARGUS.cmd` e escolha **Instalar ou atualizar**. O instalador prepara as dependências do Web e da Platform.
4. Na primeira configuração, informe uma conta administradora local do MySQL e defina o e-mail e a senha inicial da conta ARGUS. O assistente cria o banco compartilhado, as tabelas e uma conta MySQL restrita ao próprio computador. Não é necessário executar `schema.sql` manualmente.
5. No menu principal, escolha **Iniciar Web + Platform**. O instalador abre o Web em <http://127.0.0.1:5173/login> e a Platform em <http://127.0.0.1:3000>. A API Web usa a porta local `3001`.

`Platform/database/schema.sql` é a definição canônica do banco compartilhado. Na inicialização, Web e Platform aplicam a mesma estrutura e atualizações compatíveis sem apagar os dados existentes. O arquivo local `Platform/.env` guarda as credenciais da aplicação; não o compartilhe.

O MySQL precisa continuar ativo durante o uso. **Parar serviços locais** encerra Web, Platform e o agente deste computador, mas deixa o MySQL ligado. A instalação e atualização também param as APIs locais antes de substituir dependências.

## Contas e planos

As contas Web e Platform usam o mesmo e-mail e senha. O cadastro feito em uma interface pode ser usado na outra. Os planos e limites também são compartilhados: Free permite até 10 computadores e 7 dias de retenção; Pro permite até 50 computadores e 90 dias; Business permite computadores ilimitados e 365 dias. Compras e pagamentos são simulados.

## Conectar um computador

1. Na Platform, escolha **Adicionar computador** e baixe `ARGUS.cmd`.
2. Execute o arquivo no computador autorizado. O assistente solicitará o endereço LAN do servidor, o nome do computador e o código de conexão exibido no painel.
3. Confirme os termos e aguarde o computador aparecer como online. O agente inicia com o Windows.

Se o endpoint não alcançar o servidor, permita conexões de entrada na porta `3000` para a rede privada nas configurações do Firewall do Windows.

O agente mantém uma fila local de até 20 mil amostras quando a API está indisponível e envia os dados pendentes quando a conexão volta. No intervalo padrão de 5 segundos, a fila corresponde a cerca de 27 horas. Ela fica em `%LOCALAPPDATA%\ARGUS\Agent\outbox.ndjson`; ao atingir o limite, as amostras mais antigas são descartadas.

## Dados e privacidade

- A extensão de navegador é opcional e coleta domínios somente após consentimento separado.
- Planos e pagamentos não geram cobranças reais.
- O ARGUS foi projetado para uma rede local. Não exponha as portas diretamente à internet.
- Consulte o [guia da Platform](Platform/README.md) para detalhes do agente, relatórios e extensão.

## Pastas principais

- `Platform/`: painel, API, banco, agente e extensão opcional.
- `Web/Backend/`: API do site.
- `Web/Frontend/`: interface do site.
- `scripts/`: instalador, inicialização, encerramento e utilitários locais.
## Independência do computador monitorado

O MySQL é necessário somente no computador principal que executa a Platform e o Web. No computador monitorado, o instalador prepara Node.js e o agente; não instala nem requer servidor ou banco de dados. Depois do pareamento inicial, o agente coleta mesmo quando perde acesso temporário à Platform: grava as amostras numa fila local em `%LOCALAPPDATA%\ARGUS\Agent\outbox.ndjson` e envia na ordem quando a conexão volta. O pareamento inicial ainda precisa alcançar o servidor principal.
