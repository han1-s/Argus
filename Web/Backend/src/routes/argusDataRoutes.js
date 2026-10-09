const express = require('express');
const autenticar = require('../middlewares/authMiddleware');
const {
  listarMaquinas,
  obterMaquina,
  obterDashboard,
  listarAtividades,
  listarRelatorios,
  listarAlertas,
  reconhecerAlerta,
  obterAssinatura,
  salvarAssinatura,
  concluirPagamentoSimulado,
  listarNotificacoes,
} = require('../controllers/argusDataController');

const router = express.Router();
router.get('/dashboard', autenticar, obterDashboard);
router.get('/maquinas', autenticar, listarMaquinas);
router.get('/maquinas/:id', autenticar, obterMaquina);
router.get('/atividades', autenticar, listarAtividades);
router.get('/relatorios', autenticar, listarRelatorios);
router.get('/alertas', autenticar, listarAlertas);
router.post('/alertas/:id/ack', autenticar, reconhecerAlerta);
router.get('/assinatura', autenticar, obterAssinatura);
router.put('/assinatura', autenticar, salvarAssinatura);
router.post('/assinatura/pagamentos-simulados', autenticar, concluirPagamentoSimulado);
router.get('/notificacoes', autenticar, listarNotificacoes);

module.exports = router;
