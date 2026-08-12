# 🔭 Argus

> **Sistema de monitoramento e análise de utilização de computadores em ambientes corporativos.**

O **Argus** é um projeto desenvolvido no contexto do curso técnico de **Informática para Internet do SENAI**, com o objetivo de apresentar uma solução voltada ao acompanhamento do uso de computadores em empresas.

A proposta do sistema é possibilitar o monitoramento de atividades realizadas nos computadores, como utilização de sites e aplicações, transformando essas informações em dados que possam auxiliar na análise de produtividade, organização e gerenciamento do ambiente corporativo.

O projeto encontra-se atualmente em processo de **refatoração e reconstrução da interface**, buscando melhorar a identidade visual, organização do código, experiência do usuário e estrutura geral da aplicação.

---

## 📌 Sobre o Projeto

O Argus surgiu originalmente como uma proposta de sistema capaz de auxiliar empresas no acompanhamento da utilização de seus computadores.

Em vez de simplesmente registrar informações, a ideia do projeto é transformar os dados coletados em informações úteis para gestores, permitindo uma visão mais organizada sobre a utilização dos equipamentos.

Entre as possibilidades planejadas para o sistema estão:

* 📊 Monitoramento da utilização dos computadores;
* 🌐 Registro de sites utilizados;
* 💻 Acompanhamento de aplicações utilizadas;
* ⏱️ Análise do tempo de utilização;
* 📈 Geração de informações relacionadas à produtividade;
* 👥 Gerenciamento de usuários;
* ⚙️ Configurações do sistema;
* 🔐 Sistema de autenticação;
* 🖥️ Dashboard administrativo;
* 📋 Visualização organizada dos dados coletados.

> **Observação:** algumas dessas funcionalidades fazem parte do planejamento geral do projeto e podem ainda não estar implementadas na versão atual.

---

# 🎯 Objetivo

O principal objetivo do Argus é desenvolver uma solução capaz de auxiliar empresas no **gerenciamento e análise do uso de computadores**, oferecendo informações que possam contribuir para uma melhor organização do ambiente de trabalho.

O sistema busca unir:

* Desenvolvimento Web;
* Interface intuitiva;
* Organização de informações;
* Monitoramento;
* Análise de dados;
* Administração de usuários;
* Experiência do usuário.

A proposta também permite que os conhecimentos adquiridos durante o curso técnico sejam aplicados em um projeto prático e integrado.

---

# 💡 Justificativa

Em ambientes empresariais, computadores são ferramentas fundamentais para a realização das atividades profissionais. Entretanto, sem mecanismos adequados de acompanhamento, pode ser difícil identificar como os recursos computacionais estão sendo utilizados.

O Argus foi pensado como uma alternativa para centralizar essas informações e apresentá-las de maneira organizada.

Através de uma interface web, o sistema pretende facilitar a visualização das informações e fornecer uma base para análises relacionadas à utilização dos equipamentos.

---

# 👥 Equipe

## Integrantes

* **Haniel Sousa e Souza**
* **Matheus Pereira de Jesus**
* **Gabriel Henrique Bispo Costa**
* **Kaique de Souza Nunes da Silva**
* **Rafaela Victoria do Rosário Portugal**
* **Tais Millena Bispo Caldas**


## Orientador

**Prof. Adalberto Teixeira Santana**

Professor do **SENAI**, responsável pela orientação das atividades e acompanhamento do desenvolvimento do projeto no contexto acadêmico.

---

# 🏗️ Estrutura Atual do Projeto

Atualmente, a reconstrução do projeto possui a seguinte organização:

```text
TCC/
│
└── Frontend/
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
    └── index.html
```

---

# 🎨 Frontend

O frontend é responsável pela apresentação visual do sistema e pela interação do usuário com a aplicação.

Atualmente, a estrutura utiliza tecnologias fundamentais do desenvolvimento web:

### HTML5

Responsável pela estruturação das páginas e dos elementos presentes na interface.

Exemplos:

* Estrutura das páginas;
* Menus;
* Botões;
* Formulários;
* Seções;
* Elementos de navegação.

### CSS3

Responsável pela estilização e identidade visual do Argus.

O projeto possui dois arquivos principais:

```text
style.css
animation.css
```

O `style.css` concentra as regras visuais gerais da aplicação, enquanto o `animation.css` é destinado às animações e transições utilizadas na interface.

### JavaScript

O arquivo:

```text
js/script.js
```

é responsável pela implementação da lógica de interação da interface.

A utilização do JavaScript permite tornar a aplicação mais dinâmica, possibilitando posteriormente a implementação de recursos como:

* Manipulação de elementos;
* Eventos;
* Menus interativos;
* Validação de formulários;
* Comunicação com APIs;
* Atualização dinâmica de informações;
* Controle de componentes da interface.

