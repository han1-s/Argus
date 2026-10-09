# ARGUS Web Backend

API Express do site em `Web/Frontend`. Este backend usa as variáveis MySQL de `Platform/.env` por padrão e opera sobre o schema `argus` da Platform: contas, hashes de senha, sessões, máquinas, eventos, alertas e atividade web. Não mantém um schema nem usuários paralelos.

## Iniciar localmente

1. Inicie o serviço MySQL uma vez.
2. Configure `Platform/.env` como descrito em `Platform/README.md`.
3. Em um terminal, inicie a API do console/agente:

```powershell
npm --prefix Platform start
```

4. Em outro terminal, inicie a API do site:

```powershell
npm --prefix Web/Backend start
```

5. Em um terceiro terminal, inicie o frontend:

```powershell
npm --prefix Web/Frontend run dev
```

O Web Backend usa `http://127.0.0.1:3001`; o frontend Vite encaminha `/api` para essa porta. A Platform continua na porta `3000`. Ambos abrem pool de conexões para o mesmo serviço MySQL local e a mesma base `argus`; não são necessárias duas instâncias do MySQL.

Para alterar a porta da API Web, configure `WEB_API_PORT`. Para apontar o Vite para outro host/porta, configure `VITE_API_TARGET`. Se o arquivo de ambiente não estiver em `Platform/.env`, informe `ARGUS_ENV_FILE` ao iniciar o backend Web.
O Web Backend gera o arquivo `ARGUS.cmd` diretamente. O endpoint que executar esse arquivo ainda precisa alcançar a Platform indicada no endereço informado durante o download.

## Testes

`npm test` executa os testes unitários do gerador de instalador e deixa a integração MySQL desativada por padrão. Para testar as rotas autenticadas, inicie o MySQL e a API Web, depois execute na raiz do repositório:

```powershell
npm --prefix Web/Backend run test:integration
```

O teste ativa a integração automaticamente, usa a base configurada em `Platform/.env`, exige que a API Web esteja ativa, cria contas com endereços aleatórios em `example.invalid`, insere dados de máquina temporários e os remove ao terminar. Não execute esse teste contra uma base com dados que não possam ser alterados.

## Rotas

- `POST /api/auth/signup` e `POST /api/auth/register`: cria usuário na tabela compartilhada `users`.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` e `GET /api/auth/profile`: usa a sessão compartilhada em `sessions` e cookie HttpOnly `argus_session`.
- `GET /api/dashboard`, `/api/maquinas`, `/api/atividades`, `/api/relatorios` e `/api/alertas`: consulta os dados existentes da conta autenticada.
- `POST /api/alertas/:id/ack`: reconhece alerta pertencente à conta.
- `GET /api/assinatura` e `PUT /api/assinatura`: consulta e persiste a seleção de plano demonstrativa.
- `GET /api/notificacoes`: lista eventos e alertas da Platform associados à conta autenticada.
- `POST /api/auth/forgot-password` e `POST /api/auth/reset-password`: recuperação demonstrativa por código temporário; não envia e-mail real.
- `GET /api/legal/terms` e `GET /api/health`: termos atuais e estado da conexão com MySQL.
- `GET /downloads/ARGUS.cmd?server=http://host:3000`: encaminha o instalador gerado pela Platform para conectar um endpoint ao servidor.

Assinaturas não processam cobranças. A área de download precisa alcançar uma Platform ativa para obter o instalador.
