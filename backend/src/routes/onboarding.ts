import { Hono } from 'hono';
import { z } from 'zod';
import { deviceOnboardingService } from '../services/deviceOnboardingService';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = new Hono();

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
router.post('/pairing-code', authMiddleware, async (c) => {
  try {
    const { code, expiresAt } = deviceOnboardingService.generatePairingCode();
    
    const auth = c.get('auth');
    logger.info('Pairing code generated', { 
      userId: auth?.userId,
      expiresAt 
    });

    return c.json({
      success: true,
      code,
      expiresAt,
      validFor: '15 minutes'
    });
  } catch (error) {
    logger.error('Error generating pairing code:', error);
    return c.json({
      success: false,
      error: 'Failed to generate pairing code'
    }, 500);
  }
});

/**
 * Register a new device
 * POST /api/onboarding/register
 */
router.post('/register', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const validation = registerDeviceSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      }, 400);
    }

    const auth = c.get('auth');
    const userId = auth?.userId;
    if (!userId) {
      return c.json({
        success: false,
        error: 'User not authenticated'
      }, 401);
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

    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error registering device:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to register device'
    }, 400);
  }
});

/**
 * Verify device with API key
 * POST /api/onboarding/verify
 */
router.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const validation = verifyDeviceSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'Invalid API key format'
      }, 400);
    }

    const result = await deviceOnboardingService.verifyDevice(validation.data.apiKey);

    logger.info('Device verified', { nodeId: result.nodeId });

    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error verifying device:', error);
    return c.json({
      success: false,
      error: error.message || 'Device verification failed'
    }, 401);
  }
});

/**
 * Join device to mesh network
 * POST /api/onboarding/join-mesh
 */
router.post('/join-mesh', async (c) => {
  try {
    const body = await c.req.json();
    const validation = joinMeshSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      }, 400);
    }

    const result = await deviceOnboardingService.joinMesh(
      validation.data.nodeId,
      validation.data.capabilities
    );

    logger.info('Device joined mesh', { 
      nodeId: validation.data.nodeId,
      role: result.role
    });

    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error joining mesh:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to join mesh'
    }, 400);
  }
});

/**
 * Discover devices on network
 * GET /api/onboarding/discover
 */
router.get('/discover', authMiddleware, async (c) => {
  try {
    const devices = await deviceOnboardingService.discoverDevices();

    return c.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    logger.error('Error discovering devices:', error);
    return c.json({
      success: false,
      error: 'Failed to discover devices'
    }, 500);
  }
});

/**
 * Generate QR code data for pairing
 * GET /api/onboarding/qr-code/:code
 */
router.get('/qr-code/:code', async (c) => {
  try {
    const code = c.req.param('code');
    
    const isValid = await deviceOnboardingService.verifyPairingCode(code);
    
    if (!isValid) {
      return c.json({
        success: false,
        error: 'Invalid or expired pairing code'
      }, 400);
    }

    const qrData = deviceOnboardingService.generateQRCodeData(code);

    return c.json({
      success: true,
      qrData
    });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    return c.json({
      success: false,
      error: 'Failed to generate QR code'
    }, 500);
  }
});

/**
 * Get installation guide
 * GET /api/onboarding/installation-guide
 */
router.get('/installation-guide', async (c) => {
  try {
    const os = c.req.query('os');
    
    const guide = deviceOnboardingService.getInstallationGuide(os);

    return c.json({
      success: true,
      guide
    });
  } catch (error) {
    logger.error('Error getting installation guide:', error);
    return c.json({
      success: false,
      error: 'Failed to get installation guide'
    }, 500);
  }
});

/**
 * Revoke device access
 * POST /api/onboarding/revoke/:deviceId
 */
router.post('/revoke/:deviceId', authMiddleware, async (c) => {
  try {
    const deviceId = c.req.param('deviceId');
    
    await deviceOnboardingService.revokeDevice(deviceId);

    const auth = c.get('auth');
    logger.info('Device access revoked', { 
      deviceId,
      userId: auth?.userId
    });

    return c.json({
      success: true,
      message: 'Device access revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking device:', error);
    return c.json({
      success: false,
      error: 'Failed to revoke device access'
    }, 500);
  }
});

export default router;
