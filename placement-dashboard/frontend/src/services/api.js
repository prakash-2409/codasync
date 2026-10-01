import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic Clerk token resolver
let clerkTokenGetter = null;

/**
 * Configure dynamic JWT token retriever from Clerk useAuth()
 * @param {Function} getterFn Function returning Promise<string | null>
 */
export const setAuthTokenGetter = (getterFn) => {
  clerkTokenGetter = getterFn;
};

// Request interceptor to attach Clerk JWT token automatically
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (clerkTokenGetter && typeof clerkTokenGetter === 'function') {
        const token = await clerkTokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.warn('[API Auth Interceptor] Warning: Could not resolve Clerk session token:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for streamlined data extraction and error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('[API Error]:', message);
    return Promise.reject(new Error(message));
  }
);

export const api = {
  /**
   * Healthcheck endpoint
   */
  getHealth: () => apiClient.get('/health'),

  /**
   * Fetch authenticated user profile including streak, target tier, and registration info
   */
  getUserProfile: () => apiClient.get('/users/profile'),

  /**
   * Fetch 90-day consistency heatmap data for the authenticated student
   */
  getUserHeatmap: () => apiClient.get('/users/heatmap'),

  /**
   * Update student target placement tier ('5LPA' | '10LPA' | '10+LPA' | '>10LPA')
   */
  updateTargetTier: (targetTier) => apiClient.put('/users/tier', { targetTier }),

  /**
   * Fetch all upcoming and active placement contests/assessments
   * Optional params: { category, platform }
   */
  getContests: (params = {}) => apiClient.get('/contests', { params }),

  /**
   * Single-Threaded Recommendation Engine: Get the Single "Next-Best-Action"
   * Isolates the highest leverage action for the student
   */
  getNextBestAction: (tier) => apiClient.get('/contests/next-best-action', { params: tier ? { tier } : {} }),

  /**
   * Ingest a custom/private assessment (Skillrack, TCS NQT, etc.)
   */
  injectCustomContest: (contestData, adminKey) =>
    apiClient.post('/contests/custom', contestData, {
      headers: adminKey ? { 'x-admin-key': adminKey } : {},
    }),

  /**
   * Generate wrapped tracking URL for smart engagement logging
   */
  getSmartRedirectUrl: (targetUrl, contestId, userId = 'default-student') => {
    const encodedTarget = encodeURIComponent(targetUrl);
    const query = new URLSearchParams({
      targetUrl: encodedTarget,
      ...(contestId && { contestId }),
      ...(userId && { userId }),
    });
    return `${API_BASE_URL}/redirect?${query.toString()}`;
  },

  /**
   * Direct programmatic trigger for smart redirect navigation
   */
  navigateViaSmartRedirect: (targetUrl, contestId, userId) => {
    const redirectUrl = api.getSmartRedirectUrl(targetUrl, contestId, userId);
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  },
};

export default api;
