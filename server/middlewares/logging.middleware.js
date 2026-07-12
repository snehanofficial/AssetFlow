export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Redact passwords or secrets in console logs
    let bodyLog = '';
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      bodyLog = `| Body: ${JSON.stringify(sanitizedBody)}`;
    }

    console.log(
      `[API Request] ${method} ${originalUrl} ${statusCode} - ${duration}ms | IP: ${ip} ${bodyLog}`
    );
  });

  next();
};

export default loggerMiddleware;
