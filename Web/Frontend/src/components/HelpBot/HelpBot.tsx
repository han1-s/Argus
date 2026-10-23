import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './HelpBot.css';

type Message = { id: number; from: 'user' | 'bot'; text: string };

const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function answerFor(question: string, pathname: string) {
  const text = clean(question);
  if (/plano|assin|limite|compr|pagamento|upgrade/.test(text)) {
    return 'Na área Planos você vê os limites aplicados: Free comporta até 10 computadores e 7 dias de retenção; Pro, 50 computadores e 90 dias; Business, computadores ilimitados e 365 dias. A compra é simulada e a assinatura compartilhada com a Platform.';
  }
  if (/foto|avatar|perfil|nome|email|e-mail/.test(text)) {
    return 'Web e Platform usam o mesmo perfil no banco ARGUS. Altere nome, e-mail ou foto em Configurações; a mudança aparece nas duas interfaces. A recuperação de senha também atualiza a conta compartilhada.';
  }
  if (/conta|login|senha|cadastro|web|platform/.test(text)) {
    return 'Web e Platform usam a mesma conta quando estão conectadas ao mesmo servidor e banco ARGUS. Entre com o mesmo e-mail e senha nas duas interfaces.';
  }
  if (/offline|desconect|fila|enviar|sincron/.test(text)) {
    return 'O agente coleta leituras localmente e mantém uma fila gravada em disco enquanto não alcança a API. Quando a conexão volta, reenvia as amostras pendentes em ordem. A API Platform e o MySQL precisam estar ativos para persistir os dados.';
  }
  if (/computador|agente|endpoint|vincular|conectar/.test(text)) {
    return 'No Platform, escolha Adicionar computador e baixe ARGUS.cmd. No endpoint autorizado, execute o arquivo, informe o endereço LAN do servidor e use o código de vínculo exibido no painel. O código vale por 15 minutos.';
  }
  if (/mysql|servidor|banco|api|instal/.test(text)) {
    return 'Prepare e inicie o servidor pela opção correspondente no ARGUS.cmd. O MySQL e a API Platform ficam no computador principal; o endpoint precisa apenas do agente e de acesso à rede do servidor. O Web usa o mesmo banco compartilhado.';
  }
  if (/navega|dominio|extens/.test(text)) {
    return 'A coleta web é opcional: precisa de consentimento nas Configurações e da extensão ARGUS ativada no navegador. Ela registra domínio e duração aproximada, sem salvar URL completa ou conteúdo.';
  }
  if (/privacidade|consent|seguranca|dados/.test(text)) {
    return 'Use o ARGUS somente em computadores autorizados. O consentimento web é separado e pode ser revogado nas Configurações; ao revogar, o histórico web da conta é apagado.';
  }
  if (/tema|claro|cinza|escuro|aparencia/.test(text)) {
    return 'Abra Configurações → Aparência e escolha Escuro, Cinza ou Claro. O tema é salvo em cada navegador e aplicado imediatamente.';
  }
  if (/aplic|processo|foreground|primeiro plano/.test(text)) {
    return 'No Windows, o agente mede o tempo em que uma janela fica em primeiro plano com entrada recente. Ele não lê títulos, documentos, teclas ou conteúdo.';
  }
  if (/pagina|onde|estou/.test(text)) {
    return 'Você está em ' + pathname + '. Posso ajudar com planos, contas, computadores, coleta web, instalação e privacidade.';
  }
  return 'Posso ajudar com planos e limites, conta compartilhada, instalação do agente, envio de dados, coleta web e privacidade. Faça uma pergunta mais específica ou use os atalhos abaixo.';
}

export const HelpBot: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'bot', text: 'Olá! Sou o assistente ARGUS. Pergunte sobre conta, instalação, agente, planos ou privacidade, ou escolha um atalho.' },
  ]);
  const nextId = useRef(2);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !messagesRef.current) return;
    messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const ask = (question: string) => {
    const value = question.trim();
    if (!value) return;
    setMessages(current => [
      ...current,
      { id: nextId.current++, from: 'user', text: value },
      { id: nextId.current++, from: 'bot', text: answerFor(value, location.pathname) },
    ]);
    setDraft('');
  };

  return createPortal((
    <div className="argus-helpbot">
      {open && <section className="argus-helpbot-panel" role="dialog" aria-label="Ajuda do ARGUS">
        <header><span className="argus-helpbot-icon"><Bot size={19} /></span><div><strong>Assistente ARGUS</strong><small>Ajuda rápida · {location.pathname}</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar ajuda"><X size={18} /></button></header>
        <div className="argus-helpbot-messages" aria-live="polite" ref={messagesRef}>
          {messages.map(message => <p key={message.id} className={'argus-helpbot-message ' + message.from}>{message.text}</p>)}
        </div>
        <div className="argus-helpbot-shortcuts">
          <button type="button" onClick={() => ask('Como conectar um computador?')}>Conectar computador</button>
          <button type="button" onClick={() => ask('Como funciona a fila offline?')}>Agente offline</button>
          <button type="button" onClick={() => ask('Como sincronizo meu perfil?')}>Perfil compartilhado</button>
          <button type="button" onClick={() => ask('Quais são os limites dos planos?')}>Planos e limites</button>
          <button type="button" onClick={() => ask('Como configurar o tema claro ou cinza?')}>Temas</button>
          <Link to="/monetizacao" onClick={() => setOpen(false)}>Abrir planos</Link>
        </div>
        <form className="argus-helpbot-compose" onSubmit={event => { event.preventDefault(); ask(draft); }}>
          <input value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} placeholder="Escreva sua pergunta…" aria-label="Pergunta para a ajuda ARGUS" />
          <button type="submit" aria-label="Enviar pergunta" disabled={!draft.trim()}><Send size={16} /></button>
        </form>
      </section>}
      <button className="argus-helpbot-toggle" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Fechar ajuda ARGUS' : 'Abrir ajuda ARGUS'}>
        {open ? <X size={19} /> : <MessageCircle size={19} />}<span>{open ? 'Fechar' : 'Ajuda ARGUS'}</span>
      </button>
    </div>
  ), document.body);
};
