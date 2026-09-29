import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AppWindow, ArrowDown, ArrowRight, BarChart3, Blocks, Braces, Check,
  Clock3, Code2, Database, Eye, FileChartColumn, GitBranch, Globe,
  Handshake, Layers3, LayoutDashboard, LockKeyhole, Monitor, Network, PanelsTopLeft,
  Server, Settings, ShieldCheck, Sparkles, UserCheck,
  UsersRound, Workflow, Download,
} from 'lucide-react';
import './SaibaMais.css';

const challenges = [
  { icon: Eye, title: 'Falta de visibilidade', text: 'Acompanhar vários computadores individualmente dificulta entender o estado dos dispositivos e como os recursos estão sendo utilizados.' },
  { icon: Layers3, title: 'Informações dispersas', text: 'Dados sobre computadores, aplicações, sites e períodos de utilização podem ficar espalhados e difíceis de analisar.' },
  { icon: BarChart3, title: 'Decisões sem dados organizados', text: 'Sem informações centralizadas, fica mais difícil perceber padrões, identificar problemas e encontrar oportunidades de melhoria.' },
];

const flow = [
  { icon: Monitor, title: 'Computadores', text: 'Dispositivos vinculados ao ambiente ARGUS.' },
  { icon: Activity, title: 'Coleta', text: 'Informações definidas pela plataforma são coletadas.' },
  { icon: Network, title: 'API', text: 'Os componentes trocam informações por uma interface definida.' },
  { icon: Workflow, title: 'Processamento', text: 'Os dados são organizados e preparados para consulta.' },
  { icon: LayoutDashboard, title: 'Dashboard', text: 'As informações são apresentadas de forma visual.' },
];

const features = [
  { icon: Monitor, title: 'Computadores', text: 'Visualização e gerenciamento dos dispositivos cadastrados.', state: 'Integração planejada' },
  { icon: Globe, title: 'Sites', text: 'Acompanhamento dos domínios e sites acessados no ambiente monitorado.', state: 'Integração planejada' },
  { icon: AppWindow, title: 'Aplicações', text: 'Visualização dos programas e softwares utilizados.', state: 'Integração planejada' },
  { icon: Clock3, title: 'Tempo de utilização', text: 'Informações sobre períodos de uso dos computadores e recursos monitorados.', state: 'Integração planejada' },
  { icon: FileChartColumn, title: 'Relatórios', text: 'Informações organizadas para facilitar consultas e análises.', state: 'Planejado' },
  { icon: PanelsTopLeft, title: 'Dashboard', text: 'Visão centralizada dos principais indicadores da plataforma.', state: 'Planejado' },
  { icon: UsersRound, title: 'Usuários', text: 'Gerenciamento de usuários e dos acessos à plataforma.', state: 'Planejado' },
  { icon: Settings, title: 'Configurações', text: 'Preferências visuais e ajustes locais da conta já estão disponíveis na interface.', state: 'Disponível na interface' },
];

const principles = [
  { icon: Eye, title: 'Transparência', text: 'Os usuários devem ser informados sobre a utilização do sistema de monitoramento.' },
  { icon: UserCheck, title: 'Controle de acesso', text: 'Recursos e informações devem seguir as permissões de cada usuário.' },
  { icon: Handshake, title: 'Uso responsável', text: 'Os dados devem ser utilizados conforme as finalidades definidas pela organização.' },
  { icon: LockKeyhole, title: 'Privacidade', text: 'O tratamento das informações deve considerar a proteção e o uso adequado dos dados.' },
  { icon: ShieldCheck, title: 'Segurança', text: 'A comunicação e o armazenamento devem adotar mecanismos adequados de proteção.' },
];

