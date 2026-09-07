import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

/**
 * Uploads a file Buffer to Cloudinary
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder = "trading_journal"
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload returned empty result"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary given its URL or public ID
 */
export async function deleteCloudinaryImage(urlOrPublicId: string): Promise<boolean> {
  if (!urlOrPublicId) return false;

  try {
    let publicId = urlOrPublicId;

    // If it's a full Cloudinary URL, extract the public ID
    if (urlOrPublicId.includes("cloudinary.com")) {
      // Example: https://res.cloudinary.com/cloudname/image/upload/v1234567890/trading_journal/sample_xyz.png
      const parts = urlOrPublicId.split("/upload/");
      if (parts.length > 1) {
        // Remove version prefix (v123456/) if present and remove extension
        const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
        const dotIndex = pathAfterUpload.lastIndexOf(".");
        publicId = dotIndex !== -1 ? pathAfterUpload.substring(0, dotIndex) : pathAfterUpload;
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.warn(`[cloudinary] Failed to delete image: ${urlOrPublicId}`, error);
    return false;
  }
}

export default cloudinary;
