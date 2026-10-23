import React, { useEffect, useRef, useState } from 'react';
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
  if (/conta|login|senha|cadastro|web|platform/.test(text)) {
    return 'Web e Platform usam a mesma conta quando estão conectadas ao mesmo servidor e banco ARGUS. Entre com o mesmo e-mail e senha nas duas interfaces.';
  }
  if (/computador|agente|colet|offline|desconect|banco|mysql|fila|enviar/.test(text)) {
    return 'O agente guarda amostras em uma fila local quando perde contato com a API e tenta reenviá-las quando a conexão volta. A API Platform e o MySQL precisam estar ativos para persistir os dados.';
  }
  if (/navega|dominio|extens/.test(text)) {
    return 'A coleta web é opcional: precisa de consentimento nas Configurações e da extensão ARGUS ativada no navegador. Ela registra domínio e duração aproximada, sem salvar URL completa ou conteúdo.';
  }
  if (/privacidade|consent|seguranca|dados/.test(text)) {
    return 'Use o ARGUS somente em computadores autorizados. O consentimento web é separado e pode ser revogado nas Configurações; ao revogar, o histórico web da conta é apagado.';
  }
  if (/download|instal/.test(text)) {
    return 'Na página Download, informe o endereço local da Platform e baixe o instalador. No endpoint autorizado, informe o endereço do servidor e o código de vínculo exibido no painel.';
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
    { id: 1, from: 'bot', text: 'Olá! Sou a ajuda do ARGUS. Pergunte sobre sua conta, planos ou monitoramento.' },
  ]);
  const nextId = useRef(2);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, open]);

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

  return (
    <div className="argus-helpbot">
      {open && <section className="argus-helpbot-panel" role="dialog" aria-label="Ajuda do ARGUS">
        <header><span className="argus-helpbot-icon"><Bot size={19} /></span><div><strong>Assistente ARGUS</strong><small>Ajuda rápida · {location.pathname}</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar ajuda"><X size={18} /></button></header>
        <div className="argus-helpbot-messages" aria-live="polite">
          {messages.map(message => <p key={message.id} className={'argus-helpbot-message ' + message.from}>{message.text}</p>)}
          <div ref={endRef} />
        </div>
        <div className="argus-helpbot-shortcuts">
          <button type="button" onClick={() => ask('Quais são os limites dos planos?')}>Planos e limites</button>
          <button type="button" onClick={() => ask('Como as contas Web e Platform se conectam?')}>Conta compartilhada</button>
          <Link to="/monetizacao" onClick={() => setOpen(false)}>Abrir planos</Link>
        </div>
        <form className="argus-helpbot-compose" onSubmit={event => { event.preventDefault(); ask(draft); }}>
          <input value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} placeholder="Escreva sua pergunta…" aria-label="Pergunta para a ajuda ARGUS" />
          <button type="submit" aria-label="Enviar pergunta" disabled={!draft.trim()}><Send size={16} /></button>
        </form>
      </section>}
      <button className="argus-helpbot-toggle" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Fechar ajuda ARGUS' : 'Abrir ajuda ARGUS'}>
        {open ? <X size={19} /> : <MessageCircle size={19} />}<span>{open ? 'Fechar' : 'Ajuda'}</span>
      </button>
    </div>
  );
};
