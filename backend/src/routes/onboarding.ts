import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { deviceOnboardingService } from '../services/deviceOnboardingService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['desktop', 'laptop', 'server', 'mobile', 'iot', 'other']),
  os: z.enum(['linux', 'macos', 'windows', 'android', 'ios', 'other']),
  pairingCode: z.string().length(6)
});

const verifyDeviceSchema = z.object({
  apiKey: z.string().min(32)
});

const joinMeshSchema = z.object({
  nodeId: z.string(),
  capabilities: z.object({
    cpu: z.number(),
    memory: z.number(),
    storage: z.number(),
    network: z.string().optional()
  })
});

/**
 * Generate pairing code
 * POST /api/onboarding/pairing-code
 */
router.post('/pairing-code', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, expiresAt } = deviceOnboardingService.generatePairingCode();
    
    logger.info('Pairing code generated', { 
      userId: (req as any).user?.id,
      expiresAt 
    });

    res.json({
      success: true,
      code,
      expiresAt,
      validFor: '15 minutes'
    });
  } catch (error) {
    logger.error('Error generating pairing code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate pairing code'
    });
  }
});

/**
 * Register a new device
 * POST /api/onboarding/register
 */
router.post('/register', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validation = registerDeviceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await deviceOnboardingService.registerDevice(
      validation.data,
      userId
    );

    logger.info('Device registered', { 
      userId,
      nodeId: result.nodeId,
      deviceName: validation.data.name
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error registering device:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to register device'
    });
  }
});

/**
 * Verify device with API key
 * POST /api/onboarding/verify
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const validation = verifyDeviceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    const result = await deviceOnboardingService.verifyDevice(validation.data.apiKey);

    logger.info('Device verified', { nodeId: result.nodeId });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error verifying device:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Device verification failed'
    });
  }
});

/**
 * Join device to mesh network
 * POST /api/onboarding/join-mesh
 */
router.post('/join-mesh', async (req: Request, res: Response) => {
  try {
    const validation = joinMeshSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const result = await deviceOnboardingService.joinMesh(
      validation.data.nodeId,
      validation.data.capabilities
    );

    logger.info('Device joined mesh', { 
      nodeId: validation.data.nodeId,
      role: result.role
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error joining mesh:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to join mesh'
    });
  }
});

/**
 * Discover devices on network
 * GET /api/onboarding/discover
 */
router.get('/discover', authenticateToken, async (req: Request, res: Response) => {
  try {
    const devices = await deviceOnboardingService.discoverDevices();

    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    logger.error('Error discovering devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover devices'
    });
  }
});

/**
 * Generate QR code data for pairing
 * GET /api/onboarding/qr-code/:code
 */
router.get('/qr-code/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const isValid = await deviceOnboardingService.verifyPairingCode(code);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired pairing code'
      });
    }

    const qrData = deviceOnboardingService.generateQRCodeData(code);

    res.json({
      success: true,
      qrData
    });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

/**
 * Get installation guide
 * GET /api/onboarding/installation-guide
 */
router.get('/installation-guide', async (req: Request, res: Response) => {
  try {
    const { os } = req.query;
    
    const guide = deviceOnboardingService.getInstallationGuide(os as string);

    res.json({
      success: true,
      guide
    });
  } catch (error) {
    logger.error('Error getting installation guide:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get installation guide'
    });
  }
});

/**
 * Revoke device access
 * POST /api/onboarding/revoke/:deviceId
 */
router.post('/revoke/:deviceId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    await deviceOnboardingService.revokeDevice(deviceId);

    logger.info('Device access revoked', { 
      deviceId,
      userId: (req as any).user?.id
    });

    res.json({
      success: true,
      message: 'Device access revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke device access'
    });
  }
});

export default router;
