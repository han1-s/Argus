# 🔭 Argus

> **Sistema de monitoramento e análise de utilização de computadores em ambientes corporativos.**

O **Argus** é uma plataforma corporativa em desenvolvimento, criada no contexto do curso técnico de **Informática para Internet do SENAI**, com o objetivo de auxiliar no monitoramento, organização e análise da utilização de computadores em ambientes empresariais.

A proposta do projeto é transformar dados relacionados à utilização de computadores, sites e aplicações em **informações organizadas e visualizações que possam auxiliar na análise de produtividade e no gerenciamento do ambiente de TI**.

Atualmente, o projeto encontra-se em processo de **refatoração e reconstrução**, passando por melhorias na interface, identidade visual, organização do código e arquitetura da aplicação.

---

# 📌 Sobre o Projeto

O Argus surgiu a partir da ideia de desenvolver uma solução capaz de oferecer maior visibilidade sobre a utilização dos recursos computacionais de uma organização.

Em ambientes corporativos, computadores são ferramentas essenciais para a execução das atividades profissionais. Entretanto, informações sobre sua utilização podem estar dispersas ou serem difíceis de analisar.

O Argus busca centralizar essas informações e apresentá-las de forma organizada através de uma plataforma web.

A solução foi planejada para trabalhar com informações como:

* 🖥️ Computadores monitorados;
* 🌐 Sites utilizados;
* 💻 Aplicações utilizadas;
* ⏱️ Tempo de utilização;
* 📊 Indicadores de produtividade;
* 👥 Usuários;
* 📋 Relatórios;
* 📈 Dashboards administrativos.

> **Observação:** algumas funcionalidades apresentadas neste documento fazem parte do planejamento e da arquitetura futura do projeto e ainda podem não estar implementadas na versão atual.

---

# 🎯 Objetivos

## Objetivo Geral

Desenvolver uma plataforma capaz de centralizar o monitoramento e a análise da utilização de computadores em ambientes corporativos, transformando dados operacionais em informações organizadas para auxiliar na tomada de decisões.

## Objetivos Específicos

* Monitorar computadores conectados à plataforma;
* Registrar informações relacionadas à utilização dos dispositivos;
* Organizar dados de sites e aplicações;
* Analisar o tempo de utilização dos recursos;
* Disponibilizar dashboards para visualização das informações;
* Facilitar a geração de relatórios;
* Implementar gerenciamento de usuários;
* Desenvolver mecanismos de autenticação e controle de acesso;
* Criar uma arquitetura preparada para futuras expansões;
* Aplicar princípios de segurança, transparência e privacidade.

---

# 💡 Problema

Em ambientes empresariais, a utilização de computadores pode gerar uma grande quantidade de informações.

Sem uma plataforma centralizada, esses dados podem se tornar difíceis de organizar, consultar e interpretar.

Entre os principais desafios identificados estão:

### 👁️ Falta de visibilidade

Dificuldade para compreender como os recursos computacionais estão sendo utilizados.

### 🗂️ Dados dispersos

Informações relacionadas a diferentes computadores e usuários podem estar distribuídas em diferentes locais.

### 📉 Dificuldade de análise

Dados brutos, quando não são organizados adequadamente, possuem pouco valor para análises gerenciais.

### 📊 Decisões sem dados

A ausência de informações consolidadas pode dificultar a identificação de padrões e problemas relacionados à utilização dos recursos.

---

# 💡 Solução Proposta

O Argus propõe uma plataforma centralizada capaz de coletar, organizar, processar e apresentar informações relacionadas aos computadores monitorados.

O fluxo conceitual da plataforma pode ser representado por:

```text
┌──────────────────────┐
│     COMPUTADORES     │
│      MONITORADOS     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     AGENTE ARGUS     │
│       COLETA         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       SERVIDOR       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     PROCESSAMENTO    │
│       DOS DADOS      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      DASHBOARD       │
│     E RELATÓRIOS     │
└──────────────────────┘
```

A ideia é que os dados coletados sejam transformados em informações mais fáceis de interpretar e utilizar.

---

# 🔄 Processo do Argus

O funcionamento da plataforma pode ser dividido em quatro etapas principais:

### 1. 🔗 Conecte

Os computadores são conectados ao ambiente de monitoramento do Argus.

### 2. 📥 Colete

O sistema coleta informações relacionadas à utilização dos dispositivos.

### 3. 🗂️ Organize

Os dados coletados são enviados e organizados na infraestrutura da plataforma.

### 4. 📊 Analise

As informações processadas são disponibilizadas através de dashboards, indicadores e relatórios.

```text
CONECTE → COLETE → ORGANIZE → ANALISE
```

---

# 🚀 Funcionalidades

## 🖥️ Monitoramento de Computadores

