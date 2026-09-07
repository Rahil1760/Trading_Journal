import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { uploadImageBuffer } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WEBP, GIF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly to Cloudinary
    const uploadResult = await uploadImageBuffer(buffer, "trading_journal/trades");

    return NextResponse.json(
      {
        success: true,
        url: uploadResult.url,
        filename: file.name,
        size: uploadResult.bytes || file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image upload to Cloudinary" },
      { status: 500 }
    );
  }
}

