const nodemailer = require("nodemailer");
const User = require("../models/Users");
const sendOTPEmail = async (email, otp) => {
 
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password only
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    logger: true,
    debug: true,
  });

  const mailOptions = {
    from: `"Vote Portal" <sohayb.akour10@gmail.com>`,
    to: email,
    subject: "🔐 Your OTP Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Verification Code</h1>
        </div>
        
        <div style="background: white; padding: 30px; margin-top: -10px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #374151; margin-top: 0;">Your OTP Code</h2>
          <p style="color: #6b7280; font-size: 16px;">Please use the following verification code to complete your login:</p>
          
          <div style="background: #f3f4f6; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            ⏰ This code will expire in 5 minutes.<br>
            🔒 For security reasons, never share this code with anyone.<br>
            ❓ If you didn't request this code, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2025 Employee Portal. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Your OTP verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nFor security reasons, never share this code with anyone.\n\nIf you didn't request this code, please ignore this email.\n\n© 2025 Employee Portal`,
  };

  try {
    console.log("🔄 Testing SMTP connection...");

    // Test connection first
    await transporter.verify();
    console.log("✅ SMTP server is ready to take our messages");

    // Send the email
    console.log("📧 Sending email...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📨 Response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      message: "OTP email sent successfully",
    };
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      command: error.command,
    });

    // More specific error handling
    let errorMessage = "Failed to send OTP email";

    if (error.code === "ESOCKET" || error.code === "ETIMEDOUT") {
      errorMessage =
        "Network connection timeout. This might be due to:\n" +
        "1. Firewall blocking SMTP ports\n" +
        "2. Corporate network restrictions\n" +
        "3. Antivirus blocking connections\n" +
        "4. ISP blocking SMTP ports";
    } else if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Please check your app password.";
    } else if (error.responseCode === 535) {
      errorMessage =
        "Invalid credentials. Make sure you're using the app password, not your regular Gmail password.";
    }

    throw new Error(errorMessage);
  }
};

const formatDateTime = (dateTime) => {
  const date = new Date(dateTime);
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { dateStr, timeStr };
};
const sendCreateVoteEmailIfValidWindow = async (
  voteSubject,
  startDate,
  endDate
) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const threeHoursBeforeStart = new Date(start.getTime() - 3 * 60 * 60 * 1000);

  // ✅ Check: Is now within [start - 3h, end]?
  if (now < threeHoursBeforeStart || now > end) {
    console.log("⏰ Not within the valid time window for sending vote emails.");
    return {
      success: false,
      message: "Not within time window to send vote emails.",
    };
  }

  // ✅ Get all user emails
  const users = await User.find({}, "email");
  const emailList = users.map((u) => u.email);

  // ✅ Mail transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  const formattedStart = formatDateTime(start);
  const formattedEnd = formatDateTime(end);

  const htmlTemplate = (toEmail) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🗳️ New Vote Available</h1>
      </div>
      
      <div style="background: white; padding: 30px; margin-top: -10px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #374151; margin-top: 0;">Vote Subject: <span style="color: #4f46e5;">${voteSubject}</span></h2>
        <p style="color: #6b7280; font-size: 16px;">A new voting session has been created.</p>
        <ul style="color: #374151; font-size: 15px;">
          <li><strong>Date:</strong> ${formattedStart.dateStr} to ${formattedEnd.dateStr}</li>
          <li><strong>Start Time:</strong> ${formattedStart.timeStr}</li>
          <li><strong>End Time:</strong> ${formattedEnd.timeStr}</li>
        </ul>
        <p style="color: #6b7280; font-size: 14px;">Make sure to participate before the deadline!</p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>📧 Sent to: ${toEmail}</p>
        <p>© 2025 Vote Portal. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready");

    for (const email of emailList) {
      const mailOptions = {
        from: "Vote Portal",
        to: email,
        subject: "🗳️ New Vote Session Created",
        html: htmlTemplate(email),
        text: `A new vote session has been created.

Subject: ${voteSubject}
Date: ${formattedStart.dateStr} to ${formattedEnd.dateStr}
Start Time: ${formattedStart.timeStr}
End Time: ${formattedEnd.timeStr}

Please participate before the deadline.`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${email}: ${info.messageId}`);
    }

    return {
      success: true,
      message: `Emails sent to ${emailList.length} users.`,
    };
  } catch (error) {
    console.error("❌ Error sending emails:", error);
    throw new Error("Failed to send vote emails.");
  }
};

module.exports = { sendOTPEmail, sendCreateVoteEmailIfValidWindow };
