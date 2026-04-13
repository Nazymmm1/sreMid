# SRE Midterm Project - Complete Setup Guide

## 🎯 Overview
This guide will help you containerize your Personal Blog application and set up a complete SRE observability stack with Prometheus and Grafana.

## 📋 Prerequisites
- Docker Desktop installed and running
- Your existing blog application code
- MongoDB Atlas connection (or use local MongoDB in Docker)

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Copy Files to Your Project

You need to copy all the Docker/observability files I created into your project directory.

**Your project structure should look like this:**

```
C:\Users\User\OneDrive\Desktop\noSql_PB-prototype_v2\
├── src/                          (your existing backend)
├── front_end/                    (your existing frontend)
├── docker-setup/                 ← NEW - Copy this folder
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── metrics.js
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alert_rules.yml
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── datasources/
│   │       │   └── prometheus.yml
│   │       └── dashboards/
│   │           ├── dashboard.yml
│   │           └── blog-dashboard.json
│   └── docker-compose.yml
├── uploads/                      (existing)
├── .env                          (existing)
└── package.json                  (existing)
```

### Step 2: Update Backend Dependencies

Add Prometheus client to your backend:

```bash
cd C:\Users\User\OneDrive\Desktop\noSql_PB-prototype_v2
npm install prom-client
```

### Step 3: Instrument Your Backend

You need to add metrics to your `server.js` file:

**Open `server.js` and add these lines:**

```javascript
// At the top with other requires
const { register, metricsMiddleware, metrics } = require('./docker-setup/backend/metrics');

// After creating the app (after const app = express();)
app.use(metricsMiddleware);

// Add metrics endpoint BEFORE other routes
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Export metrics for use in controllers
module.exports = { metrics };
```

### Step 4: Add Metrics to Your Controllers (Optional but Recommended)

**In your auth controller (login function):**

```javascript
const { metrics } = require('../server');

// In your login function, after successful/failed login:
if (loginSuccess) {
  metrics.loginAttemptsCounter.labels('success').inc();
} else {
  metrics.loginAttemptsCounter.labels('failed').inc();
}
```

**In your post controller (create post function):**

```javascript
const { metrics } = require('../server');

// After successfully creating a post:
metrics.postsCreatedCounter.inc();
```

### Step 5: Update Frontend API URLs

**In your frontend JavaScript files**, change API URLs from:
```javascript
fetch('http://localhost:5000/api/posts')
```

To:
```javascript
fetch('/api/posts')  // The nginx proxy will handle this
```

This is because nginx will proxy `/api/*` requests to the backend.

### Step 6: Start Everything with Docker

```bash
# Make sure Docker Desktop is running

# Navigate to your project root
cd C:\Users\User\OneDrive\Desktop\noSql_PB-prototype_v2

# Build and start all services
docker-compose -f docker-setup/docker-compose.yml up --build
```

**What happens:**
- MongoDB starts on port 27017
- Backend starts on port 5000
- Frontend starts on port 3000
- Prometheus starts on port 9090
- Grafana starts on port 3001
- Node Exporter starts on port 9100
- cAdvisor starts on port 8080

### Step 7: Access Your Services

Open these URLs in your browser:

1. **Frontend**: http://localhost:3000 (Your blog website)
2. **Backend API**: http://localhost:5000/api/posts
3. **Metrics**: http://localhost:5000/metrics (Raw Prometheus metrics)
4. **Prometheus**: http://localhost:9090
5. **Grafana**: http://localhost:3001
   - Username: `admin`
   - Password: `admin123`
6. **cAdvisor**: http://localhost:8080 (Container metrics)

### Step 8: Verify Prometheus is Scraping

1. Go to http://localhost:9090
2. Click "Status" → "Targets"
3. You should see all services UP (green):
   - backend
   - node-exporter
   - cadvisor
   - prometheus

### Step 9: Configure Grafana Dashboard

1. Go to http://localhost:3001
2. Login with `admin` / `admin123`
3. The dashboard should be auto-provisioned
4. If not, go to Dashboards → Import → Upload `blog-dashboard.json`

### Step 10: Generate Some Traffic

Use your blog application:
- Register users
- Create posts
- Comment on posts
- Like posts

