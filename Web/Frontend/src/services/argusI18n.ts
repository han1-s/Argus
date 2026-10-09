const LANGUAGE_KEY = 'argusSettings';

// Shared interface copy used by the Web application. Keeping the source text
// in one table lets the selected language apply to all routes, including text
// rendered later by React after navigation or API updates.
const english: Record<string, string> = {
  'Início': 'Home', 'Saiba Mais (duplicate)': 'Learn More', 'Planos': 'Plans', 'Download': 'Download',
  'Monitoramento': 'Monitoring', 'Análise': 'Analytics', 'Gestão': 'Management',
  'Tenha uma visão mais clara da sua operação.': 'Get a clearer view of your operations.',
  'O ARGUS centraliza informações dos computadores da sua organização para facilitar o acompanhamento de recursos, aplicações, sites e indicadores em uma única plataforma.': 'ARGUS brings your organization’s computer data together, making it easier to track resources, applications, websites, and metrics in one platform.',
  'Baixar agente': 'Download agent', 'Conheça o ARGUS': 'Discover ARGUS',
  'Visibilidade organizada para ambientes corporativos': 'Organized visibility for business environments',
  'PRÉVIA DO PRODUTO': 'PRODUCT PREVIEW', 'Demonstração': 'Demo', 'Em atividade': 'Active',
  'Período demonstrativo': 'Demo period', 'Atividade do ambiente': 'Environment activity',
  'Visão demonstrativa': 'Demo view', 'Status demonstrativo': 'Demo status', 'Online': 'Online', 'Offline': 'Offline',
  'Estação financeira': 'Finance workstation', 'Notebook design': 'Design laptop', 'Estação logística': 'Logistics workstation',
  'Aplicações': 'Applications', 'Navegador': 'Browser', 'Selecionar destaque': 'Select highlight',
  'Um ambiente. Mais contexto.': 'One environment. More context.',
  'Tudo o que você precisa para acompanhar seu ambiente.': 'Everything you need to monitor your environment.',
  'O ARGUS reúne informações de diferentes computadores em uma única interface, facilitando o acompanhamento, a organização e a análise dos dados.': 'ARGUS brings data from different computers into one interface, making it easier to monitor, organize, and analyze information.',
  'Computadores': 'Computers', 'Acompanhe os dispositivos cadastrados no ambiente.': 'Monitor devices registered in your environment.',
  'Visualize os softwares utilizados nos computadores.': 'View the software used on your computers.',
  'Sites': 'Websites', 'Organize informações sobre os domínios acessados.': 'Organize information about visited domains.',
  'Tempo': 'Time', 'Consulte períodos de utilização dos recursos.': 'Review resource usage over time.',
  'Relatórios': 'Reports', 'Dashboard': 'Dashboard', 'Como funciona?': 'How does it work?',
  'Uma visão completa da sua operação.': 'A complete view of your operations.',
  'Visualize informações importantes do ambiente monitorado de forma organizada e compreensível.': 'View important information about your monitored environment in a clear, organized way.',
  'Resumo do ambiente': 'Environment summary', 'Dados demonstrativos': 'Demo data', 'Utilização ao longo do dia': 'Usage throughout the day',
  'Atividade por categoria': 'Activity by category', 'Outros dados': 'Other data', 'Por que ARGUS?': 'Why ARGUS?',
  'Monitoramento com responsabilidade.': 'Responsible monitoring.', 'Privacidade': 'Privacy', 'Segurança': 'Security',
  'Conheça uma nova forma de acompanhar sua operação.': 'Discover a new way to monitor your operations.',
  '© 2026 ARGUS. Todos os direitos reservados.': '© 2026 ARGUS. All rights reserved.',
  'Configurações': 'Settings', 'PREFERÊNCIAS DO ARGUS': 'ARGUS PREFERENCES',
  'Personalize sua experiência no ARGUS e gerencie suas preferências.': 'Personalize your ARGUS experience and manage your preferences.',
  'Salvas localmente neste navegador': 'Saved locally in this browser',
  'Categorias de configurações': 'Settings categories', 'PREFERÊNCIAS': 'PREFERENCES',
  'Dados e Privacidade': 'Data and Privacy', 'Notificações': 'Notifications', 'Aparência': 'Appearance',
  'Idioma e Horário': 'Language and Time', 'Planos e Cobrança': 'Plans and Billing',
  'Estas opções são armazenadas neste navegador, não em um servidor.': 'These options are stored in this browser, not on a server.',
  'Gerencie o perfil e as preferências guardadas neste navegador.': 'Manage your profile and preferences stored in this browser.',
  'Foto do perfil': 'Profile picture', 'A imagem é armazenada localmente neste navegador. Tamanho máximo: 2 MB.': 'The image is stored locally in this browser. Maximum size: 2 MB.',
  'Imagem de perfil': 'Profile picture', 'Alterar foto': 'Change picture', 'Remover foto': 'Remove picture',
  'Salvar alterações': 'Save changes', 'Nome': 'Name', 'E-mail': 'Email',
  'Escolha quais categorias de aviso prefere ver na interface.': 'Choose which notification categories you want to see in the interface.',
  'Preferências desta interface ficam neste navegador. Alertas e eventos abaixo são lidos diretamente do Platform e atualizados a cada 30 segundos.': 'These interface preferences stay in this browser. Alerts and events below are read directly from Platform and refreshed every 30 seconds.',
  'Notificações do sistema': 'System notifications', 'Alertas gerais relacionados ao desempenho e ao funcionamento do ARGUS.': 'General alerts about ARGUS performance and operation.',
  'Alertas preditivos de IA': 'AI predictive alerts', 'Preferência para alertas relacionados às análises e previsões do sistema.': 'Alerts related to system analysis and predictions.',
  'Novidades e atualizações': 'News and updates', 'Novidades, atualizações e avisos importantes de segurança do ARGUS.': 'ARGUS news, updates, and important security notices.',
  'Atividade do Platform': 'Platform activity', 'Ativo': 'Active', 'Reconhecido': 'Acknowledged',
  'Nenhum evento ou alerta recebido do Platform.': 'No events or alerts received from Platform.',
  'Configure o tema e os efeitos visuais da interface.': 'Set the interface theme and visual effects.',
  'Tema': 'Theme', 'O tema selecionado é aplicado imediatamente a esta interface.': 'The selected theme is applied immediately to this interface.',
  'Escuro': 'Dark', 'Cinza': 'Gray', 'Claro': 'Light', 'Tema principal do ARGUS.': 'ARGUS default theme.',
  'Tonalidade intermediária.': 'A medium tone.', 'Para ambientes mais iluminados.': 'For brighter environments.',
  'Efeitos visuais': 'Visual effects', 'Ative ou reduza movimentos e brilhos decorativos.': 'Enable or reduce motion and decorative glow effects.',
  'Animações da interface': 'Interface animations', 'Controla as transições e animações visuais do ARGUS.': 'Controls ARGUS transitions and visual animations.',
  'Efeitos de brilho e neon': 'Glow and neon effects', 'Controla os efeitos de brilho usados na interface, sem alterar a legibilidade.': 'Controls interface glow effects without affecting readability.',
  'A preferência de movimento reduzido do dispositivo também é respeitada.': 'Your device reduced-motion preference is also respected.',
  'Preferências regionais para a experiência ARGUS.': 'Regional preferences for ARGUS.', 'Idioma': 'Language',
  'Idioma da interface': 'Interface language', 'Português (Brasil)': 'Português (Brazil)', 'English (United States)': 'English (United States)',
  'O idioma escolhido é salvo localmente e poderá ser usado quando a tradução estiver disponível.': 'Your language choice is saved locally and applied across the interface.',
  'A interface permanece em português onde a tradução ainda não está disponível.': 'Interface language',
  'Fuso horário': 'Time zone', 'O fuso horário é definido pelo sistema e não pode ser alterado nesta versão.': 'The time zone is set by your system and cannot be changed in this version.',
  'Horário local': 'Local time', 'Horário Oficial de Brasília (UTC−03:00)': 'Brasília Time (UTC−03:00)',
  'Consulte a assinatura persistida na sua conta.': 'View the subscription saved to your account.', 'PLANO ATUAL (duplicate)': 'CURRENT PLAN',
  'Ciclo anual demonstrativo.': 'Demo annual billing cycle.', 'Ciclo mensal demonstrativo.': 'Demo monthly billing cycle.',
  'Nenhuma cobrança real é processada.': 'No real charges are processed.', 'Limite de computadores': 'Computer limit',
  'Ilimitado': 'Unlimited', 'Até 50': 'Up to 50', 'Até 10': 'Up to 10', 'Retenção de métricas': 'Metrics retention',
  'Ampliada': 'Extended', 'Forma de pagamento': 'Payment method', 'PIX simulado': 'Simulated PIX', 'Nenhum pagamento': 'No payment',
  'Último valor simulado': 'Last simulated amount', 'Gerenciar assinatura': 'Manage subscription',
  'Encerrado': 'Ended', 'Limpar armazenamento local': 'Clear local storage',
  'Cancelar': 'Cancel', 'Confirmar': 'Confirm', 'Início da página': 'Home page',
  'Acesso seguro': 'Secure sign in', 'Entre para monitorar os dispositivos da sua rede.': 'Sign in to monitor devices on your network.',
  'Criar sua conta': 'Create your account', 'Ainda não tem acesso?': 'New to ARGUS?', 'Já possui acesso?': 'Already have an account?',
  'Fazer login': 'Sign in', 'Entrar': 'Sign in', 'Sair da conta': 'Sign out', 'Esqueci a senha': 'Forgot password',
  'Escolha o plano ideal para sua operação.': 'Choose the right plan for your operation.',
  'Plano atual': 'Current plan', 'Recursos claros para sua operação': 'Clear features for your operation',
  'Compare os planos': 'Compare plans', 'Mensal': 'Monthly', 'Anual': 'Annual', 'Recomendado': 'Recommended',
  'Escolher': 'Choose', 'Ativar Free': 'Activate Free',
  'Compatibilidade (duplicate)': 'Compatibility', 'Windows': 'Windows', 'Mais recente': 'Latest',
  'Baixe o agente ARGUS (duplicate)': 'Download the ARGUS agent', 'Baixar instalador (duplicate)': 'Download installer',
  'Iniciar sessão': 'Sign in', 'Ver planos': 'View plans', 'Saiba mais': 'Learn more',
  'Todos os direitos reservados.': 'All rights reserved.',
  'Criar conta no ARGUS': 'Create an ARGUS account', 'Acessar o ARGUS': 'Sign in to ARGUS',
  'Crie sua conta para começar a utilizar a plataforma.': 'Create an account to start using the platform.',
  'Entre na sua conta para acessar sua experiência no ARGUS.': 'Sign in to access your ARGUS experience.',
  'ACESSO À PLATAFORMA': 'PLATFORM ACCESS', 'Nome completo': 'Full name', 'Seu nome completo': 'Your full name',
  'E-mail corporativo': 'Work email', 'Digite sua senha': 'Enter your password', 'Ocultar senha': 'Hide password',
  'Mostrar senha': 'Show password', 'Li e aceito os': 'I have read and accept the',
  'Termos de Uso e Aviso de Privacidade': 'Terms of Use and Privacy Notice',
  'Opcional: autorizo a coleta de domínios de navegação.': 'Optional: I consent to the collection of visited domains.',
  'Recuperar senha': 'Recover password', 'Recuperar acesso': 'Recover access',
  'Vamos simular o envio de um código de recuperação para seu e-mail.': 'We will simulate sending a recovery code to your email.',
  'E-mail da conta': 'Account email', 'Simular envio do e-mail': 'Simulate sending email',
  'Código de 6 dígitos': '6-digit code', 'Nova senha': 'New password', 'Redefinir senha': 'Reset password',
  'Fechar checkout': 'Close checkout', 'SIMULAÇÃO CONCLUÍDA (duplicate)': 'SIMULATION COMPLETE',
  'Plano registrado': 'Plan saved', 'Referência:': 'Reference:', 'Concluir': 'Done',
  'CHECKOUT DEMONSTRATIVO': 'DEMO CHECKOUT', 'Resumo da contratação': 'Order summary',
  'Escolha uma forma de pagamento fictícia para registrar a demonstração.': 'Choose a simulated payment method to complete the demo.',
  'Plano selecionado': 'Selected plan', 'Período': 'Billing period', 'Total anual demonstrativo': 'Demo annual total',
  'Valor demonstrativo': 'Demo amount', 'ano': 'year', 'mês': 'month', 'Equivalente mensal de': 'Monthly equivalent of',
  'Forma de pagamento simulada': 'Simulated payment method', 'Crédito': 'Credit', 'Débito': 'Debit',
  'PIX DE DEMONSTRAÇÃO': 'DEMO PIX', 'Chave fictícia, sem vínculo com uma conta financeira.': 'This is a fictional key and is not linked to a financial account.',
  'Copiada': 'Copied', 'Copiar': 'Copy', 'Simular pagamento PIX': 'Simulate PIX payment',
  'Número de demonstração': 'Demo card number', 'Nome (não será armazenado)': 'Name (will not be stored)',
  'Nome fictício': 'Fictional name', 'Validade': 'Expiration date', 'CVV (não será armazenado)': 'CVV (will not be stored)',
  'Use apenas dados fictícios.': 'Use fictional information only.', 'Pagamento simulado': 'Simulated payment',
  'Baixe o agente ARGUS': 'Download the ARGUS agent', 'Instale o agente ARGUS nos computadores que serão integrados ao sistema de monitoramento.': 'Install the ARGUS agent on computers you want to connect to the monitoring system.',
  'Integração entre computadores e plataforma': 'Connect computers to the platform', 'INSTALADOR DA PLATFORM': 'PLATFORM INSTALLER',
  'ARGUS para Windows': 'ARGUS for Windows', 'Instalador guiado': 'Guided installer', 'Baixar instalador': 'Download installer',
  'Endereço do servidor Platform': 'Platform server address', 'Componentes': 'Components', 'Agente + assistente': 'Agent + setup assistant',
  'Configuração': 'Setup', 'Guiada no navegador': 'Guided in browser', 'Compatibilidade': 'Compatibility',
  'Distribuição': 'Distribution', 'Arquivo CMD': 'CMD file', 'Informe um endereço válido': 'Enter a valid address',
  'Registro de alterações': 'Release notes', 'Histórico de versões': 'Version history',
  'Dúvidas frequentes': 'Frequently asked questions', 'Modo demonstração': 'Demo mode',
  'SIMULAÇÃO CONCLUÍDA': 'SIMULATION COMPLETE',
};