---

# 🖼️ Assets

Os recursos visuais utilizados pelo frontend estão organizados em:

```text
css/assets/img/
```

Atualmente, a pasta contém imagens utilizadas pela interface:

```text
img1.jpg
img2.jpg
img3.jpg
user.png
```

A separação dos arquivos de mídia em uma pasta específica facilita a manutenção e organização do projeto.

---

# ✨ Identidade Visual

O nome **Argus** foi escolhido como referência a **Argos Panoptes**, figura da mitologia grega tradicionalmente representada como um ser com muitos olhos.

A associação com o projeto está relacionada à ideia de:

> **observar, acompanhar e fornecer informações sobre o que está acontecendo.**

Essa ideia foi utilizada como base conceitual para a identidade do sistema.

A identidade visual procura transmitir características como:

* 👁️ Monitoramento;
* 🔭 Observação;
* 📊 Análise;
* 💻 Tecnologia;
* 🔐 Segurança;
* ⚙️ Controle;
* 📈 Organização.

---

# 🧩 Funcionalidades Planejadas

O projeto possui uma estrutura planejada para futuramente comportar diferentes áreas do sistema.

## 🏠 Início

Página inicial responsável por apresentar o Argus e explicar de maneira resumida sua proposta.

## ℹ️ Sobre

Área destinada à apresentação do projeto, seus objetivos e sua finalidade.

## ⬇️ Download

Página destinada à disponibilização do software ou dos componentes necessários para utilização do sistema.

## 🔐 Login

Área de autenticação dos usuários.

O sistema poderá utilizar diferentes níveis de acesso dependendo do perfil do usuário.

## 📝 Cadastro

Página destinada ao cadastro de novos usuários.

## ⚙️ Configurações

Área para gerenciamento das preferências e configurações relacionadas à conta ou ao sistema.

## 📊 Dashboard Administrativo

Área destinada aos responsáveis pela administração do sistema.

Possíveis informações:

* Computadores monitorados;
* Usuários ativos;
* Aplicações utilizadas;
* Sites acessados;
* Indicadores de produtividade;
* Dados de utilização.

## 👤 Gerenciamento de Usuários

Área administrativa para visualização e gerenciamento dos usuários cadastrados.

---

# 🔄 Funcionamento Proposto

De maneira simplificada, o funcionamento planejado do Argus pode ser representado da seguinte forma:

```text
┌─────────────────────┐
│      Computador     │
│      monitorado     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Coleta de informações│
│ sobre utilização     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Processamento dos   │
│       dados         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Armazenamento   │
│       dos dados     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       Argus         │
│ Dashboard Web       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Visualização e      │
│ análise dos dados   │
└─────────────────────┘
```

---

# 🛠️ Tecnologias

As principais tecnologias utilizadas ou planejadas para o projeto incluem:

| Tecnologia     | Utilização                               |
| -------------- | ---------------------------------------- |
| **HTML5**      | Estrutura das páginas                    |
| **CSS3**       | Estilização da interface                 |
| **JavaScript** | Interatividade e lógica do frontend      |
| **Node.js**    | Backend planejado                        |
| **Express**    | Construção da API                        |
| **MySQL**      | Banco de dados planejado                 |
| **Axios**      | Comunicação com APIs                     |
| **Postman**    | Testes de API                            |
| **Git**        | Controle de versão                       |
| **GitHub**     | Hospedagem do código                     |
| **Figma**      | Prototipação e planejamento da interface |

> A utilização de cada tecnologia pode evoluir conforme o desenvolvimento das próximas etapas do projeto.

---

# 📁 Organização do Código

Uma das preocupações durante a reconstrução do Argus é manter uma estrutura organizada e de fácil manutenção.

A separação entre:

```text
CSS
JavaScript
Imagens
HTML
```

permite localizar rapidamente cada tipo de recurso.

Essa organização também facilita a expansão futura do projeto para uma arquitetura mais completa contendo frontend, backend e banco de dados.

---

# 🧪 Testes

Durante o desenvolvimento, o projeto deverá passar por diferentes etapas de testes.

### Testes de interface

Verificação de:

* Responsividade;
* Funcionamento dos botões;
* Navegação;
* Animações;
* Formulários;
* Organização visual.

### Testes de funcionalidade

Verificação das funcionalidades implementadas no sistema.

### Testes de API

Quando o backend estiver integrado, serão realizados testes utilizando ferramentas como **Postman**, verificando requisições:

```text
GET
POST
PUT
DELETE
```

---

# 🔒 Segurança e Privacidade

Como o Argus trabalha com a ideia de monitoramento de computadores, questões relacionadas à segurança e privacidade são importantes para o desenvolvimento do projeto.

