
import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings'
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    console.log('Update Settings Request Body:', req.body);
    const updatedSettings = await settingsService.updateSettings(req.body);
    console.log('Settings updated:', updatedSettings.id);
    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

export const verifyFeature = async (req: Request, res: Response) => {
  try {
    const { feature } = req.params;
    const settings = await settingsService.getSettings();

    let result = {
        enabled: false,
        message: ''
    };

    if (feature === 'auto_assignment') {
        result.enabled = settings.auto_assignment;
        result.message = settings.auto_assignment 
            ? 'LOGIC CHECK: ENABLED. The system is configured to auto-assign riders to new orders.' 
            : 'LOGIC CHECK: DISABLED. New orders will remain in "Pending" status until manually assigned.';
    } else if (feature === 'gps_tracking') {
        result.enabled = settings.gps_tracking;
        result.message = settings.gps_tracking
            ? 'LOGIC CHECK: ENABLED. The system is accepting real-time location updates from riders.'
            : 'LOGIC CHECK: DISABLED. The system is rejecting location updates to save resources.';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid feature' });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Verify feature error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
