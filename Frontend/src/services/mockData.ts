import type { PricingPlan, FAQItem, ComputerDevice, ActivityLog } from '../types';

export const PLANS_DATA: PricingPlan[] = [
  {
    id: 'Free',
    name: 'Free',
    description: 'Para estudantes e pequenos testes locais.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      { text: 'Até 10 computadores', included: true },
      { text: 'Métricas básicas de hardware', included: true },
      { text: 'Retenção de dados por 7 dias', included: true },
      { text: 'Alertas por IA preditiva', included: false },
      { text: 'Suporte prioritário 24/7', included: false },
    ],
  },
  {
    id: 'Pro',
    name: 'Pro',
    description: 'Ideal para startups e infraestruturas em crescimento.',
    priceMonthly: 49,
    priceAnnual: 39.2,
    popular: true,
    features: [
      { text: 'Até 50 computadores', included: true },
      { text: 'Métricas completas em tempo real', included: true },
      { text: 'Retenção de dados por 90 dias', included: true },
      { text: 'Alertas por IA preditiva (3 modelos)', included: true },
      { text: 'Suporte via Chat & e-mail', included: true },
    ],
  },
  {
    id: 'Business',
    name: 'Business',
    description: 'Escala ilimitada com máxima segurança e controle.',
    priceMonthly: 149,
    priceAnnual: 119.2,
    features: [
      { text: 'Computadores Ilimitados', included: true },
      { text: 'Histórico ilimitado de logs', included: true },
      { text: 'Modelos IA customizados', included: true },
      { text: 'Integração via API dedicada', included: true },
      { text: 'Gerente de conta + Suporte 24/7', included: true },
    ],
  },
];

export const FAQ_DATA: FAQItem[] = [
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer: 'Você pode solicitar o cancelamento a qualquer momento. O acesso permanece ativo até o fim do período já pago, sem cobrança de multa.',
  },
  {
    question: 'Como funciona o faturamento anual?',
    answer: 'O plano anual tem 20% de desconto. Você pode pagar o total à vista ou parcelar em até 12 vezes no cartão.',
  },
  {
    question: 'Quais meios de pagamento são aceitos?',
    answer: 'Aceitamos cartões de crédito, PIX e boleto bancário. A confirmação do boleto pode levar alguns dias úteis.',
  },
];

export const MOCK_COMPUTERS: ComputerDevice[] = [
  { id: '1', name: 'DEV-DESKTOP-01', user: 'Carlos Silva', os: 'Windows 11 Pro', status: 'online', cpuUsage: 42, ramUsage: 68, lastActive: 'Agora', ipAddress: '192.168.1.21', location: 'São Paulo, SP', processor: 'Intel Core i7-12700', memory: '32 GB DDR4', storage: 'SSD 1 TB', serialNumber: 'ARG-DEV-001' },
  { id: '2', name: 'DEV-NOTEBOOK-04', user: 'Ana Souza', os: 'macOS Sonoma', status: 'online', cpuUsage: 18, ramUsage: 45, lastActive: 'Agora', ipAddress: '192.168.1.24', location: 'São Paulo, SP', processor: 'Apple M2 Pro', memory: '16 GB', storage: 'SSD 512 GB', serialNumber: 'ARG-DEV-004' },
  { id: '3', name: 'DESIGN-MAC-02', user: 'Mariana Costa', os: 'macOS Ventura', status: 'alert', cpuUsage: 94, ramUsage: 89, lastActive: '2 min atrás', ipAddress: '192.168.1.31', location: 'Campinas, SP', processor: 'Apple M1 Max', memory: '32 GB', storage: 'SSD 1 TB', serialNumber: 'ARG-DES-002' },
  { id: '4', name: 'FIN-DESKTOP-08', user: 'Roberto Dias', os: 'Windows 10 Pro', status: 'offline', cpuUsage: 0, ramUsage: 0, lastActive: 'Há 3 horas', ipAddress: '192.168.1.48', location: 'São Paulo, SP', processor: 'Intel Core i5-10400', memory: '16 GB DDR4', storage: 'SSD 512 GB', serialNumber: 'ARG-FIN-008' },
];

export const MOCK_ACTIVITIES: ActivityLog[] = [
  { id: '1', type: 'app', name: 'Visual Studio Code', category: 'Desenvolvimento', durationMinutes: 240, impact: 'productive' },
  { id: '2', type: 'website', name: 'github.com', category: 'Repositório', durationMinutes: 85, impact: 'productive' },
  { id: '3', type: 'app', name: 'Figma', category: 'Design', durationMinutes: 130, impact: 'productive' },
  { id: '4', type: 'website', name: 'youtube.com', category: 'Entretenimento', durationMinutes: 45, impact: 'unproductive' },
];
