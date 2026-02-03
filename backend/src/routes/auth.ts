import { Hono } from 'hono';
import { db, isDatabaseAvailable } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { registerSchema, loginSchema } from '../utils/validation';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth';
import { strictRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const authRouter = new Hono();

// Register new user
authRouter.post('/register', strictRateLimit, async (c) => {
  if (!isDatabaseAvailable()) {
    return c.json({ error: 'Database not available' }, 503);
  }

  const body = await c.req.json();
  const validation = registerSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const { username, email, password } = validation.data;

  try {
    // Check if user already exists
    const existingUser = await db!
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    const existingEmail = await db!
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db!
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
        role: 'user',
      })
      .returning();

    logger.info(`User registered: ${username}`);

    return c.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    }, 201);
  } catch (error) {
    logger.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
authRouter.post('/login', strictRateLimit, async (c) => {
  if (!isDatabaseAvailable()) {
    return c.json({ error: 'Database not available' }, 503);
  }

  const body = await c.req.json();
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const { username, password } = validation.data;

  try {
    // Find user
    const [user] = await db!
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (!user.isActive) {
      return c.json({ error: 'Account is disabled' }, 403);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    await db!.insert(sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent,
    });

    // Update last login
    await db!
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    logger.info(`User logged in: ${username}`);

    return c.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Refresh access token
authRouter.post('/refresh', async (c) => {
  if (!isDatabaseAvailable()) {
    return c.json({ error: 'Database not available' }, 503);
  }

  const body = await c.req.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists
    const [session] = await db!
      .select()
      .from(sessions)
      .where(eq(sessions.refreshToken, refreshToken))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    });

    return c.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 401);
  }
});

// Logout
authRouter.post('/logout', async (c) => {
  if (!isDatabaseAvailable()) {
    return c.json({ message: 'Logged out (database not available)' });
  }

  const body = await c.req.json();
  const { refreshToken } = body;

  if (refreshToken) {
    try {
      await db!.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  return c.json({ message: 'Logged out successfully' });
});

export default authRouter;
