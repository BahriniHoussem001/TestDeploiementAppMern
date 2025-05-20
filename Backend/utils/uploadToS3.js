const AWS = require("aws-sdk");
const fs = require("fs");
require("dotenv").config();

// Log S3 configuration status
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  console.warn("\x1b[33m%s\x1b[0m", "⚠️ AWS S3 configuration incomplete. Check your environment variables.");
} else {
  console.log("\x1b[32m%s\x1b[0m", "✅ AWS S3 configuration loaded. Bucket: " + bucketName);
}

// Configuration de AWS S3
AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
});

const s3 = new AWS.S3();

/**
 *  Envoie un fichier PDF vers AWS S3 et retourne l'URL publique.
 * @param {string} filePath - Chemin local du fichier PDF
 * @param {string} fileName - Nom du fichier à stocker sur S3
 * @returns {Promise<string>} - URL du fichier sur S3
 */
const uploadToS3 = (filePath, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`Le fichier ${filePath} n'existe pas`));
      }

      // Check if S3 is configured
      if (!process.env.AWS_S3_BUCKET_NAME) {
        console.warn("AWS S3 not configured, using local storage as fallback");

        // Copy file to temp directory
        const path = require('path');
        const tempFilePath = path.join(__dirname, '..', 'temp', fileName);

        fs.copyFile(filePath, tempFilePath, (copyErr) => {
          if (copyErr) {
            console.error("Error copying file to temp directory:", copyErr);
            return reject(copyErr);
          }

          console.log(`File saved locally at ${tempFilePath}`);
          return resolve(`http://localhost:5000/temp/${fileName}`);
        });

        return; // Exit early as we're handling the resolve in the callback
      }

      // Read file
      fs.readFile(filePath, (err, fileData) => {
        if (err) {
          console.error("Error reading file:", err);
          return reject(err);
        }

        // Prepare upload parameters
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `cv-uploads/${fileName}`,
          Body: fileData,
          ContentType: "application/pdf"
          // ACL parameter removed as it's not supported by the bucket
        };

        // Upload to S3
        s3.upload(params, (uploadErr, data) => {
          if (uploadErr) {
            console.error("Error uploading to S3:", uploadErr);
            return reject(uploadErr);
          }
          console.log("File uploaded successfully to", data.Location);
          resolve(data.Location); // Return the URL of the file
        });
      });
    } catch (error) {
      console.error("Unexpected error in uploadToS3:", error);
      reject(error);
    }
  });
};

module.exports = uploadToS3;