Watch the metrics appear in Grafana!

---

## 🎨 SLI & SLO Definition (For Your Report)

### SLI 1: Availability
**Definition**: Percentage of successful requests (non-5xx responses)

**Measurement**:
```promql
(1 - (rate(http_requests_total{status=~"5.."}[30d]) / rate(http_requests_total[30d]))) * 100
```

**SLO**: 99.5% availability over 30 days

**Error Budget**: 
- Total time in 30 days: 43,200 minutes
- Allowed downtime: 0.5% = 216 minutes = 3.6 hours/month

### SLI 2: Latency
**Definition**: 95th percentile of request response time

**Measurement**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**SLO**: 95% of requests complete in under 300ms

**Error Budget**:
- In a 5-minute window with 1000 requests
- Up to 50 requests can exceed 300ms (5%)

---

## 🚨 Testing Alerts

### Trigger a Warning Alert (Elevated Error Rate)

**Method 1: Crash the backend temporarily**

```bash
# Stop the backend container
docker stop blog_backend

# Wait 2-3 minutes, then check Prometheus alerts
# Restart it
docker start blog_backend
```

**Method 2: Send invalid requests**

```bash
# Send 100 bad requests quickly
for i in {1..100}; do
  curl http://localhost:5000/api/invalid-endpoint
done
```

### View Firing Alerts

1. Go to http://localhost:9090/alerts
2. You should see alerts in PENDING or FIRING state
3. Take screenshots for your report!

---

## 📊 Golden Signals in Your Dashboard

Your Grafana dashboard tracks all 4 Golden Signals:

1. **Latency**: Response time (P50, P95, P99)
2. **Traffic**: Request rate (requests/second)
3. **Errors**: Error rate percentage
4. **Saturation**: CPU and Memory usage

---

## 🎓 For Your Defense

### Key Talking Points:

**Why these containers?**
- Frontend: Nginx (fast static file serving)
- Backend: Node.js (your application)
- MongoDB: Database (could use Atlas instead)
- Prometheus: Metrics collection
- Grafana: Visualization
- Node Exporter: System metrics
- cAdvisor: Container metrics

**Why these SLIs?**
- Availability: Critical for user experience
- Latency: Affects user satisfaction

**How do you know if you're meeting SLOs?**
- Grafana dashboard shows real-time compliance
- Prometheus alerts fire when we violate SLOs
- Error budget tracking prevents overreacting

**What happens when error budget runs out?**
- Stop deploying new features
- Focus on reliability improvements
- Root cause analysis of incidents

---

## 🐳 BONUS: Docker Swarm (Extra 10 Points)

### Initialize Swarm

```bash
docker swarm init
```

### Deploy as a Stack

```bash
docker stack deploy -c docker-setup/docker-compose.yml blog
```

### View Services

```bash
docker service ls
docker service ps blog_backend
```

### Scale Services

```bash
docker service scale blog_backend=3
```

---

## 🔧 Troubleshooting

### Backend won't start
- Check MongoDB connection string in docker-compose.yml
- Check logs: `docker logs blog_backend`

### Prometheus shows targets DOWN
- Wait 1-2 minutes for services to fully start
- Check if backend is exposing /metrics endpoint

### Grafana dashboard empty
- Generate traffic to your application
- Wait 2-3 minutes for metrics to populate

### Frontend can't reach backend
- Check nginx.conf proxy settings
- Check browser console for CORS errors

---

## 📝 Files You Need to Submit

1. **PDF Report** with:
   - Architecture diagram
   - SLI/SLO definitions + calculations
   - Dashboard screenshots
   - Alert screenshots

2. **Presentation Slides** (5-7 slides)

3. **Code** (zip file with):
   - All Dockerfiles
   - docker-compose.yml
   - prometheus.yml
   - alert_rules.yml
   - Modified server.js

4. **Live Demo** during defense

---

## 🎉 You're Ready!

Your complete SRE observability stack is now running. You have:

✅ Containerized application
✅ Prometheus metrics collection
✅ Grafana dashboards with Golden Signals
✅ Alert rules for SLO violations
✅ Full documentation

**Good luck with your midterm! 🚀**
