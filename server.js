const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json({ limit: "10kb" }));

// Firebase credentials Render ke Environment Variables se aayenge.
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable missing");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shubham-chat-v1-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.get("/", (req, res) => {
  res.json({
    name: "SHUBHAM CHAT V1",
    status: "Backend running"
  });
});

// Recent chat messages read karo.
app.get("/messages", async (req, res) => {
  try {
    const snapshot = await db.ref("messages")
      .orderByChild("createdAt")
      .limitToLast(50)
      .once("value");

    const messages = [];

    snapshot.forEach((child) => {
      messages.push({
        id: child.key,
        ...child.val()
      });
    });

    res.json(messages);
  } catch (error) {
    console.error("Read error:", error.message);
    res.status(500).json({ error: "Could not load messages" });
  }
});

// Message bhejo.
app.post("/messages", async (req, res) => {
  try {
    const { username, displayName, message } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof displayName !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({ error: "Invalid message data" });
    }

    const cleanUsername = username.trim().slice(0, 20);
    const cleanDisplayName = displayName.trim().slice(0, 30);
    const cleanMessage = message.trim().slice(0, 300);

    if (!cleanUsername || !cleanDisplayName || !cleanMessage) {
      return res.status(400).json({ error: "Fields cannot be empty" });
    }

    const ref = db.ref("messages").push();

    const data = {
      username: cleanUsername,
      displayName: cleanDisplayName,
      message: cleanMessage,
      createdAt: Date.now()
    };

    await ref.set(data);

    res.status(201).json({ id: ref.key, ...data });
  } catch (error) {
    console.error("Write error:", error.message);
    res.status(500).json({ error: "Could not send message" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SHUBHAM CHAT V1 listening on port ${PORT}`);
});
