const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { dbName: "final_project" })
  .then(() => console.log("✅ Analytics Service: MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", PostSchema);

app.get("/analytics/summary", async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    res.json({
      totalPosts,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "analytics-service" });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`✅ Analytics Service running on port ${PORT}`));
