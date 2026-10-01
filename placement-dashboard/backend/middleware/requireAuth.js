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

    // Lookup user in MongoDB by Clerk ID
    let user = await User.findOne({ clerkId: clerkUserId });

    // Automatic onboarding on first sign-in
    if (!user) {
      let email = `${clerkUserId}@stjosephs.ac.in`;
      let name = 'St. Joseph Student';
      let avatarUrl = '';

      // Try fetching real user profile from Clerk API if secret key is active
      if (secretKey && !secretKey.includes('placeholder')) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          if (clerkUser) {
            email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
            name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || name;
            avatarUrl = clerkUser.imageUrl || '';
          }
        } catch (fetchErr) {
          console.warn('[Clerk Profile Fetch] Notice:', fetchErr.message);
        }
      }

      // Check if user exists by email (e.g., pre-seeded account)
      user = await User.findOne({ email });

      if (user) {
        // Link existing pre-seeded record to Clerk ID
        user.clerkId = clerkUserId;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
        console.log(`[Clerk Auth] Linked existing MongoDB record to Clerk ID: ${user.email}`);
      } else {
        // Create new student document
        user = await User.create({
          clerkId: clerkUserId,
          email,
          name,
          avatarUrl,
          activityStreak: 1,
          lastActiveDate: new Date(),
          targetTier: '10+LPA'
        });
        console.log(`[Clerk Auth] Auto-provisioned new MongoDB student document: ${user.email} (${clerkUserId})`);
      }
    }

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
