const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        res.status(401).json({
            message: "Token not provided"
        });
    }

    const token = authHeader.replace("Bearer ", "");
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        if (decoded.type !== "access") {
            res.status(401).json({
                message: "Invalid token!"
            });
            return;
        } else {
            req.user = decoded;
            next();
        }
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            res.status(400).json({
                message: "Token expired!"
            });
            return;
        } else if (e instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                message: "Invalid token!"
            });
            return;
        }
    }
};
