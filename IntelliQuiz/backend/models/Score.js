import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: Number,
    total: Number,
    percentage: Number
  },
  { timestamps: true }
);

export default mongoose.model("Score", scoreSchema);
