const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { dbName: "final_project" })
  .then(() => console.log("✅ Search Service: MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", PostSchema);

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });
    const results = await Post.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } }
      ]
    });
    res.json({ query: q, results, count: results.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "search-service" });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`✅ Search Service running on port ${PORT}`));
