import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrade extends Document {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  direction: "long" | "short";
  pnlPercent: number;
  pnlAmount: number;
  entryScreenshotUrl: string;
  exitScreenshotUrl: string;
  logic: string;
  tradeDate: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
  {
    symbol: {
      type: String,
      required: [true, "Symbol is required"],
      uppercase: true,
      trim: true,
    },
    entryPrice: {
      type: Number,
      required: [true, "Entry price is required"],
      min: [0.000001, "Entry price must be greater than 0"],
    },
    exitPrice: {
      type: Number,
      required: [true, "Exit price is required"],
      min: [0.000001, "Exit price must be greater than 0"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.000001, "Quantity must be greater than 0"],
      default: 1,
    },
    direction: {
      type: String,
      enum: {
        values: ["long", "short"],
        message: "Direction must be either 'long' or 'short'",
      },
      required: [true, "Direction is required"],
      default: "long",
    },
    pnlPercent: {
      type: Number,
      required: [true, "P&L percentage is required"],
    },
    pnlAmount: {
      type: Number,
      required: [true, "P&L amount is required"],
      default: 0,
    },
    entryScreenshotUrl: {
      type: String,
      required: [true, "Entry screenshot is required"],
      trim: true,
    },
    exitScreenshotUrl: {
      type: String,
      required: [true, "Exit screenshot is required"],
      trim: true,
    },
    logic: {
      type: String,
      required: [true, "Trade logic/notes are required"],
      maxlength: [2000, "Trade logic cannot exceed 2000 characters"],
      trim: true,
    },
    tradeDate: {
      type: Date,
      required: [true, "Trade date is required"],
      default: Date.now,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient user queries sorted by date
TradeSchema.index({ userId: 1, tradeDate: -1 });

// Avoid model recompilation in Next.js hot-reloading
export const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>("Trade", TradeSchema);
