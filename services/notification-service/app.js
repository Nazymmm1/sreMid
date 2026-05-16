const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const notifications = [];

app.post("/notifications", (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const notification = {
      id: Date.now(),
      userId,
      message,
      type: type || "info",
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);
    console.log(`📧 Notification sent to user ${userId}: ${message}`);
    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/notifications/:userId", (req, res) => {
  try {
    const userNotifications = notifications.filter(n => n.userId === req.params.userId);
    res.json(userNotifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "notification-service" });
});

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`✅ Notification Service running on port ${PORT}`));