Acompanhamento dos dispositivos conectados ao ambiente corporativo.

## 🌐 Sites

Registro e organização de informações relacionadas aos sites utilizados.

## 💻 Aplicações

Acompanhamento das aplicações utilizadas nos computadores monitorados.

## ⏱️ Tempo de Uso

Organização de informações relacionadas ao tempo de utilização dos recursos.

## 📊 Dashboard

Apresentação dos dados através de indicadores e visualizações.

## 📋 Relatórios

Possibilidade de gerar relatórios baseados nos dados coletados.

## 👥 Usuários

Gerenciamento dos usuários que possuem acesso à plataforma.

## 🔐 Autenticação

Sistema de login e controle de acesso.

## ⚙️ Configurações

Área destinada ao gerenciamento das configurações da conta e da plataforma.

> A implementação dessas funcionalidades ocorrerá de forma progressiva durante o desenvolvimento.

---

# 🎨 Interface e Experiência do Usuário

O Argus está sendo desenvolvido com uma identidade visual baseada em uma estética:

**Dark Mode + Cyber/Tech + Glassmorphism**

A interface utiliza elementos como:

* Fundos escuros;
* Brilhos e efeitos de `glow`;
* Bordas sutis;
* Cards;
* Elementos translúcidos;
* Animações;
* Ícones;
* Contraste elevado;
* Layout responsivo.

A proposta visual busca transmitir características relacionadas a:

**Tecnologia · Monitoramento · Dados · Segurança · Análise**

---

# 👁️ Conceito da Identidade

O nome **Argus** faz referência a **Argos Panoptes**, figura da mitologia grega tradicionalmente associada a muitos olhos.

Essa referência foi utilizada como conceito para representar a capacidade de:

> **observar, acompanhar e transformar informações em conhecimento.**

O conceito do Argus está relacionado principalmente a:

* 👁️ Observação;
* 🔭 Monitoramento;
* 📊 Análise;
* 💻 Tecnologia;
* 🔐 Segurança;
* ⚙️ Controle;
* 📈 Organização.

---

# 🏗️ Arquitetura do Sistema

A arquitetura planejada para o Argus é dividida em diferentes camadas.

```text
┌─────────────────────────────┐
│          FRONTEND           │
│       Interface Web         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          BACKEND            │
│      Node.js + Express      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          API REST           │
│ Comunicação entre serviços  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          MYSQL              │
│        Banco de Dados       │
└─────────────────────────────┘
```

A separação das camadas permite uma maior organização do código e facilita futuras expansões.

---

# 🎨 Frontend

O frontend é responsável pela interface através da qual os usuários interagem com o Argus.

Atualmente, a estrutura principal está organizada da seguinte maneira:

```text
Frontend/
│
├── css/
│   ├── assets/
│   │   └── img/
│   │       ├── img1.jpg
│   │       ├── img2.jpg
│   │       ├── img3.jpg
│   │       └── user.png
│   │
│   ├── animation.css
│   └── style.css
│
├── js/
│   └── script.js
│
├── index.html
└── sm.html
```

### `index.html`

Página principal do Argus.

Atualmente possui foco na apresentação do produto, chamadas para ação e introdução à proposta da plataforma.

### `sm.html`

Página **"Saiba Mais"**, responsável pela apresentação institucional e técnica do Argus.

A página apresenta:

1. Hero com conceito de íris tecnológica;
2. Desafios operacionais;
3. Fluxo de funcionamento;
4. Processo em quatro etapas;
5. Recursos da plataforma;
6. Ética e privacidade;
7. Comparação entre abordagens;
8. Arquitetura técnica;
9. Roadmap de evolução.

### `style.css`

Arquivo responsável pelos estilos gerais da aplicação.

Concentra:

* Variáveis CSS;
* Temas;
* Layouts;
* Componentes;
* Cards;
* Header;
* Footer;
* Responsividade;
* Estilos globais.

### `animation.css`

Arquivo responsável pelas animações personalizadas e efeitos visuais utilizando `@keyframes`.

### `script.js`

Responsável pelas interações da interface, incluindo:

* Dropdowns;
* Menus;
* Animações;
* Eventos;
* Interações dinâmicas.

---

# 🧩 Componentização da Interface

Para manter uma identidade visual consistente, o frontend utiliza componentes e classes reutilizáveis.

Entre os componentes visuais utilizados estão:

```text
.info-card.border-glow
.feature-box
.process-card
.flow-container
.profile-container
.logo-top.float-glow-anim
```

O projeto também utiliza **Font Awesome 6.4.0** para iconografia.

---

# 🧭 Navegação

O cabeçalho do Argus possui uma estrutura unificada entre as páginas.

Entre os elementos planejados estão:

