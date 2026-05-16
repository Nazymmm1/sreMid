const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const { register, metricsMiddleware, metrics } = require('./metrics');


app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

dotenv.config();
const mongoose = require("mongoose");

app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    if (dbStatus === 'disconnected') {
      return res.status(503).json({
        status: 'unhealthy',
        database: dbStatus
      });
    }

    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.use(cors({
  origin: ['http://192.168.56.10:3000', 'http://localhost:3000'],
  credentials: true
}));



app.use(express.json());

const path = require("path");
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/posts", postRoutes);

const analyticsRoutes = require("./routes/analytics.routes");
app.use("/analytics", analyticsRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/users", userRoutes);


module.exports = { app, metrics };
