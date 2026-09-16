import React from 'react';
import { Link } from 'react-router-dom';
import { 
  EyeOff, 
  Network, 
  TrendingDown, 
  Monitor, 
  ShieldCheck, 
  Server, 
  Cpu, 
  PieChart, 
  Globe, 
  Layers, 
  Clock, 
  FileText, 
  Eye, 
  Lock, 
  Handshake, 
  ShieldAlert, 
  Code, 
  Database, 
  Download,
  Check,
  X,
  Workflow
  ,ChevronRight
} from 'lucide-react';

export const SaibaMais: React.FC = () => {
  return (
    <div className="page-wrapper">
      <section className="hero-section">
        <div className="hero-left">
          <h1 className="hero-title">Tenha uma visão mais clara da sua operação.</h1>
          <p className="hero-desc">
            O Argus é uma plataforma de monitoramento e análise que ajuda empresas a compreender como seus computadores são utilizados, transformando dados de uso em informações para apoiar decisões.
          </p>
          <div className="hero-actions">
            <a href="#solucao" className="btn btn-primary">Conheça o Argus</a>
            <Link to="/download" className="btn btn-secondary">
              <Download size={16} /> Baixar Agente
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="tech-iris-container border-glow">
            <div className="iris-ring ring-outer" />
            <div className="iris-ring ring-mid" />
            <div className="iris-core"></div>
            <div className="data-node node-1" />
            <div className="data-node node-2" />
            <div className="data-node node-3" />
            <div className="data-node node-4" />
          </div>
        </div>
      </section>

      <section id="problema" className="section-block">
        <div className="section-header">
          <span className="section-label">Desafios Operacionais</span>
          <h2>Você sabe realmente como os recursos da sua empresa estão sendo utilizados?</h2>
        </div>

        <div className="cards-grid grid-3">
          <div className="info-card border-glow">
            <div className="card-icon-wrapper"><EyeOff size={24} /></div>
            <h3>Falta de visibilidade</h3>
            <p>É difícil acompanhar o uso de diversos computadores individualmente e saber se a infraestrutura está adequada.</p>
          </div>
          <div className="info-card border-glow">
            <div className="card-icon-wrapper"><Network size={24} /></div>
            <h3>Informações dispersas</h3>
            <p>Os dados de utilização ficam espalhados, desorganizados e são extremamente difíceis de analisar de forma consistente.</p>
          </div>
          <div className="info-card border-glow">
            <div className="card-icon-wrapper"><TrendingDown size={24} /></div>
            <h3>Decisões sem dados</h3>
            <p>Sem informações organizadas, identificar gargalos, desperdícios e oportunidades de melhoria se torna um desafio.</p>
          </div>
        </div>
      </section>

      <section id="solucao" className="section-block dark-bg-box">
        <div className="section-header">
          <span className="section-label">A Resposta Tecnológica</span>
          <h2>Uma visão centralizada da sua operação.</h2>
          <p className="section-desc">
            O Argus reúne informações de utilização dos computadores cadastrados e apresenta os dados de maneira organizada em um painel centralizado e intuitivo.
          </p>
        </div>

        <div className="flow-container">
          <div className="flow-step"><span className="flow-icon"><Monitor size={20} /></span><span>Computadores</span></div>
          <ChevronRight className="flow-arrow" size={18} />
          <div className="flow-step highlight-step"><span className="flow-icon"><ShieldCheck size={20} /></span><span>Agente Argus</span></div>
          <ChevronRight className="flow-arrow" size={18} />
          <div className="flow-step"><span className="flow-icon"><Server size={20} /></span><span>Servidor</span></div>
          <ChevronRight className="flow-arrow" size={18} />
          <div className="flow-step"><span className="flow-icon"><Cpu size={20} /></span><span>Processamento</span></div>
          <ChevronRight className="flow-arrow" size={18} />
          <div className="flow-step highlight-step"><span className="flow-icon"><PieChart size={20} /></span><span>Dashboard</span></div>
        </div>
      </section>

      <section id="recursos" className="section-block">
        <div className="section-header">
          <span className="section-label">Funcionalidades</span>
          <h2>Tudo o que você precisa para entender sua operação.</h2>
        </div>

        <div className="cards-grid grid-3">
          <div className="info-card border-glow">
            <Monitor size={24} />
            <h3>Computadores</h3>
            <p>Visualização clara dos dispositivos cadastrados, verificando seu estado e identificando máquinas ativas.</p>
          </div>
          <div className="info-card border-glow">
            <Globe size={24} />
            <h3>Sites</h3>
            <p>Acompanhamento dos domínios e sites mais acessados durante as jornadas de trabalho.</p>
          </div>
          <div className="info-card border-glow">
            <Layers size={24} />
            <h3>Aplicativos</h3>
            <p>Mapeamento e identificação dos softwares e programas mais utilizados pelas equipes.</p>
          </div>
          <div className="info-card border-glow">
            <Clock size={24} />
            <h3>Tempo de utilização</h3>
            <p>Métricas precisas sobre a quantidade de horas e minutos de uso ativo dos recursos monitorados.</p>
          </div>
          <div className="info-card border-glow">
            <FileText size={24} />
            <h3>Relatórios</h3>
            <p>Dados estruturados para exportação e análises estratégicas que facilitam avaliações gerenciais.</p>
          </div>
          <div className="info-card border-glow">
            <PieChart size={24} />
            <h3>Dashboard</h3>
            <p>Um painel centralizado com indicadores chave em tempo real para uma tomada de decisão ágil.</p>
          </div>
        </div>
      </section>

      <section className="section-block ethics-block dark-bg-box">
        <div className="section-header">
          <span className="section-label">Ética e Privacidade</span>
          <h2>Monitoramento com responsabilidade.</h2>
        </div>

        <div className="cards-grid grid-4">
          <div className="info-card border-glow">
            <Eye size={20} />
            <h4>Transparência</h4>
            <p>Os usuários estão cientes da utilização da ferramenta nas máquinas corporativas.</p>
          </div>
          <div className="info-card border-glow">
            <Lock size={20} />
            <h4>Controle de acesso</h4>
            <p>Informações restritas disponíveis somente para perfis de usuários autorizados.</p>
          </div>
          <div className="info-card border-glow">
            <Handshake size={20} />
            <h4>Uso responsável</h4>
            <p>Dados alinhados estritamente com as finalidades e diretrizes da organização.</p>
          </div>
          <div className="info-card border-glow">
            <ShieldAlert size={20} />
            <h4>Privacidade</h4>
            <p>Desenvolvimento focado em princípios de proteção e tratamento adequado de dados.</p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <span className="section-label">Arquitetura da Solução</span>
          <h2>Construído para transformar dados em informação.</h2>
        </div>

        <div className="cards-grid grid-4">
          <div className="info-card border-glow">
            <Code size={20} />
            <h4>Frontend</h4>
            <p>React + TypeScript + Vite para alta performance e modularidade.</p>
          </div>
          <div className="info-card border-glow">
            <Cpu size={20} />
            <h4>Backend (Futuro)</h4>
            <p>Estrutura pronta para integrar via serviços RESTful com Node.js e Express.</p>
          </div>
          <div className="info-card border-glow">
            <Database size={20} />
            <h4>Banco de Dados</h4>
            <p>Preparado para armazenamento relacional com MySQL / PostgreSQL.</p>
          </div>
          <div className="info-card border-glow">
            <Network size={20} />
            <h4>Comunicação</h4>
            <p>Protocolos seguros para sincronização de dados das estações.</p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <span className="section-label">Etapa por Etapa</span>
          <h2>Como o Argus funciona</h2>
        </div>
        <div className="process-grid">
          {[
            ['01', 'Conecte', 'Instale o agente Argus nos computadores da organizacao com uma configuracao rapida.'],
            ['02', 'Colete', 'O sistema registra os dados essenciais de utilizacao definidos pela plataforma.'],
            ['03', 'Organize', 'As informacoes sao enviadas com seguranca ao servidor e estruturadas.'],
            ['04', 'Analise', 'O administrador acompanha os resultados consolidados em um dashboard completo.'],
          ].map(([number, title, text]) => (
            <article className="process-card" key={number}>
              <span className="step-num">{number}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header"><span className="section-label">Nossos Objetivos</span><h2>Por que Argus?</h2></div>
        <div className="comparison-container">
          <div className="comp-column traditional"><h3>Solucoes Tradicionais</h3><ul>{['Informacoes espalhadas', 'Interfaces complexas', 'Analises dificeis', 'Solucoes com alto custo', 'Monitoramento bruto'].map((item) => <li key={item}><X size={18} /> {item}</li>)}</ul></div>
          <div className="comp-column argus-solution"><span className="argus-badge">Proposta Argus</span><h3>Plataforma Argus</h3><ul>{['Visao centralizada', 'Interface simples e moderna', 'Dados organizados e intuitivos', 'Proposta acessivel e viavel', 'Foco em informacao e produtividade'].map((item) => <li key={item}><Check size={18} /> {item}</li>)}</ul></div>
        </div>
      </section>

      <section id="tecnologia" className="section-block dark-bg-box">
        <div className="section-header"><span className="section-label">Arquitetura da Solucao</span><h2>Construido para transformar dados em informacao.</h2></div>
        <div className="tech-stack-grid">
          {[['Frontend', 'Interface responsiva para administradores.', 'React', 'TypeScript', 'Vite'], ['Backend', 'Motor para recebimento e processamento das metricas.', 'Node.js', 'Express'], ['Banco de Dados', 'Armazenamento estruturado e otimizado.', 'MySQL', 'PostgreSQL'], ['API e Versionamento', 'Comunicacao REST e controle do codigo.', 'REST API', 'Git', 'GitHub']].map(([title, text, ...tags]) => <article className="tech-card" key={title}><div className="tech-header"><Workflow size={18} /><h4>{title}</h4></div><p className="tech-desc">{text}</p><div className="tech-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header"><span className="section-label">Evolucao do Projeto</span><h2>O Argus esta apenas comecando.</h2></div>
        <div className="roadmap-timeline">
          {[['AGORA', 'Fase Inicial', 'Monitoramento essencial, gerenciamento de maquinas e dashboard interativo.'], ['PROXIMA VERSAO', 'Expansao', 'Relatorios avancados, notificacoes personalizadas e metricas detalhadas.'], ['FUTURO', 'Inovacao', 'Integracao de inteligencia artificial, analises preditivas e aplicativo mobile.']].map(([tag, title, text]) => <article className="roadmap-item" key={tag}><span className="roadmap-tag">{tag}</span><h4>{title}</h4><p>{text}</p></article>)}
        </div>
      </section>
    </div>
  );
};