* Identidade visual do Argus;
* Navegação;
* Menu de perfil;
* Conta;
* Configurações;
* Saiba Mais.

O rodapé também segue uma estrutura padronizada, contendo links institucionais e informações de copyright.

---

# 📖 Página "Saiba Mais"

A página institucional foi desenvolvida para explicar o Argus de maneira mais completa.

Sua estrutura atual inclui:

### Hero

Apresentação visual utilizando uma **íris tecnológica conectada a nós de dados**.

### Desafios Operacionais

Apresentação dos problemas que a plataforma busca solucionar.

### Solução

Diagrama mostrando o fluxo entre computadores, agente, servidor, processamento e dashboard.

### Processo

Representação das quatro etapas:

```text
CONECTE
   ↓
COLETE
   ↓
ORGANIZE
   ↓
ANALISE
```

### Recursos

Apresentação dos principais recursos:

* Computadores;
* Sites;
* Aplicativos;
* Tempo de uso;
* Relatórios;
* Dashboard.

### Ética e Privacidade

Apresentação dos princípios de:

* Transparência;
* Controle de acesso;
* Uso responsável;
* Privacidade.

### Matriz Comparativa

Comparação entre soluções tradicionais e a proposta do Argus.

### Arquitetura Técnica

Apresentação das tecnologias utilizadas na construção do sistema.

### Roadmap

Apresentação das etapas planejadas para evolução da plataforma.

---

# 🔐 Ética, Segurança e Privacidade

Por trabalhar com informações relacionadas à utilização de computadores, o Argus considera segurança e privacidade aspectos importantes da solução.

A plataforma deverá considerar princípios como:

* **Transparência** sobre a coleta de informações;
* **Controle de acesso** aos dados;
* **Uso responsável** das informações;
* **Privacidade** dos usuários;
* **Segurança** no armazenamento;
* **Proteção** durante a comunicação entre sistemas.

O monitoramento deve possuir uma finalidade legítima e estar de acordo com as políticas da organização e as regras aplicáveis.

---

# 🛠️ Tecnologias

| Tecnologia             | Utilização                   |
| ---------------------- | ---------------------------- |
| **HTML5**              | Estrutura das páginas        |
| **CSS3**               | Estilização e responsividade |
| **JavaScript**         | Interatividade do frontend   |
| **Font Awesome 6.4.0** | Iconografia                  |
| **Node.js**            | Backend                      |
| **Express**            | Construção da API            |
| **MySQL**              | Banco de dados               |
| **Axios**              | Comunicação com APIs         |
| **Postman**            | Testes de API                |
| **Git**                | Controle de versão           |
| **GitHub**             | Versionamento e colaboração  |
| **Figma**              | Prototipação e UI/UX         |

---

# 🧪 Testes

Durante o desenvolvimento, o Argus deverá passar por diferentes categorias de testes.

## Testes de Interface

* Responsividade;
* Navegação;
* Botões;
* Menus;
* Animações;
* Formulários;
* Componentes visuais.

## Testes de Funcionalidade

Validação das funcionalidades implementadas em cada etapa do projeto.

## Testes de API

Com a implementação do backend, serão utilizados testes através do **Postman**, incluindo requisições:

```text
GET
POST
PUT
DELETE
```

---

# 📱 Responsividade e Acessibilidade

O frontend possui como objetivo oferecer uma experiência adequada em diferentes dispositivos:

* 🖥️ Desktop;
* 💻 Notebook;
* 📱 Smartphone;
* 📲 Tablet.

Também são consideradas práticas básicas de acessibilidade, incluindo:

* Atributos `aria`;
* Estrutura semântica;
* Contraste adequado;
* Legibilidade;
* Navegação organizada.

---

# 👥 Equipe

## Integrantes

| Integrante                               | Responsabilidade |
| ---------------------------------------- | ---------------- |
| **Haniel Sousa e Souza**                 | Frontend         |
| **Matheus Pereira de Jesus**             | Backend          |
| **Gabriel Henrique Bispo Costa**         | API              |
| **Kaique de Souza Nunes da Silva**       | Documentação     |
| **Rafaela Victoria do Rosário Portugal** | Documentação     |
| **Tais Millena Bispo Caldas**            | Documentação     |

> A divisão de responsabilidades pode ser ajustada conforme as necessidades das próximas etapas do projeto.

## Orientador

**Prof. Adalberto Teixeira Santana**

Professor do **SENAI**, responsável pela orientação das atividades e pelo acompanhamento do desenvolvimento do projeto.

---

# 📚 Contexto Acadêmico

O Argus está sendo desenvolvido no contexto do curso técnico de **Informática para Internet do SENAI**.

O projeto reúne conhecimentos de diferentes áreas estudadas durante a formação, incluindo:

