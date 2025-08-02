// models/PendingUser.js
const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema(
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
      required: true,
      length: 6,
    },
    birth_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    admin_notes: {
      type: String,
      default: "",
    },
    approved_by: {
      type: String, // Admin who approved/rejected
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("PendingUser", pendingUserSchema);
