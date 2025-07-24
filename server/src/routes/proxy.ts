import { Router } from 'express';
import { ProxyController } from '../controllers/proxy';

const router = Router();
const proxyController = new ProxyController();

// Admin routes - proxy all admin requests to Railway
router.all('/admin*', (req, res) => proxyController.proxyAdminRequest(req, res));

// User routes - proxy all user requests to Railway  
router.all('/user*', (req, res) => proxyController.proxyUserRequest(req, res));

// Auth routes - proxy authentication to Railway
router.all('/auth*', (req, res) => proxyController.proxyRequest(req, res));

export default router;