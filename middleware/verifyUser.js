const Users = require("../models/Users.js");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res, next) => {
  try {
    console.log("🔍 verifyUser middleware - checking auth..."); // ✅ Add debug logging
    console.log("🔍 Headers:", req.headers); // ✅ See all headers
    console.log("🔍 Cookies:", req.cookies); // ✅ See all cookies
    
    // Check both cookies and Authorization header
    let accessToken = req.cookies.authToken;
    
    // If no token in cookies, check Authorization header
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      console.log("🔍 Authorization header:", authHeader); // ✅ Debug log
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7); // Remove "Bearer " prefix
        console.log("🔍 Token extracted from header:", accessToken ? 'EXISTS' : 'NULL'); // ✅ Debug log
      }
    } else {
      console.log("🔍 Token found in cookies:", accessToken ? 'EXISTS' : 'NULL'); // ✅ Debug log
    }

    if (!accessToken) {
      console.log("❌ No token found in cookies or Authorization header");
      return res.status(401).json({ message: "Not Authorized" });
    }

    console.log("🔍 JWT_SECRET exists:", !!process.env.JWT_SECRET); // ✅ Verify JWT secret

    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.error("❌ JWT verification error:", err.message); // ✅ Debug log
        return res.status(403).json({ message: "Access Forbidden" });
      }

      console.log("✅ JWT verified successfully, decoded token:", {
        id: decodedToken.id,
        email: decodedToken.email,
        isAdmin: decodedToken.isAdmin
      }); // ✅ Debug log

      const user = await Users.findById(decodedToken.id);
      if (!user) {
        console.log("❌ User not found in database for ID:", decodedToken.id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ User access granted for:", user.email);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { verifyUser };