const stack = [
  { icon: PanelsTopLeft, title: 'Frontend', items: ['React', 'TypeScript', 'Vite'], text: 'Interface, navegação, componentes e experiência de uso.' },
  { icon: Server, title: 'API e backend', items: ['Node.js', 'JavaScript', 'Express'], text: 'Regras da aplicação, processamento e disponibilização da API.' },
  { icon: Database, title: 'Banco de dados', items: ['MySQL'], text: 'Armazenamento estruturado das informações.' },
];

const technologies = [
  { icon: Code2, title: 'Frontend', tags: ['React', 'TypeScript', 'Vite'] },
  { icon: Braces, title: 'Backend', tags: ['Node.js', 'JavaScript', 'Express'] },
  { icon: Database, title: 'Dados e comunicação', tags: ['MySQL', 'API REST', 'Axios'] },
  { icon: GitBranch, title: 'Versionamento', tags: ['Git', 'GitHub'] },
  { icon: Blocks, title: 'Prototipação', tags: ['Figma'] },
];

const roadmap = [
  { label: 'Atual', title: 'Reconstrução da plataforma', icon: Check, text: 'A interface está sendo reconstruída em React e TypeScript, com nova identidade visual, navegação, perfil e configurações. A estrutura do frontend está preparada para a integração com o backend.', status: 'Em andamento' },
  { label: 'Próxima etapa', title: 'Integração', icon: Network, text: 'Conectar a interface à API e ao banco de dados, implementar autenticação integrada e estabelecer a comunicação com os computadores monitorados.', status: 'Planejado' },
  { label: 'Expansão', title: 'Monitoramento e análise', icon: BarChart3, text: 'Ampliar os recursos com relatórios, histórico, indicadores detalhados, notificações e ferramentas de gerenciamento.', status: 'Planejado' },
  { label: 'Futuro', title: 'Inovação', icon: Sparkles, text: 'Avaliar possibilidades como inteligência artificial, análises preditivas e outras plataformas de acesso.', status: 'Possibilidade futura' },
];

const SectionHeading: React.FC<{ eyebrow: string; title: string; description: string }> = ({ eyebrow, title, description }) => (
  <div className="sm-section-heading">
    <span className="sm-eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
);

