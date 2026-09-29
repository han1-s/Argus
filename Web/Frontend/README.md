# ARGUS — Frontend

Interface web do ARGUS, construída com React, TypeScript e Vite. Este guia tem duas partes: um início rápido para abrir o site e uma referência mais completa para desenvolvimento.

## Início rápido

### 1. Instale Node.js e npm

O projeto precisa do Node.js e do npm. Se ainda não estiverem instalados, instale o Node.js pela página oficial: <https://nodejs.org/>. O npm é incluído com o Node.js.

Para conferir se estão disponíveis, abra o Terminal, PowerShell ou Prompt de Comando e execute:

```bash
node --version
npm --version
```

### 2. Abra a pasta do frontend

No terminal, entre na pasta `Argus/Frontend`, onde está o arquivo `package.json`.

```bash
cd caminho/para/Argus/Frontend
```

Por exemplo, se o projeto estiver em `C:\Projetos\Argus` no Windows:

```powershell
cd C:\Projetos\Argus\Argus\Frontend
```

### 3. Instale as dependências

Execute este comando dentro de `Frontend`:

```bash
npm install
```

Ele lê o `package.json` e instala as bibliotecas necessárias. Só é preciso repetir a instalação se as dependências forem alteradas ou se a pasta `node_modules` não estiver presente.

### 4. Inicie o site

```bash
npm run dev
```

Abra no navegador o endereço local exibido no terminal — normalmente <http://localhost:5173/>. Mantenha o terminal aberto enquanto estiver trabalhando no site. Para encerrar o servidor, pressione `Ctrl+C`.

## Guia de desenvolvimento

### Comandos disponíveis

| Comando | Para que serve |
| --- | --- |
| `npm install` | Instala as dependências descritas no `package.json` e registradas no `package-lock.json`. |
| `npm run dev` | Inicia o servidor local do Vite com atualização rápida durante o desenvolvimento. |
| `npm run build` | Verifica e compila o projeto para produção na pasta `dist`. |
| `npm run preview` | Abre localmente uma prévia do conteúdo já compilado em `dist`. Rode `npm run build` antes. |
| `npm run lint` | Analisa os arquivos com ESLint e aponta problemas de código. |

### Fluxo de trabalho sugerido

1. Entre em `Argus/Frontend`.
2. Rode `npm install` se esta for a primeira execução ou se as dependências mudaram.
3. Rode `npm run dev` e faça as alterações com o servidor local ativo.
4. Antes de compartilhar uma alteração, rode `npm run lint` e `npm run build`.
5. Para conferir a versão de produção localmente, rode `npm run preview` depois do build.

O servidor de desenvolvimento e a prévia são locais. Para publicar o site, é necessário configurar um serviço de hospedagem e implantação separadamente.

### Estrutura principal

```text
Frontend/
├── public/                 # Arquivos públicos servidos sem processamento
├── src/
│   ├── components/         # Componentes compartilhados, como cabeçalho e rodapé
│   ├── layouts/            # Estruturas compartilhadas de páginas
│   ├── pages/              # Páginas: Home, Saiba Mais, Planos, Download etc.
│   ├── services/           # Preferências locais, autenticação demonstrativa e dados
│   ├── styles/             # Estilos e animações compartilhados
│   ├── App.tsx             # Rotas da aplicação
│   └── main.tsx            # Inicialização do React
├── package.json            # Dependências e comandos npm
├── package-lock.json       # Versões instaladas e árvore de dependências
└── vite.config.ts          # Configuração do Vite
```

### Dependências

As dependências principais incluem React e React DOM para a interface, React Router para navegação, Lucide React para ícones e Vite para desenvolvimento e build. TypeScript e ESLint são usados para tipagem e análise do código.

Para adicionar uma biblioteca de runtime, use:

```bash
npm install nome-da-biblioteca
```

Para adicionar uma ferramenta utilizada apenas durante o desenvolvimento, use:

```bash
npm install --save-dev nome-da-ferramenta
```

O npm atualiza `package.json` e `package-lock.json`; mantenha ambos no controle de versão.

### Sobre os fluxos demonstrativos

Algumas interações do frontend, incluindo a autenticação e a contratação de planos, são demonstrativas e usam armazenamento local do navegador. Elas não substituem um backend nem validam credenciais, pagamentos ou dados em um servidor. Consulte a indicação exibida na própria tela antes de tratar uma informação como dado operacional.

### Problemas comuns

- **`npm` não é reconhecido:** instale o Node.js e abra um terminal novo para atualizar o `PATH`.
- **O endereço local não abre:** confirme que `npm run dev` ainda está ativo e use o endereço exato impresso no terminal.
- **A porta já está em uso:** o Vite pode escolher outra porta; confira a mensagem do terminal.
- **Instalação de dependências inconsistente:** na pasta `Frontend`, rode `npm install` novamente e aguarde sua conclusão antes de iniciar o servidor.
- **A prévia não encontra `dist`:** gere a compilação primeiro com `npm run build`.
