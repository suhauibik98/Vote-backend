const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email:{
      type:String,
      required:true,
      unique:true
    },
    ref_Name: {
      type: String,
      default: null, // or '', if you prefer empty string
    },
    emp_id: {
      type: String,
      unique: true,
      required: true,
    },
    birth_date: {
      type: Date,
      required: true,
    },
    isVote: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    votedList: [
      {
        voteMainId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "VoteMain",
        },
        voteTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // assuming voteTo refers to candidate.userId
        },
        voteDate: {
          type: Date,
          default: Date.now,
        },
        candidateDescription: {
          type: String,
          default: "",
        },
      },
    ],
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

const Users = mongoose.model("User", userSchema);
module.exports = Users;
