const express = require('express');
const autenticar = require('../middlewares/authMiddleware');
const { cadastrar, login, logout, me, perfil, solicitarRecuperacao, redefinirSenha } = require('../controllers/authController');

const router = express.Router();
router.post(['/signup', '/register'], cadastrar);
router.post('/login', login);
router.post('/forgot-password', solicitarRecuperacao);
router.post('/reset-password', redefinirSenha);
router.post('/logout', logout);
router.get('/me', autenticar, me);
router.get('/profile', autenticar, perfil);

module.exports = router;