* Desenvolvimento Frontend;
* Desenvolvimento Backend;
* APIs REST;
* Banco de Dados;
* UI/UX;
* Git e GitHub;
* Testes;
* Documentação;
* Arquitetura de software.

O desenvolvimento também proporciona à equipe a oportunidade de aplicar esses conhecimentos em uma solução integrada.

---

# 🚧 Status do Projeto

**Em desenvolvimento 🚧**

O Argus encontra-se atualmente em processo de **refatoração e reconstrução**.

### Progresso

* [x] Definição do conceito do Argus
* [x] Definição da identidade conceitual
* [x] Estrutura inicial do frontend
* [x] Página inicial
* [x] Página "Saiba Mais"
* [x] Estrutura de CSS
* [x] Sistema de animações
* [x] JavaScript para interações
* [x] Organização dos assets
* [x] Estrutura visual Dark/Cyber
* [ ] Finalização do frontend
* [ ] Implementação completa do backend
* [ ] Estruturação do banco de dados
* [ ] Desenvolvimento do agente Argus
* [ ] Integração entre agente e servidor
* [ ] Sistema de autenticação
* [ ] Controle de usuários
* [ ] Dashboard administrativo
* [ ] Sistema de relatórios
* [ ] Testes completos
* [ ] Documentação final

---

# 🛣️ Roadmap

## 🟢 Fase 1 — Reconstrução

* Refatoração do frontend;
* Nova identidade visual;
* Organização do código;
* Componentização;
* Responsividade;
* Melhorias de UX/UI.

## 🟡 Fase 2 — Estrutura do Sistema

* Backend;
* API REST;
* Banco de dados;
* Autenticação;
* Gerenciamento de usuários.

## 🟠 Fase 3 — Monitoramento

* Desenvolvimento do agente Argus;
* Comunicação com o servidor;
* Coleta de informações;
* Armazenamento dos dados;
* Processamento.

## 🔵 Fase 4 — Análise

* Dashboard;
* Indicadores;
* Relatórios;
* Análises de utilização;
* Visualizações de dados.

## 🟣 Fase 5 — Inovação

* Inteligência Artificial;
* Análise preditiva;
* Identificação de padrões;
* Insights automatizados;
* Recomendações baseadas em dados.

---

# 🌳 Fluxo de Desenvolvimento

O projeto utiliza Git e GitHub para controle de versão e colaboração entre os integrantes.

Fluxo básico:

```text
Desenvolvimento
       │
       ▼
Alteração do código
       │
       ▼
Teste local
       │
       ▼
Commit
       │
       ▼
Push
       │
       ▼
GitHub
```

A utilização do controle de versão permite acompanhar a evolução do projeto, registrar alterações e facilitar o trabalho colaborativo.

---

# 📂 Estrutura Futura

Com a evolução do projeto, a estrutura deverá ser expandida para separar as diferentes camadas da aplicação:

```text
Argus/
│
├── Frontend/
│   ├── css/
│   ├── js/
│   ├── assets/
│   ├── index.html
│   └── sm.html
│
├── Backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── database/
│   └── server.js
│
├── Database/
│   └── ...
│
├── README.md
└── ...
```

Essa organização permitirá separar claramente a interface, a lógica de negócio e o armazenamento dos dados.

---

# 📈 Visão de Futuro

O Argus não foi pensado apenas como uma página ou sistema de monitoramento.

A visão de longo prazo é transformar a plataforma em um **ecossistema de gestão inteligente de ativos e utilização de recursos de TI**.

A partir da coleta e organização dos dados, o sistema poderá evoluir para oferecer:

* Análises avançadas;
* Indicadores personalizados;
* Relatórios automatizados;
* Identificação de padrões;
* Análise preditiva;
* Inteligência Artificial;
* Recomendações baseadas em dados.

Dessa forma, o Argus poderá evoluir de uma ferramenta de **monitoramento** para uma plataforma de **análise e apoio à tomada de decisões**.

---

# 🦅 Argus

> **Observe. Organize. Analise. Decida.**

O **Argus** busca transformar dados de utilização em informações úteis, unindo desenvolvimento web, monitoramento, análise de dados e uma interface moderna para criar uma solução tecnológica voltada a ambientes corporativos.

---

## 🎓 Informações do Projeto

**Projeto:** Argus
**Curso:** Informática para Internet
**Instituição:** SENAI
**Orientador:** Prof. Adalberto Teixeira Santana
**Status:** Em desenvolvimento 🚧

**Equipe:**

* Haniel Sousa e Souza — Frontend
* Matheus Pereira de Jesus — Backend
* Gabriel Henrique Bispo Costa — API
* Kaique de Souza Nunes da Silva — Documentação
* Rafaela Victoria do Rosário Portugal — Documentação
* Tais Millena Bispo Caldas — Documentação
