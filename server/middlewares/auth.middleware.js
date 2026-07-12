import jwt from 'jsonwebtoken';
import environment from '../config/environment.js';

export const authenticateSession = (req, res, next) => {
  let token = null;

  // Extract from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Extract from Cookies
  else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_SESSION',
        message: 'Authentication token is missing. Please log in.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, environment.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role, departmentId }
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired.',
      },
    });
  }
};

export default authenticateSession;