O sistema deverá considerar:

* Controle de acesso;
* Autenticação;
* Gerenciamento de permissões;
* Proteção das informações armazenadas;
* Segurança das comunicações;
* Armazenamento adequado dos dados;
* Transparência sobre o funcionamento do monitoramento.

O objetivo do projeto é utilizar as informações coletadas de maneira responsável e dentro das regras e políticas aplicáveis ao ambiente em que o sistema for utilizado.

---

# 📚 Contexto Acadêmico

O Argus está sendo desenvolvido como parte das atividades relacionadas ao **curso técnico de Informática para Internet do SENAI**.

O desenvolvimento do projeto permite aplicar conhecimentos de diferentes áreas estudadas durante a formação, incluindo:

* Desenvolvimento Frontend;
* Desenvolvimento Backend;
* Banco de Dados;
* APIs REST;
* Git e GitHub;
* UI/UX;
* Prototipação;
* Testes;
* Organização de projetos;
* Documentação.

O projeto também funciona como uma oportunidade para integrar diferentes conhecimentos em uma única aplicação.

---

# 🚧 Status do Projeto

**Em desenvolvimento 🚧**

Atualmente, o projeto está passando por uma **reconstrução do frontend**, com foco em:

* Nova identidade visual;
* Organização dos arquivos;
* Melhoria da interface;
* Criação das animações;
* Estruturação do JavaScript;
* Preparação para futuras integrações com backend.

### Progresso atual

* [x] Definição do nome Argus
* [x] Definição do conceito do projeto
* [x] Estrutura inicial do frontend
* [x] Organização das pastas
* [x] Criação da página inicial
* [x] Arquivos CSS
* [x] Arquivo JavaScript
* [x] Organização dos assets
* [ ] Finalização da identidade visual
* [ ] Implementação completa das páginas
* [ ] Desenvolvimento do backend
* [ ] Criação do banco de dados
* [ ] Integração frontend + backend
* [ ] Implementação do sistema de autenticação
* [ ] Implementação do dashboard
* [ ] Testes completos
* [ ] Documentação final

---

# 📈 Próximas Etapas

As próximas etapas previstas para o desenvolvimento são:

### 1. Finalização do Frontend

Concluir a interface visual e implementar as páginas planejadas.

### 2. Implementação da interatividade

Adicionar funcionalidades utilizando JavaScript.

### 3. Desenvolvimento do Backend

Criar a API responsável pela comunicação entre o frontend e o banco de dados.

### 4. Banco de Dados

Estruturar o armazenamento das informações utilizadas pelo sistema.

### 5. Integração

Conectar frontend, backend e banco de dados.

### 6. Autenticação

Implementar login, cadastro e controle de acesso.

### 7. Dashboard

Desenvolver a área administrativa e os indicadores do sistema.

### 8. Testes

Realizar testes de interface, funcionalidades e API.

### 9. Documentação

Finalizar a documentação técnica e acadêmica do projeto.

---

# 🌳 Fluxo de Desenvolvimento

O projeto utiliza controle de versão para acompanhar a evolução do código.

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

A utilização do Git permite acompanhar alterações, corrigir problemas e manter um histórico do desenvolvimento.

---

# 📖 Documentação

A documentação do projeto será utilizada para registrar:

* Objetivos;
* Requisitos;
* Estrutura do sistema;
* Tecnologias;
* Funcionalidades;
* Banco de dados;
* API;
* Testes;
* Decisões de desenvolvimento;
* Evolução do projeto.

A documentação também tem como objetivo facilitar a compreensão do projeto por outros integrantes da equipe, professores e futuros desenvolvedores.

---

# 🎓 Instituição

**SENAI — Serviço Nacional de Aprendizagem Industrial**

**Curso:** Informática para Internet

**Projeto:** Argus

**Orientador:** Prof. Adalberto Teixeira Santana

---

# 👨‍💻 Equipe de Desenvolvimento

| Integrante   | Função          |
| ------------ | --------------- |
| **Haniel** | Frontend |
| **Matheus** | Backend |
| **Gabriel** | Api |
(O restante do Grupo ficou responsável pela documentação de todo o projeto)

> As funções da equipe podem ser atualizadas conforme a divisão de responsabilidades durante o desenvolvimento.

---

# 📜 Licença

Este projeto foi desenvolvido para fins **acadêmicos e educacionais**, dentro do contexto do curso técnico de Informática para Internet do SENAI.

Caso o projeto seja posteriormente disponibilizado publicamente, uma licença específica poderá ser definida pela equipe.

---

# 🔭 Argus

**Observe. Analise. Organize.**

O Argus busca transformar dados de utilização em informações úteis, unindo tecnologia, desenvolvimento web e análise para criar uma solução de monitoramento moderna e organizada.
