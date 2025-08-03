//import lib
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./.env" });
require("colors");
const mongoSanitize = require("express-mongo-sanitize");
const connectdb = require("./db/connectdb");
const app = express();
const PORT = process.env.PORT || 8000;
const cookieParser = require("cookie-parser");
const cron = require('node-cron');
const { checkAndUpdateVoteStatusBulk} = require("./utils/checkAndUpdateVoteStatus")
const rateLimit = require("express-rate-limit");

//start server
app.use(express.json());
app.use(
  cors({
   origin: process.env.FR_URL,
  methods: ["GET", "POST", "PUT", "DELETE" , "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
})
);
app.set('trust proxy', 1);

app.use(cookieParser());
// app.use(mongoSanitize({ replaceWith: "_", allowDots: false }));

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    status: 429,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

// Apply to **all requests**
app.use(globalLimiter);


const authRouter = require("./routes/authRouters");
app.use("/api/auth", authRouter);

const adminRouter = require("./routes/adminRoutes");
app.use("/api/admin", adminRouter);

const userRouter = require("./routes/userRoutes");
app.use("/api/user", userRouter);


cron.schedule('* * * * *', async () => {
  try{
  console.log('Checking vote statuses...');
  await checkAndUpdateVoteStatusBulk();
  }
  catch(err){
    console.error(err);
    }
});

app.listen(PORT, async () => {
  try {
    console.log(`Server is running on port ${PORT}`.bgMagenta.bold);
    await connectdb();
  } catch (error) {
    console.log(error);
  }
});