export const SaibaMais: React.FC = () => (
  <div className="saiba-mais-page">
    <section className="sm-hero" aria-labelledby="sm-hero-title">
      <div className="sm-hero-copy">
        <span className="sm-eyebrow">Monitoramento e análise de computadores</span>
        <h1 id="sm-hero-title">Tenha uma visão mais clara da sua operação.</h1>
        <p>O ARGUS é uma plataforma de monitoramento e análise de computadores que centraliza informações do ambiente corporativo e organiza os dados coletados para auxiliar a gestão e a tomada de decisões.</p>
        <div className="sm-hero-actions">
          <a href="#solucao" className="btn btn-primary">Conheça o ARGUS <ArrowRight size={17} /></a>
          <Link to="/download" className="btn btn-secondary"><Download size={17} /> Baixar agente</Link>
        </div>
      </div>
      <div className="sm-observatory" aria-label="Ilustração conceitual de monitoramento e análise">
        <div className="sm-orbit sm-orbit-outer" />
        <div className="sm-orbit sm-orbit-inner" />
        <div className="sm-observatory-core" aria-hidden="true"><Eye size={34} /></div>
        <div className="sm-signal sm-signal-one"><Monitor size={17} /><span>Dispositivos</span></div>
        <div className="sm-signal sm-signal-two"><Activity size={17} /><span>Dados organizados</span></div>
        <div className="sm-signal sm-signal-three"><BarChart3 size={17} /><span>Análise visual</span></div>
        <span className="sm-orbit-point sm-point-one" /><span className="sm-orbit-point sm-point-two" />
        <span className="sm-orbit-point sm-point-three" /><span className="sm-orbit-point sm-point-four" />
        <span className="sm-orbit-point sm-point-five" /><span className="sm-orbit-point sm-point-six" />
        <span className="sm-orbit-point sm-point-seven" />
      </div>
    </section>

    <section className="sm-section" id="problema">
      <SectionHeading eyebrow="O desafio" title="Entender o ambiente começa com informações organizadas." description="Em ambientes com vários dispositivos, encontrar contexto em dados espalhados pode consumir tempo e dificultar a gestão." />
      <div className="sm-card-grid sm-grid-3">
        {challenges.map(({ icon: Icon, title, text }) => <article className="sm-card sm-challenge-card" key={title}><span className="sm-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="sm-section sm-solution" id="solucao">
      <SectionHeading eyebrow="A proposta ARGUS" title="Uma visão centralizada da operação." description="O ARGUS propõe reunir em uma única interface as informações relacionadas aos computadores monitorados, organizando os dados para consulta e análise." />
      <div className="sm-flow" aria-label="Fluxo conceitual dos dados no ARGUS">
        {flow.map(({ icon: Icon, title, text }, index) => <React.Fragment key={title}>
          <article className="sm-flow-step"><span className="sm-flow-icon"><Icon size={21} /></span><span className="sm-flow-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>
          {index < flow.length - 1 && <ArrowRight className="sm-flow-arrow" size={19} aria-hidden="true" />}
        </React.Fragment>)}
      </div>
      <p className="sm-note"><Activity size={16} /> O fluxo representa a arquitetura prevista para a integração da plataforma.</p>
    </section>

    <section className="sm-section" id="recursos">
      <SectionHeading eyebrow="Recursos" title="O que a plataforma reúne." description="A interface atual já oferece recursos de conta e configuração. Os itens de monitoramento dependem das etapas de integração indicadas abaixo." />
      <div className="sm-card-grid sm-grid-4">
        {features.map(({ icon: Icon, title, text, state }) => <article className="sm-card sm-feature-card" key={title}><span className="sm-icon"><Icon size={21} /></span><span className={`sm-status${state === 'Disponível na interface' ? ' is-available' : ''}`}>{state}</span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="sm-section sm-trust">
      <SectionHeading eyebrow="Responsabilidade" title="Privacidade e segurança fazem parte da proposta." description="Como a plataforma lida com informações relacionadas ao uso de computadores, seu desenvolvimento considera princípios de transparência, acesso e proteção." />
      <div className="sm-card-grid sm-grid-5">
        {principles.map(({ icon: Icon, title, text }) => <article className="sm-card sm-principle-card" key={title}><span className="sm-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="sm-section" id="arquitetura">
      <SectionHeading eyebrow="Arquitetura" title="Frontend e backend com responsabilidades separadas." description="A interface do ARGUS está no frontend. API, backend e banco de dados formam a arquitetura de integração planejada para conectar a aplicação aos dados monitorados." />
      <div className="sm-architecture">
        {stack.map(({ icon: Icon, title, items, text }, index) => <React.Fragment key={title}>
          <article className={`sm-architecture-layer${index === 0 ? ' sm-layer-current' : ''}`}>
            <div className="sm-layer-heading"><span className="sm-icon"><Icon size={21} /></span><div><span className="sm-layer-kicker">Camada 0{index + 1}</span><h3>{title}</h3></div></div>
            <p>{text}</p>
            <div className="sm-tech-tags">{items.map((item) => <span key={item}>{item}</span>)}</div>
            <span className={`sm-status${index === 0 ? ' is-available' : ''}`}>{index === 0 ? 'Interface atual' : 'Integração planejada'}</span>
          </article>
          {index < stack.length - 1 && <ArrowDown className="sm-architecture-arrow" size={20} aria-hidden="true" />}
        </React.Fragment>)}
      </div>
      <div className="sm-communication"><Network size={19} /><div><strong>Comunicação entre camadas</strong><span>API REST + Axios — prevista para a integração entre frontend e backend.</span></div></div>
    </section>

    <section className="sm-section sm-usage" id="funcionamento">
      <SectionHeading eyebrow="Fluxo de uso" title="Como o ARGUS será utilizado." description="Estas etapas descrevem o fluxo operacional previsto quando a integração com o backend e os computadores estiver concluída." />
      <div className="sm-usage-flow">
        {[
          { icon: UsersRound, title: 'Cadastre', text: 'Configure a organização, os usuários e os computadores.' },
          { icon: Monitor, title: 'Conecte', text: 'Vincule os computadores ao ambiente ARGUS.' },
          { icon: Activity, title: 'Monitore', text: 'Os dados definidos pela plataforma seguem para processamento.' },
          { icon: BarChart3, title: 'Analise', text: 'Consulte informações no dashboard, nos computadores e nos relatórios.' },
        ].map(({ icon: Icon, title, text }, index) => <article className="sm-usage-step" key={title}><span className="sm-usage-number">0{index + 1}</span><span className="sm-icon"><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <span className="sm-planned-caption">Fluxo planejado para as próximas etapas de integração</span>
    </section>

    <section className="sm-section sm-offering">
      <SectionHeading eyebrow="Proposta de valor" title="O que o ARGUS busca oferecer." description="Uma experiência integrada para consultar e compreender informações do ambiente corporativo." />
      <div className="sm-offering-grid">
        {[
          ['Visão centralizada', 'Informações reunidas em uma interface.', LayoutDashboard],
          ['Interface moderna', 'Navegação clara e consistente.', PanelsTopLeft],
          ['Dados organizados', 'Conteúdo estruturado para consulta.', Database],
          ['Monitoramento integrado', 'Computadores conectados à plataforma.', Network],
          ['Gestão de computadores e usuários', 'Recursos reunidos no mesmo ambiente.', UsersRound],
          ['Análise visual', 'Indicadores apresentados com clareza.', BarChart3],
        ].map(([title, text, Icon]) => {
          const FeatureIcon = Icon as React.ElementType;
          return <div className="sm-offering-item" key={title as string}><FeatureIcon size={19} /><div><h3>{title as string}</h3><p>{text as string}</p></div></div>;
        })}
      </div>
    </section>

    <section className="sm-section" id="tecnologias">
      <SectionHeading eyebrow="Tecnologias" title="Uma base moderna e modular." description="Tecnologias organizadas por camada e finalidade, sem perder de vista a separação entre interface, serviços e dados." />
      <div className="sm-tech-grid">
        {technologies.map(({ icon: Icon, title, tags }) => <article className="sm-tech-card" key={title}><div className="sm-tech-title"><span className="sm-icon"><Icon size={19} /></span><h3>{title}</h3></div><div className="sm-tech-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}
      </div>
    </section>

    <section className="sm-section sm-roadmap" id="evolucao">
      <SectionHeading eyebrow="Evolução" title="A plataforma cresce por etapas." description="A evolução separa o que está em construção das integrações planejadas e das possibilidades futuras." />
      <div className="sm-roadmap-grid">
        {roadmap.map(({ label, title, icon: Icon, text, status }, index) => <article className={`sm-roadmap-card${index === 0 ? ' is-current' : ''}`} key={label}><span className="sm-roadmap-index">0{index + 1}</span><span className="sm-icon"><Icon size={20} /></span><span className="sm-roadmap-label">{label}</span><h3>{title}</h3><p>{text}</p><span className="sm-status">{status}</span></article>)}
      </div>
      <p className="sm-future-note"><Sparkles size={16} /> Os itens em “Futuro” são possibilidades em avaliação, não funcionalidades já implementadas.</p>
    </section>

    <section className="sm-final-cta">
      <div><span className="sm-eyebrow">ARGUS VIGILANTE</span><h2>Conheça a plataforma e acompanhe sua evolução.</h2></div>
      <Link to="/download" className="btn btn-primary"><Download size={17} /> Baixar agente</Link>
    </section>
  </div>
);
