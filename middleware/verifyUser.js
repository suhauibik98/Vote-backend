const Users = require("../models/Users.js");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res, next) => {
  try {
    const accessToken = req.cookies.authToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ message: "Access Forbidden" });
      }

      const user = await Users.findById(decodedToken.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { verifyUser };
