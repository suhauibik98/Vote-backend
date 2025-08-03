const mongoose = require("mongoose");

const voteMainSchema = new mongoose.Schema(
  {
    voteSubject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    // startDate: {
    //   type: Date,
    //   required: true,
    // },
    // endDate: {
    //   type: Date,
    //   required: true,
    // },
    // startTime: {
    //   type: String,
    //   required: true,
    //   match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    // },
    // endTime: {
    //   type: String,
    //   required: true,
    //   match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    // },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    candidates: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          minlength: 5,
          maxlength: 500,
        },
        votes: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        voteCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
voteMainSchema.index({ startDateTime: 1, endDateTime: 1 });
voteMainSchema.index({ isActive: 1 });

// Virtual to check if vote is currently active
voteMainSchema.virtual("currentlyActive").get(function () {
  const now = new Date();
  return this.startDateTime <= now && this.endDateTime > now;
});

// Pre-save middleware to update isActive status
voteMainSchema.pre("save", function (next) {
  const now = new Date();
  this.isActive = this.startDateTime <= now && this.endDateTime > now;
  next();
});

module.exports = mongoose.model("VoteMain", voteMainSchema);
