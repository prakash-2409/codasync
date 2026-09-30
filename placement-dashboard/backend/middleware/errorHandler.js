/**
 * Global centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    path: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
