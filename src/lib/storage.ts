import fs from "fs/promises";
import path from "path";
import { deleteCloudinaryImage } from "./cloudinary";

/**
 * Deletes a file either from Cloudinary (if remote URL) or from local disk (if legacy /uploads/).
 * Safe against path traversal and does not throw on missing files or serverless environments.
 */
export async function deleteLocalFile(fileUrl: string | null | undefined): Promise<boolean> {
  if (!fileUrl) return false;

  try {
    // If it's a Cloudinary URL, delete via Cloudinary API
    if (fileUrl.includes("cloudinary.com") || fileUrl.startsWith("trading_journal/")) {
      return await deleteCloudinaryImage(fileUrl);
    }

    // Only process URLs that start with /uploads/
    const normalized = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    if (!normalized.startsWith("uploads/")) {
      return false;
    }

    // Extract filename only to avoid directory traversal
    const fileName = path.basename(normalized);
    if (!fileName) return false;

    const fullPath = path.join(process.cwd(), "public", "uploads", fileName);

    // Verify the file exists before unlinking
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      return true;
    } catch {
      // File may not exist or environment is read-only (e.g. Vercel)
      return false;
    }
  } catch (error) {
    console.warn(`[storage] Could not delete file: ${fileUrl}`, error);
    return false;
  }
}

