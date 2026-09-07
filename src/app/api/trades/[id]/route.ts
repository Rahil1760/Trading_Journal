import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Trade } from "@/models/Trade";
import { calculatePnl, TradeDirection } from "@/lib/calculations";
import { deleteLocalFile } from "@/lib/storage";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/trades/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid trade ID format" }, { status: 400 });
    }

    await connectToDatabase();

    const trade = await Trade.findOne({
      _id: id,
      userId: session.userId,
    }).lean();

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ trade });
  } catch (error: any) {
    console.error("GET /api/trades/:id error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trade" },
      { status: 500 }
    );
  }
}

// PATCH /api/trades/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid trade ID format" }, { status: 400 });
    }

    await connectToDatabase();

    const existingTrade = await Trade.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const body = await request.json();

    const entryPrice = body.entryPrice !== undefined ? Number(body.entryPrice) : existingTrade.entryPrice;
    const exitPrice = body.exitPrice !== undefined ? Number(body.exitPrice) : existingTrade.exitPrice;
    const quantity = body.quantity !== undefined ? Number(body.quantity) : existingTrade.quantity;
    const direction = (body.direction || existingTrade.direction) as TradeDirection;

    if (entryPrice <= 0 || exitPrice <= 0 || quantity <= 0) {
      return NextResponse.json(
        { error: "Entry price, exit price, and quantity must be positive numbers" },
        { status: 400 }
      );
    }

    if (direction !== "long" && direction !== "short") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    // Recalculate P&L on the server
    const { pnlPercent, pnlAmount } = calculatePnl(entryPrice, exitPrice, quantity, direction);

    // If screenshots changed, remove old ones
    if (body.entryScreenshotUrl && body.entryScreenshotUrl !== existingTrade.entryScreenshotUrl) {
      await deleteLocalFile(existingTrade.entryScreenshotUrl);
      existingTrade.entryScreenshotUrl = body.entryScreenshotUrl;
    }

    if (body.exitScreenshotUrl && body.exitScreenshotUrl !== existingTrade.exitScreenshotUrl) {
      await deleteLocalFile(existingTrade.exitScreenshotUrl);
      existingTrade.exitScreenshotUrl = body.exitScreenshotUrl;
    }

    if (body.symbol) existingTrade.symbol = body.symbol.trim().toUpperCase();
    if (body.logic) existingTrade.logic = body.logic.trim();
    if (body.tradeDate) existingTrade.tradeDate = new Date(body.tradeDate);

    existingTrade.entryPrice = entryPrice;
    existingTrade.exitPrice = exitPrice;
    existingTrade.quantity = quantity;
    existingTrade.direction = direction;
    existingTrade.pnlPercent = pnlPercent;
    existingTrade.pnlAmount = pnlAmount;

    await existingTrade.save();

    return NextResponse.json({
      success: true,
      trade: existingTrade,
    });
  } catch (error: any) {
    console.error("PATCH /api/trades/:id error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update trade" },
      { status: 500 }
    );
  }
}

// DELETE /api/trades/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid trade ID format" }, { status: 400 });
    }

    await connectToDatabase();

    const trade = await Trade.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Delete associated screenshot files from local disk
    await Promise.allSettled([
      deleteLocalFile(trade.entryScreenshotUrl),
      deleteLocalFile(trade.exitScreenshotUrl),
    ]);

    return NextResponse.json({
      success: true,
      message: "Trade and associated screenshots successfully deleted",
    });
  } catch (error: any) {
    console.error("DELETE /api/trades/:id error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete trade" },
      { status: 500 }
    );
  }
}
