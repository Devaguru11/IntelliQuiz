import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    score: Number,
    total: Number,
    percentage: Number,

    // ✅ NEW (for analytics)
    topic: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Score", scoreSchema);
