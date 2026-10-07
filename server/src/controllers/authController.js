import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/db.js';
import emailService from '../services/emailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function register(req, res, next) {
  try {
    const { name, email, password, upiId, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    // Hash password with bcrypt (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        upiId: upiId && upiId.trim() ? upiId.trim() : null,
        phone: phone && phone.trim() ? phone.trim() : null
      },
      select: { id: true, name: true, email: true, avatar: true, upiId: true, phone: true, createdAt: true }
    });

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
      console.warn('Welcome email error:', err.message);
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'super_secret_jwt_key_split_app_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'super_secret_jwt_key_split_app_2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          upiId: user.upiId,
          phone: user.phone
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Google Sign-In handler: verifies Google ID token, upserts user, triggers welcome email
 */
export async function googleAuth(req, res, next) {
  try {
    const { credential, upiId } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    let payload;

    // Verify token with Google
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Fallback decoder
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        payload = JSON.parse(jsonPayload);
      }
    } catch (verifyErr) {
      return res.status(401).json({ success: false, message: 'Invalid Google authentication token.' });
    }

    const { email, name, picture } = payload;
    const cleanEmail = email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const salt = await bcrypt.genSalt(10);
      const randomSecret = Math.random().toString(36) + Date.now().toString(36);
      const passwordHash = await bcrypt.hash(randomSecret, salt);

      user = await prisma.user.create({
        data: {
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          passwordHash,
          avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
          upiId: upiId && upiId.trim() ? upiId.trim() : null
        }
      });

      emailService.sendWelcomeEmail(user.email, user.name).catch(console.warn);
    } else {
      if (picture && !user.avatar) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: picture }
        });
        user.avatar = picture;
      }
      if (upiId && !user.upiId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { upiId: upiId.trim() }
        });
        user.upiId = upiId.trim();
      }
    }

    // Sign sPLIT JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'super_secret_jwt_key_split_app_2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          upiId: user.upiId,
          phone: user.phone
        },
        token,
        isNewUser
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, upiId, phone } = req.body;
    const userId = req.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(upiId !== undefined && { upiId: upiId ? upiId.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null })
      },
      select: { id: true, name: true, email: true, avatar: true, upiId: true, phone: true }
    });

    res.json({
      success: true,
      data: { user: updated }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: { user: req.user }
  });
}
