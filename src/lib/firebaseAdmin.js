import admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
    let serviceAccount = null;

    // Support secure production environments (like Vercel) using env vars directly
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };
      console.log("Firebase Admin SDK credentials loaded from Environment Variables.");
    } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
      serviceAccount = JSON.parse(fileContent);
      console.log("Firebase Admin SDK credentials loaded from JSON file path.");
    } else {
      // Fallback: Check the root workspace directory for the service account file
      const defaultRelativePath = path.join(process.cwd(), "csi-recruitment-36336-firebase-adminsdk-fbsvc-735777ce1f.json");
      if (fs.existsSync(defaultRelativePath)) {
        const fileContent = fs.readFileSync(defaultRelativePath, "utf8");
        serviceAccount = JSON.parse(fileContent);
        console.log("Firebase Admin SDK credentials loaded from default root JSON fallback.");
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      console.warn("Firebase Admin SDK Service Account credentials not found. Server actions may fail.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;

export { admin, adminDb, adminAuth };
// Use CommonJS-compatible export style or standard ES exports
export default admin;
