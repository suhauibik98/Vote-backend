const Users = require("../models/Users");
const PendingUser = require("../models/PendingUser");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const {sendOTPEmail} = require("../services/emailService");
const { generateOTP } = require("../utils/generateOTP");

const signup = async (req, res) => {
  const { emp_id, birth_date, name, ref_Name, email } = req.body;

  const schema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    ref_Name: Joi.string().allow("").default("none"),
    emp_id: Joi.string()
      .length(6)
      .pattern(/^95[012]\d{3}$/)
      .required()
      .messages({
        "string.length": "Employee ID must be exactly 6 digits",
        "string.pattern.base":
          "Employee ID must start with 950, 951, or 952 followed by 3 digits",
        "any.required": "Employee ID is required",
      }),
    birth_date: Joi.date().required().max("now").min("1900-01-01").messages({
      "date.base": "Birth date must be a valid date",
      "date.max": "Birth date cannot be in the future",
      "date.min": "Birth date must be after 1900",
    }),
  });

  try {
    // Validate input
    await schema.validateAsync(req.body, { abortEarly: false });

    // Check in Users collection
    const existingUser = await Users.findOne({
      $or: [{ emp_id }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this Employee ID or Email already exists",
      });
    }

    // Check in PendingUser collection
    const existingPending = await PendingUser.findOne({
      $or: [{ emp_id }, { email }],
    });

    if (existingPending) {
      if (existingPending.status === "pending") {
        return res.status(400).json({
          message:
            "A signup request for this Employee ID or Email is already pending approval",
        });
      }

      if (existingPending.status === "rejected") {
        return res.status(400).json({
          message:
            "A signup request for this Employee ID or Email has been rejected",
        });
      }
    }

    // Create pending request
    const pendingUser = new PendingUser({
      name,
      ref_Name: ref_Name || "none",
      emp_id,
      birth_date,
      email,
      status: "pending",
    });

    await pendingUser.save();

    return res.status(201).json({
      message:
        "Signup request submitted successfully. Please wait for admin approval.",
      request: {
        id: pendingUser._id,
        emp_id: pendingUser.emp_id,
        birth_date: pendingUser.birth_date,
        status: pendingUser.status,
        submitted_at: pendingUser.createdAt,
      },
    });
  } catch (error) {
    console.error(error);

    if (error.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};


const signin = async (req, res) => {
  // const { emp_id, birth_date } = req.body;
  const { email, otp } = req.body;

  // const schema = Joi.object().keys({
  //   emp_id: Joi.string()
  //     .required()
  //     .length(6)
  //     .pattern(/^95[012]\d{3}$/)
  //     .messages({
  //       "string.length": "Employee ID must be exactly 6 digits",
  //       "string.pattern.base":
  //         "Employee ID must start with 951 followed by 3 digits",
  //     }),
  //   birth_date: Joi.date().required().max("now").min("1900-01-01").messages({
  //     "date.max": "Birth date cannot be in the future",
  //     "date.min": "Birth date must be after 1900",
  //   }),
  // });
  const schema = Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.email": "Invalid email address",
    }),
    otp: Joi.string().required().length(6).message({
      "string.length": "OTP must be exactly 6 digits",
    }),
  });

  try {
    // Validate input
    await schema.validateAsync(req.body);

    // Debug logging

    // Convert birth_date to proper format for comparison
    // const inputDate = new Date(birth_date);

    // Method 1: If birth_date is stored as Date object in DB
    // Compare dates by converting both to same format
    // const user = await Users.findOne({
    //   emp_id,
    //   $expr: {
    //     $eq: [
    //       { $dateToString: { format: "%Y-%m-%d", date: "$birth_date" } },
    //       inputDate.toISOString().split("T")[0],
    //     ],
    //   },
    // });
    // const PindingUser = await PendingUser.findOne({
    //   emp_id,
    //   $expr: {
    //     $eq: [
    //       { $dateToString: { format: "%Y-%m-%d", date: "$birth_date" } },
    //       inputDate.toISOString().split("T")[0],
    //     ],
    //   },
    // });

    const user = await Users.findOne({ email });
    const PindingUser = await PendingUser.findOne({ email });

    if (user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

   
    if (!user) {
      if (PindingUser) {
        return res.status(401).json({
          message: `You'r status ${PindingUser.status}`,
          success: false,
        });
      }
      return res.status(401).json({
        message: "Invalid Employee ID or Birth Date",
        success: false,
      });
    }
    if (!user.isActive) {
      console.log("User is not Active");
      return res.status(401).json({
        message: "User is not Active",
        success: false,
      });
    }
    

    // console.log("User found:", { id: user._id, emp_id: user.emp_id });

    // Generate JWT token with 10 minutes expiration
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        emp_id: user.emp_id,
        isVote: user.isVote,
        email: user.email,
        isAdmin: user.isAdmin,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      // { expiresIn: "10m" } // 10 minutes
      { expiresIn: "1d" } // 1day minutes
    );

    // Set secure cookie with 10 minutes expiration
    const cookieOptions = {
      // httpOnly: true, // that for test to can read token
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      // maxAge: 10 * 60 * 1000, // 10 minutes in milliseconds (10 * 60 * 1000)
      maxAge: 24 * 60 * 60 * 1000, // 1day in milliseconds (10 * 60 * 1000)
      path: "/",
    };

    user.lastLogin = new Date();
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.cookie("authToken", token, cookieOptions);

    // Send success response
    res.status(200).json({
      message: "Signin successful",
      success: true,
      user: {
        name: user.name,
        id: user._id,
        emp_id: user.emp_id,
        email: user.email,
        votedList: user.votedList,
      },
      token: token,
      // expiresIn: "10m", // Let frontend know about expiration
      expiresIn: "1d", // Let frontend know about expiration
      // expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Exact expiration time
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Exact expiration time
    });
  } catch (error) {
    console.error("Signin error:", error);

    // Handle Joi validation errors
    if (error.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        success: false,
        details: error.details.map((detail) => detail.message),
      });
    }

    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(500).json({
        message: "Token generation failed",
        success: false,
      });
    }

    // Handle database errors
    if (error.name === "MongoError" || error.name === "MongooseError") {
      return res.status(500).json({
        message: "Database error",
        success: false,
      });
    }

    // Generic error handler
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const checkUserValidation = async (req, res) => {
  const { emp_id, birth_date } = req.body;

  const schema = Joi.object().keys({
    emp_id: Joi.string()
      .required()
      .length(6)
      .pattern(/^95[012]\d{3}$/)
      .messages({
        "string.length": "Employee ID must be exactly 6 digits",
        "string.pattern.base":
          "Employee ID must start with 951 followed by 3 digits",
      }),
    birth_date: Joi.date().required().max("now").min("1900-01-01").messages({
      "date.max": "Birth date cannot be in the future",
      "date.min": "Birth date must be after 1900",
    }),
  });

  try {
    await schema.validateAsync(req.body);

    // Debug logging

    // Convert birth_date to proper format for comparison
    const inputDate = new Date(birth_date);

    // Method 1: If birth_date is stored as Date object in DB
    // Compare dates by converting both to same format
    const user = await Users.findOne({
      emp_id,
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$birth_date" } },
          inputDate.toISOString().split("T")[0],
        ],
      },
    });
    const PindingUser = await PendingUser.findOne({
      emp_id,
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$birth_date" } },
          inputDate.toISOString().split("T")[0],
        ],
      },
    });

    if (!user) {
      if (PindingUser) {
        return res.status(401).json({
          message: `You'r status ${PindingUser.status}`,
          success: false,
        });
      }
      return res.status(401).json({
        message: "Invalid Employee ID or Birth Date",
        success: false,
      });
    }
    if (!user.isActive) {
      console.log("User is not Active");
      return res.status(401).json({
        message: "User is not Active",
        success: false,
      });
    }
    

    res.status(200).json({ email: user.email, success: true });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Utility function to clear auth cookie (for logout)
const signout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      message: "Signout successful",
      success: true,
    });
  } catch (error) {
    console.error("Signout error:", error);
    res.status(500).json({
      message: "Signout failed",
      success: false,
    });
  }
};



const sendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await Users.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  // const otp = 111111;
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // valid for 10 mins

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();


  await sendOTPEmail(email, otp);
  res.json({ message: "OTP sent to email" });
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await Users.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.otp !== otp || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  user.otpExpiresAt = null;
  user.isActive = true; // Or mark as verified
  await user.save();

  res.json({ message: "OTP verified successfully" });
};

module.exports = {
  signup,
  signin,
  signout,
  sendOTP,
  verifyOTP,
  checkUserValidation,
};
