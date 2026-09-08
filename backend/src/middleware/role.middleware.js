export function requireRecruiter(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'recruiter') {
    res.status(403).json({
      error: 'Access denied. Only recruiters can perform this action.'
    });
    return;
  }

  next();
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}