const portuguese = Object.fromEntries(Object.entries(english).map(([source, translated]) => [translated, source]));
const englishEntries = Object.entries(english).sort(([left], [right]) => right.length - left.length);
const portugueseEntries = Object.entries(portuguese).sort(([left], [right]) => right.length - left.length);
function translateText(value: string, language: string) {
  const dictionary = language === 'en-US' ? english : portuguese;
  const trimmed = value.trim();
  const exact = dictionary[trimmed];
  if (exact !== undefined) return value.replace(trimmed, exact);
  let translated = value;
  const entries = language === 'en-US' ? englishEntries : portugueseEntries;
  for (const [source, target] of entries) {
    if (source.includes(' ') && translated.includes(source)) translated = translated.replaceAll(source, target);
  }
  return translated;
}

function translateElement(element: Element, language: string) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.textContent) node.textContent = translateText(node.textContent, language);
    node = walker.nextNode();
  }
  element.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]').forEach((item) => {
    for (const attribute of ['placeholder', 'aria-label', 'title'] as const) {
      const value = item.getAttribute(attribute);
      if (value) item.setAttribute(attribute, translateText(value, language));
    }
  });
}

export function applyArgusLanguage(language: string) {
  const selected = language === 'en-US' ? 'en-US' : 'pt-BR';
  document.documentElement.lang = selected;
  document.title = selected === 'en-US' ? 'ARGUS · Monitoring platform' : 'ARGUS · Plataforma de monitoramento';
  translateElement(document.body, selected);
}

export function installArgusTranslations() {
  let selected = 'pt-BR';
  try {
    const settings = JSON.parse(localStorage.getItem(LANGUAGE_KEY) || '{}') as { language?: string };
    selected = settings.language === 'en-US' ? 'en-US' : 'pt-BR';
  } catch { /* Use Portuguese when preferences are unavailable. */ }
  applyArgusLanguage(selected);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData' && record.target.textContent) {
        record.target.textContent = translateText(record.target.textContent, selected);
      }
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) translateElement(node, selected);
        else if (node.textContent) node.textContent = translateText(node.textContent, selected);
      });
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  const onLanguageChange = (event: Event) => {
    selected = (event as CustomEvent<string>).detail === 'en-US' ? 'en-US' : 'pt-BR';
    applyArgusLanguage(selected);
  };
  window.addEventListener('argus-language-changed', onLanguageChange);
  return () => { observer.disconnect(); window.removeEventListener('argus-language-changed', onLanguageChange); };
}
