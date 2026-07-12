export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_SESSION',
          message: 'You must log in to access this resource.',
        },
      });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ACTION',
          message: 'Access denied: Insufficient privileges.',
        },
      });
    }

    next();
  };
};

export default authorizeRoles;
