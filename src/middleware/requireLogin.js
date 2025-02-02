
const requireLogin = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.redirect("/admin");
    }
    next();
};

module.exports = requireLogin;
