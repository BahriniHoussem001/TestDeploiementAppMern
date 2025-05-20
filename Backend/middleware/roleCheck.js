module.exports = function(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Convert string to array if only one role is provided
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user role is included in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé - Vous n\'avez pas les droits nécessaires' });
    }

    next();
  };
};
