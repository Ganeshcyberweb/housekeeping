const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// === Parse CLI argument ===
const [, , backupFileName] = process.argv;

if (!backupFileName) {
  console.error(
    "❌ Please provide a backup JSON file name.\nUsage: node importFirestore.js <backup-file.json>"
  );
  process.exit(1);
}

const backupPath = path.resolve(__dirname, backupFileName);

// === Load backup file ===
let backup;
try {
  backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
} catch (error) {
  console.error(`❌ Failed to read or parse ${backupFileName}:`, error.message);
  process.exit(1);
}

// === Load Firebase credentials ===
const serviceAccount = require("./appConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importData() {
  for (const [collectionName, documents] of Object.entries(backup)) {
    const collectionRef = db.collection(collectionName);
    console.log(
      `⏳ Importing ${
        Object.keys(documents).length
      } docs into '${collectionName}'...`
    );

    for (const [docId, docData] of Object.entries(documents)) {
      try {
        await collectionRef.doc(docId).set(docData, { merge: true });
      } catch (error) {
        console.error(
          `❌ Failed to import document ${docId} into ${collectionName}:`,
          error.message
        );
      }
    }

    console.log(`✅ Imported collection '${collectionName}'`);
  }

  console.log("🎉 Firestore import complete.");
}

importData().catch((error) => {
  console.error("❌ Import failed:", error.message);
});
