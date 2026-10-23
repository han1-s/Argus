# ARGUS

O ARGUS reúne um site e uma Platform para acompanhar computadores autorizados. As duas interfaces compartilham contas, sessões, planos, perfil e o banco MySQL. Os agentes enviam dados à API Platform; eles não acessam o banco diretamente.

## Proposta e estado atual

O protótipo está concluído de acordo com a proposta definida para o projeto: oferece o painel Web e a Platform, cadastro e acompanhamento de computadores autorizados, coleta local com envio posterior quando a conexão retorna, configurações de perfil compartilhadas e planos demonstrativos. As interfaces incluem temas escuro, claro e cinza, além de um assistente acessível nos dois ambientes.

O ARGUS é um protótipo acadêmico voltado a uma rede local. Recursos de compra e pagamento são simulados; consulte as informações de privacidade e os limites descritos neste guia antes de instalar.

## Equipe de desenvolvimento

Projeto desenvolvido pela equipe do curso de Informática para Internet do SENAI:

- Haniel Sousa e Souza — Prototipagem, interface e frontend.
- Gabriel Henrique Bispo Costa — Testes e documentação.
- Matheus Pereira de Jesus — Backend e banco de dados.
- Kaique de Souza Nunes da Silva — Banco de dados e testes.
- Rafaela Victoria do Rosário Portugal — Documentação.
- Tais Millena Bispo Caldas — Documentação.

Orientador: Prof. Adalberto Teixeira Santana — SENAI.

## Agradecimentos e carga horária

A equipe agradece ao SENAI, ao orientador, aos professores, colegas e a todas as pessoas que contribuíram com ideias, orientação, testes, feedback e apoio durante o desenvolvimento.

Carga horária total trabalhada pela equipe: **72 horas**.

## Requisitos

- Windows 10 ou 11 no computador servidor.
- Node.js 20.19+ ou 22.12+ LTS. O instalador tenta obter Node.js LTS pelo `winget` quando necessário.
- MySQL Server 8 ou superior instalado no computador servidor.
- Rede local entre o servidor e os computadores autorizados.

## Instalação final: computador principal

1. Use um computador Windows 10 ou 11 como servidor e extraia o projeto para uma pasta local. Não execute os arquivos dentro do ZIP.
2. Instale o MySQL Server 8 ou superior nesse computador e mantenha o serviço iniciado. O instalador do ARGUS não instala o MySQL.
3. Abra `ARGUS.cmd` na pasta extraída e escolha **Instalar ou atualizar**. O processo prepara Node.js LTS, quando necessário, e instala as dependências do Web e da Platform.
4. Na primeira configuração, informe o endereço, a porta, o nome do banco e as credenciais de uma conta administradora do MySQL. Em seguida, defina o e-mail e a senha inicial da conta ARGUS. O assistente cria o banco compartilhado, aplica as tabelas e cria um usuário MySQL de aplicação restrito ao próprio computador. Não é necessário executar `schema.sql` manualmente.
5. Quando a instalação terminar, volte ao menu `ARGUS.cmd` e escolha **Iniciar Web + Platform**. O Web abre em <http://127.0.0.1:5173/login> e a Platform em <http://127.0.0.1:3000>. A API Web usa a porta local `3001`.
6. Entre com a conta inicial definida durante a configuração. Contas criadas no Web também podem ser usadas na Platform, e vice-versa.

Para iniciar somente o Web, escolha **Iniciar somente Web**. Para iniciar, parar ou ver os logs da Platform e do agente local, escolha **Abrir controles da Platform e agentes**. **Parar serviços locais** encerra Web, Platform e o agente deste computador, mas deixa o MySQL ligado. O MySQL deve permanecer ativo enquanto o sistema estiver em uso.

`Platform/database/schema.sql` é a definição canônica do banco compartilhado. Na inicialização, Web e Platform aplicam a mesma estrutura e atualizações compatíveis sem apagar os dados existentes. O arquivo local `Platform/.env` guarda as credenciais da aplicação; não o compartilhe.

## Contas e planos

As contas Web e Platform usam o mesmo e-mail e senha. Cadastro, foto e dados de perfil são compartilhados entre as interfaces; a alteração de senha também vale para as duas. Os planos e limites são compartilhados: Free permite até 10 computadores e 7 dias de retenção; Pro permite até 50 computadores e 90 dias; Business permite computadores ilimitados e 365 dias. Compras e pagamentos são simulados.

## Instalação final: computadores monitorados

1. Confirme que o computador principal e o computador monitorado estão na mesma rede local e que o serviço Platform está em execução.
2. Na Platform, escolha **Adicionar computador**, gere o código de conexão e baixe o arquivo `ARGUS.cmd`.
3. No computador autorizado, execute o arquivo baixado. O assistente instalará o necessário para o agente; esse computador não precisa de MySQL nem de banco de dados próprio.
4. Informe o endereço LAN do servidor (por exemplo, `http://192.168.1.10:3000`), o nome do computador e o código de conexão. O código expira em 15 minutos e só pode ser usado uma vez.
5. Leia e aceite os termos. Quando o computador aparecer como online, o agente estará instalado para iniciar com o Windows.

Se o endpoint não alcançar o servidor, permita conexões de entrada na porta `3000` para a rede privada nas configurações do Firewall do Windows.

Após o pareamento, o agente coleta mesmo durante uma indisponibilidade temporária da API: mantém uma fila local de até 20 mil amostras e envia os dados pendentes quando a conexão volta. No intervalo padrão de 5 segundos, a fila corresponde a cerca de 27 horas. Ela fica em `%LOCALAPPDATA%\ARGUS\Agent\outbox.ndjson`; ao atingir o limite, as amostras mais antigas são descartadas. O primeiro pareamento exige acesso ao servidor.

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
