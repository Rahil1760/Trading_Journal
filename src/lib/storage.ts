import fs from "fs/promises";
import path from "path";

/**
 * Deletes a file saved in public/uploads from local disk.
 * Safe against path traversal.
 */
export async function deleteLocalFile(fileUrl: string | null | undefined): Promise<boolean> {
  if (!fileUrl) return false;

  try {
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
    await fs.access(fullPath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    // If file does not exist or cannot be deleted, log and continue
    console.warn(`[storage] Could not delete file: ${fileUrl}`, error);
    return false;
  }
}
