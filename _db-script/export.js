// exportFirestore.js
const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert(require("./appConfig.json")),
});

const db = admin.firestore();

const collectionsToExport = ["rooms", "shifts", "staff"];

async function exportData() {
  const data = {};
  for (const col of collectionsToExport) {
    const snapshot = await db.collection(col).get();
    data[col] = {};
    snapshot.forEach((doc) => {
      data[col][doc.id] = doc.data();
    });
  }
  fs.writeFileSync("backup.json", JSON.stringify(data, null, 2));
  console.log("Export complete ✅");
}

exportData().catch(console.error);
