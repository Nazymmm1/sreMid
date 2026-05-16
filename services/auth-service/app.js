const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
mongoose.connect(process.env.MONGO_URI, { dbName: "final_project" })
  .then(() => console.log("✅ Auth Service: MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// User Model
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", UserSchema);

// Routes
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "auth-service" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Auth Service running on port ${PORT}`));
