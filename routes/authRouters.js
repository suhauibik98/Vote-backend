const express = require("express")
const router = express.Router()
const { signup,checkUserValidation,verifyOTP, sendOTP,signin, signout } = require("../controllers/authControllers")
const {verifyUser} = require("../middleware/verifyUser")
// api for auth users
router.post("/signup" , signup )

router.post("/signin" , signin )

router.post("/check-user-validation" , checkUserValidation )

router.post("/send-otp" , sendOTP )

router.post("/signin" , verifyOTP )

router.post("/signout" ,verifyUser,  signout )





module.exports = router