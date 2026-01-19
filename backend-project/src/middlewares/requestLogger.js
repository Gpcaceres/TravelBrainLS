/**
 * Request Logger Middleware
 * Logs incoming requests for debugging and monitoring
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };
    
    const emoji = res.statusCode >= 500 ? '❌' : res.statusCode >= 400 ? '⚠️' : '✅';
    console.log(`${emoji} [${log.method}] ${log.url} - ${log.status} (${log.duration})`);
  });
  
  next();
};

module.exports = requestLogger;
