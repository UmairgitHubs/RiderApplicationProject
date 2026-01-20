import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { asyncHandler } from '../middleware/async.middleware';

const router = Router();

/**
 * Get public/general system settings (accessible to all authenticated users)
 */
router.get('/info', authenticate, asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findFirst();
    
    if (!settings) {
        return res.json({
            success: true,
            data: {
                company_name: "Cod Express",
                company_phone: "+1 800-COD-EXPRESS",
                company_email: "support@codexpress.com"
            }
        });
    }

    res.json({
        success: true,
        data: {
            company_name: settings.company_name,
            company_phone: settings.company_phone,
            company_email: settings.company_email,
            base_delivery_fee: settings.base_delivery_fee,
            currency: settings.currency
        }
    });
}));

export default router;
