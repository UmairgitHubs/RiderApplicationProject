import { Router } from 'express';
import authRoutes from './auth.routes';
import shipmentRoutes from './shipment.routes';
import riderRoutes from './rider.routes';
import walletRoutes from './wallet.routes';
import notificationRoutes from './notification.routes';
import profileRoutes from './profile.routes';
import adminRoutes from './admin.routes';
import analyticsRoutes from './analytics.routes';
import adminShipmentRoutes from './admin.shipment.routes';
import adminMerchantRoutes from './admin.merchant.routes';
import adminRiderRoutes from './admin.rider.routes';
import adminHubRoutes from './admin.hub.routes';
import adminPaymentRoutes from './admin.payment.routes';
import adminSettingsRoutes from './admin.settings.routes';
import adminAgentRoutes from './admin.agent.routes';
import adminWalletRoutes from './admin.wallet.routes';
import adminCMSRoutes from './admin.cms.routes';
import adminSupportRoutes from './admin.support.routes';
import adminRouteRoutes from './admin.route.routes';
import supportRoutes from './support.routes';
import { maintenanceMiddleware } from '../middleware/maintenance.middleware';

const router = Router();
router.use(maintenanceMiddleware); // Apply global maintenance check for all routes in this router

router.use('/auth', authRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/rider', riderRoutes);
router.use('/wallet', walletRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/support', supportRoutes);

// More specific admin routes FIRST
router.use('/admin/analytics', analyticsRoutes);
router.use('/admin/shipments', adminShipmentRoutes);
router.use('/admin/merchants', adminMerchantRoutes);
router.use('/admin/riders', adminRiderRoutes);
router.use('/admin/hubs', adminHubRoutes);
router.use('/admin/payments', adminPaymentRoutes);
router.use('/admin/settings', adminSettingsRoutes);
router.use('/admin/agents', adminAgentRoutes);
router.use('/admin/wallets', adminWalletRoutes);
router.use('/admin/cms', adminCMSRoutes);
router.use('/admin/support', adminSupportRoutes);
router.use('/admin/routes', adminRouteRoutes);

// General admin routes LAST
router.use('/admin', adminRoutes);

export default router;



