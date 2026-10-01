const { verifyToken, clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

/**
 * Clerk JWT Authentication Middleware
 * Verifies the Bearer JWT token issued by Clerk and automatically provisions
 * a MongoDB User record for first-time sign-ins.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const secretKey = process.env.CLERK_SECRET_KEY;
      // In local dev without live Clerk credentials, allow graceful dev fallback
      if (!secretKey || secretKey.includes('placeholder')) {
        let user = await User.findOne();
        if (!user) {
          user = await User.findOrCreateByClerk({
            clerkId: 'dev_mock_clerk_student',
            email: 'student.dev@stjosephs.ac.in',
            name: 'Prakash R'
          });
        }
        req.auth = { userId: user.clerkId || 'dev_mock_clerk_student' };
        req.user = user;
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Authentication required: Missing or invalid Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: Token missing from Bearer header.'
      });
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    let clerkUserId = null;
    let tokenPayload = null;

    // Verify token using Clerk SDK
    if (secretKey && !secretKey.includes('placeholder')) {
      try {
        tokenPayload = await verifyToken(token, {
          secretKey
        });
        clerkUserId = tokenPayload.sub;
      } catch (jwtErr) {
        console.warn('[Clerk Auth Warning] Token verification failed:', jwtErr.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token.'
        });
      }
    } else {
      // In local dev without live Clerk credentials, allow test/mock token
      clerkUserId = token.startsWith('user_') ? token : 'mock_clerk_student_1';
      console.log(`[Clerk Auth Dev] Running in development mode with user: ${clerkUserId}`);
    }

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unable to extract Clerk User ID from credentials.'
      });
    }

    let email = `${clerkUserId}@stjosephs.ac.in`;
    let name = 'St. Joseph Student';
    let avatarUrl = '';

    // Fetch real profile from Clerk SDK if secret key is configured
    if (secretKey && !secretKey.includes('placeholder')) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        if (clerkUser) {
          const primaryEmailObj = clerkUser.emailAddresses?.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
          ) || clerkUser.emailAddresses?.[0];

          email = primaryEmailObj?.emailAddress || email;
          name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || name;
          avatarUrl = clerkUser.imageUrl || '';
        }
      } catch (fetchErr) {
        console.warn('[Clerk Profile Fetch] Notice:', fetchErr.message);
      }
    }

    // Automatically find or onboard user via User schema logic
    const user = await User.findOrCreateByClerk({
      clerkId: clerkUserId,
      email,
      name,
      avatarUrl
    });

    // Attach authenticated user and claims to request
    req.auth = { userId: clerkUserId, ...(tokenPayload || {}) };
    req.user = user;

    next();
  } catch (error) {
    console.error('[RequireAuth Middleware Error]:', error);
    next(error);
  }
};

module.exports = {
  requireAuth
};
