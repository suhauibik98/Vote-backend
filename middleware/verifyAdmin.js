// const Users = require("../models/Users.js");
// const jwt = require("jsonwebtoken");

// const verifyAdmin = async (req, res, next) => {
//   try {
//     const accessToken = req.cookies.authToken;

//     if (!accessToken) {
//       return res.status(401).json({ message: "Not Authorized" });
//     }

//     jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decodedToken) => {
//       if (err) {
//         return res.status(403).json({ message: "Access Forbidden" });
//       }

//       const user = await Users.findById(decodedToken.id);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//      if(!user.isAdmin){
//         return res.status(403).json({ message: "Access Forbidden" });
//      }
//       req.user = user;
//       next();
//     });
//   } catch (error) {
//     console.error("Auth middleware error:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// module.exports = { verifyAdmin };
const Users = require("../models/Users.js");
const jwt = require("jsonwebtoken");

const verifyAdmin = async (req, res, next) => {
  try {
    console.log("🔍 verifyAdmin middleware - checking auth..."); // ✅ Add debug logging
    
    // Check both cookies and Authorization header
    let accessToken = req.cookies.authToken;
    
    // If no token in cookies, check Authorization header
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      console.log("🔍 Authorization header:", authHeader); // ✅ Debug log
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7); // Remove "Bearer " prefix
        console.log("🔍 Token from header:", accessToken ? 'EXISTS' : 'NULL'); // ✅ Debug log
      }
    } else {
      console.log("🔍 Token from cookies:", accessToken ? 'EXISTS' : 'NULL'); // ✅ Debug log
    }

    if (!accessToken) {
      console.log("❌ No token found in cookies or header"); // ✅ Debug log
      return res.status(401).json({ message: "Not Authorized" });
    }

    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.error("❌ JWT verification error:", err); // ✅ Debug log
        return res.status(403).json({ message: "Access Forbidden" });
      }

      console.log("✅ JWT verified, decoded token:", decodedToken); // ✅ Debug log

      const user = await Users.findById(decodedToken.id);
      if (!user) {
        console.log("❌ User not found for ID:", decodedToken.id); // ✅ Debug log
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isAdmin) {
        console.log("❌ User is not admin:", user.email); // ✅ Debug log
        return res.status(403).json({ message: "Access Forbidden - Not Admin" });
      }
      
      console.log("✅ Admin access granted for:", user.email); // ✅ Debug log
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { verifyAdmin };