import multer from "multer";
import cloudinary from "../config/cloudinary.js";

// ===============================
// MULTER CONFIG (Memory Storage)
// ===============================
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ===============================
// CLOUDINARY UPLOAD FUNCTION
// ===============================
export const uploadToCloudinary = (file, folder = "profiles") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(file.buffer);
  });
};
// ===============================
// MULTIPLE FILE UPLOAD (ARRAY)
// ===============================
export const uploadMultipleToCloudinary = async (files, folder) => {
  const uploads = [];

  for (const file of files) {
    const result = await uploadToCloudinary(file, folder);
    uploads.push(result.secure_url);
  }

  return uploads;
};

export default upload;
