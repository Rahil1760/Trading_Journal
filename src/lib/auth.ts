import mongoose from "mongoose";
import { NextRequest } from "next/server";

// Standard demo/authenticated user ID for standalone trading journal
export const DEFAULT_USER_ID = new mongoose.Types.ObjectId("65f000000000000000000001");

export interface AuthSession {
  userId: mongoose.Types.ObjectId;
  username: string;
}

/**
 * Resolves current authenticated user session from NextRequest.
 * Supports x-user-id header or defaults to valid authenticated user.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthSession | null> {
  // If custom user ID header is provided in request
  const customUserId = request?.headers.get("x-user-id");
  if (customUserId && mongoose.Types.ObjectId.isValid(customUserId)) {
    return {
      userId: new mongoose.Types.ObjectId(customUserId),
      username: "trader_user",
    };
  }

  // Default authenticated session for the journal owner
  return {
    userId: DEFAULT_USER_ID,
    username: "journal_owner",
  };
}
