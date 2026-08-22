import mongoose from "mongoose";

const urlSchema = mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Url = mongoose.model("Url", urlSchema);
export default Url;
