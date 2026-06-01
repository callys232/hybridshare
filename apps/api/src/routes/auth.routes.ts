import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimit, (req, res) => authController.register(req, res));
router.post('/login', authRateLimit, (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));
router.post('/forgot-password', authRateLimit, (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', authRateLimit, (req, res) => authController.resetPassword(req, res));

router.post('/2fa/setup', authMiddleware, (req, res) => authController.setupTwoFactor(req, res));
router.post('/2fa/verify', authMiddleware, (req, res) => authController.verifyTwoFactor(req, res));
router.post('/2fa/validate', authRateLimit, (req, res) => authController.validateTwoFactor(req, res));

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }),
  (req, res) => authController.googleCallback(req, res)
);

router.get('/oauth/microsoft', passport.authenticate('azuread-openidconnect', { session: false }));
router.get(
  '/oauth/microsoft/callback',
  passport.authenticate('azuread-openidconnect', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }),
  (req, res) => authController.microsoftCallback(req, res)
);

router.post('/ldap', authRateLimit, (req, res) => authController.ldapLogin(req, res));

export { router as authRouter };
