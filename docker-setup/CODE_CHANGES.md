# CODE CHANGES REQUIRED

## 1. Update server.js

Find your current `server.js` file and make these changes:

### Add at the TOP of the file (with other imports):

```javascript
// Import Prometheus metrics
const { register, metricsMiddleware, metrics } = require('./docker-setup/backend/metrics');
```

### Add AFTER creating Express app (after `const app = express();`):

```javascript
// Add Prometheus metrics middleware
app.use(metricsMiddleware);
```

### Add BEFORE your existing routes (before app.use('/api/...)):

```javascript
// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});
```

### Add at the BOTTOM of the file:

```javascript
// Export metrics for use in controllers
module.exports = { app, metrics };
```

---

## 2. Update authController.js (Optional but Recommended)

Add this at the top:

```javascript
const { metrics } = require('../server');
```

In your `login` function, add after checking credentials:

```javascript
// Track login attempts
if (isPasswordMatch) {
  metrics.loginAttemptsCounter.labels('success').inc();
  // ... your success logic
} else {
  metrics.loginAttemptsCounter.labels('failed').inc();
  // ... your failure logic
}
```

---

## 3. Update postController.js (Optional but Recommended)

Add this at the top:

```javascript
const { metrics } = require('../server');
```

In your `createPost` function, add after successfully creating a post:

```javascript
// Track post creation
metrics.postsCreatedCounter.inc();
```

---

## 4. Update Frontend JavaScript

Find where you make API calls (likely in a JavaScript file in front_end folder).

**BEFORE:**
```javascript
fetch('http://localhost:5000/api/posts', {
  // ...
})
```

**AFTER:**
```javascript
fetch('/api/posts', {
  // ...
})
```

Do this for ALL API calls. Remove `http://localhost:5000` and keep only `/api/...`

The nginx proxy will handle routing to the backend.

---

## 5. Create .dockerignore (IMPORTANT!)

Create a new file in the `src` folder called `.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
uploads/*
!uploads/.gitkeep
```

This prevents copying node_modules into the Docker image.

---

## COMPLETE server.js EXAMPLE

Here's what your server.js should look like after all changes:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { register, metricsMiddleware, metrics } = require('./docker-setup/backend/metrics');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add Prometheus metrics middleware
app.use(metricsMiddleware);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Serve uploads folder
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stats', require('./routes/stats'));

// Error handler
app.use(require('./middleware/errorHandler'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export metrics for use in controllers
module.exports = { app, metrics };
```

---

## Testing Your Changes

After making these changes:

1. Test locally first:
```bash
npm install prom-client
node server.js
```

2. Visit http://localhost:5000/metrics
   - You should see Prometheus metrics output

3. If that works, proceed with Docker setup!
