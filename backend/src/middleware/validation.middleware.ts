import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: errors.array().map(err => ({
          field: err.type === 'field' ? err.path : 'unknown',
          message: err.msg,
        })),
      },
    });
  }
  
  next();
};

// Validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long.'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number.'),
  body('role')
    .isIn(['merchant', 'rider', 'admin'])
    .withMessage('Role must be merchant, rider, or admin.'),
  validate,
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  validate,
];

export const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  validate,
];

export const validateVerifyOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required.')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits.')
    .isNumeric()
    .withMessage('Verification code must be numeric.'),
  validate,
];

export const validateResetPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required.')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits.')
    .isNumeric()
    .withMessage('Verification code must be numeric.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  validate,
];

export const validateCreateShipment = [
  body('recipientName')
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required.'),
  body('recipientPhone')
    .notEmpty()
    .withMessage('Recipient phone is required.'),
  body('pickupAddress')
    .trim()
    .notEmpty()
    .withMessage('Pickup address is required.'),
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required.'),
  body('packageWeight')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Package weight must be a positive number.'),
  body('codAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('COD amount must be a positive number.'),
  validate,
];

export const validateCreateRoute = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Route name is required.')
    .isLength({ min: 3 })
    .withMessage('Route name must be at least 3 characters long.'),
  body('hubId')
    .notEmpty()
    .withMessage('Hub ID is required.')
    .isUUID()
    .withMessage('Invalid Hub ID format.'),
  body('riderId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Rider ID format.'),
  body('stops')
    .isArray({ min: 1 })
    .withMessage('At least one stop is required.'),
  body('stops.*.shipmentId')
    .notEmpty()
    .withMessage('Shipment ID is required for each stop.')
    .isUUID()
    .withMessage('Invalid Shipment ID format.'),
  body('stops.*.type')
    .isIn(['pickup', 'delivery', 'waypoint'])
    .withMessage('Invalid stop type.'),
  validate,
];



