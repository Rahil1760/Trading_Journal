import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Trade } from "@/models/Trade";
import { calculatePnl, TradeDirection } from "@/lib/calculations";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/trades - List trades with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const symbol = searchParams.get("symbol");
    const direction = searchParams.get("direction");

    const query: Record<string, any> = {
      userId: session.userId,
    };

    if (symbol) {
      query.symbol = { $regex: symbol.trim(), $options: "i" };
    }

    if (direction === "long" || direction === "short") {
      query.direction = direction;
    }

    const [trades, totalCount] = await Promise.all([
      Trade.find(query)
        .sort({ tradeDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Trade.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      trades,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

// POST /api/trades - Create a new trade with server-recomputed P&L
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      entryPrice,
      exitPrice,
      quantity,
      direction,
      entryScreenshotUrl,
      exitScreenshotUrl,
      logic,
      tradeDate,
    } = body;

    // Strict validation
    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const numEntry = Number(entryPrice);
    const numExit = Number(exitPrice);
    const numQty = Number(quantity);

    if (isNaN(numEntry) || numEntry <= 0) {
      return NextResponse.json({ error: "Entry price must be a number > 0" }, { status: 400 });
    }

    if (isNaN(numExit) || numExit <= 0) {
      return NextResponse.json({ error: "Exit price must be a number > 0" }, { status: 400 });
    }

    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ error: "Quantity must be a number > 0" }, { status: 400 });
    }

    if (direction !== "long" && direction !== "short") {
      return NextResponse.json({ error: "Direction must be 'long' or 'short'" }, { status: 400 });
    }

    if (!entryScreenshotUrl || typeof entryScreenshotUrl !== "string") {
      return NextResponse.json({ error: "Entry screenshot is required" }, { status: 400 });
    }

    if (!exitScreenshotUrl || typeof exitScreenshotUrl !== "string") {
      return NextResponse.json({ error: "Exit screenshot is required" }, { status: 400 });
    }

    if (!logic || typeof logic !== "string" || !logic.trim()) {
      return NextResponse.json({ error: "Trade logic/notes are required" }, { status: 400 });
    }

    if (logic.trim().length > 2000) {
      return NextResponse.json({ error: "Trade logic cannot exceed 2000 characters" }, { status: 400 });
    }

    // SERVER-SIDE COMPUTED P&L (NEVER trust client values)
    const { pnlPercent, pnlAmount } = calculatePnl(
      numEntry,
      numExit,
      numQty,
      direction as TradeDirection
    );

    await connectToDatabase();

    const trade = await Trade.create({
      symbol: symbol.trim().toUpperCase(),
      entryPrice: numEntry,
      exitPrice: numExit,
      quantity: numQty,
      direction,
      pnlPercent,
      pnlAmount,
      entryScreenshotUrl: entryScreenshotUrl.trim(),
      exitScreenshotUrl: exitScreenshotUrl.trim(),
      logic: logic.trim(),
      tradeDate: tradeDate ? new Date(tradeDate) : new Date(),
      userId: session.userId,
    });

    return NextResponse.json(
      {
        success: true,
        trade,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create trade" },
      { status: 500 }
    );
  }
}
