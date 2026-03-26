const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.joueur) {
    return res.status(401).json({
      message: "Authentification requise",
    });
  }

  next();
};

export { requireAuth };
