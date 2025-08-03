const Users = require("../models/Users.js");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res, next) => {
  try {

    
    // Check both cookies and Authorization header
    let accessToken = req.cookies.authToken;
    
    // If no token in cookies, check Authorization header
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7); // Remove "Bearer " prefix
      }
    } else {
      console.log("🔍 Token found in cookies:", accessToken ? 'EXISTS' : 'NULL'); // ✅ Debug log
    }

    if (!accessToken) {
      console.log("❌ No token found in cookies or Authorization header");
      return res.status(401).json({ message: "Not Authorized" });
    }


    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.error("❌ JWT verification error:", err.message); // ✅ Debug log
        return res.status(403).json({ message: "Access Forbidden" });
      }


      const user = await Users.findById(decodedToken.id);
      if (!user) {
        console.log("❌ User not found in database for ID:", decodedToken.id);
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { verifyUser };