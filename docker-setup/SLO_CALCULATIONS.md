# SLI, SLO, and Error Budget Definitions

## Overview
This document defines the Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Error Budgets for the Personal Blog application.

---

## SLI #1: Availability (Success Rate)

### Definition
Percentage of HTTP requests that return a successful response (status codes 2xx or 4xx, excluding 5xx server errors).

### Business Justification
User-facing failures (5xx errors) directly impact user experience and trust. A user who encounters server errors may abandon the platform.

### Mathematical Formula
```
Availability = (Total Requests - Server Errors) / Total Requests × 100%

Or using Prometheus:
Availability = (1 - (5xx_requests / total_requests)) × 100%
```

### Prometheus Query
```promql
(1 - (
  rate(http_requests_total{status=~"5.."}[30d]) 
  / 
  rate(http_requests_total[30d])
)) * 100
```

### SLO Target
**99.5% availability over a 30-day rolling window**

### Rationale
- Industry standard for user-facing web applications
- Allows for planned maintenance and unexpected incidents
- Balances reliability with development velocity

### Error Budget Calculation

**Time Period**: 30 days (monthly)

**Total Available Time**:
```
30 days × 24 hours × 60 minutes = 43,200 minutes
```

**Allowed Downtime** (0.5% of 43,200 minutes):
```
43,200 minutes × 0.005 = 216 minutes
                        = 3.6 hours per month
                        = 51.84 seconds per hour
```

**Request-Based Budget** (assuming 1,000,000 requests/month):
```
Total Requests: 1,000,000
Allowed Failures: 1,000,000 × 0.005 = 5,000 failed requests
Success Required: 995,000 successful requests
```

### Monthly Error Budget Tracking

| Week | Failed Requests | Budget Used | Budget Remaining |
|------|----------------|-------------|------------------|
| 1    | 800            | 16%         | 4,200 (84%)      |
| 2    | 1,200          | 24%         | 3,000 (60%)      |
| 3    | 900            | 18%         | 2,100 (42%)      |
| 4    | 1,100          | 22%         | 1,000 (20%)      |
| **Total** | **4,000** | **80%**   | **1,000 (20%)** |

**Interpretation**: This month consumed 80% of error budget, leaving 20% buffer. We're within SLO compliance.

### What Happens When Error Budget is Exhausted?

**If budget reaches 0:**
1. **Immediate Actions**:
   - Halt all feature deployments
   - Focus engineering on reliability improvements
   - Increase monitoring and alerting sensitivity

2. **Root Cause Analysis**:
   - Investigate top sources of errors
   - Identify systemic issues
   - Create action items for fixes

3. **Resume Normal Operations When**:
   - Next monthly cycle begins (budget resets)
   - OR critical reliability fixes are deployed and validated

---

## SLI #2: Latency (Response Time)

### Definition
95th percentile (P95) of HTTP request response time for successful requests.

### Business Justification
Response time directly affects user experience. Research shows:
- Users abandon pages that take >3 seconds to load
- Each 100ms delay reduces conversions by ~1%
- Slow responses increase bounce rates

### Mathematical Formula
```
P95 Latency = Value at 95th percentile of response time distribution

Meaning: 95% of requests complete faster than this threshold
```

### Prometheus Query
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)
```

### SLO Target
**95% of requests complete within 300ms (0.3 seconds)**

### Rationale
- 300ms is the threshold for "instantaneous" user perception
- Allows for database queries, external API calls, rendering
- Industry standard for interactive web applications

### Error Budget Calculation

**Measurement Window**: 5 minutes (short-term performance tracking)

**Sample Scenario**:
```
Total Requests in 5 min: 1,000 requests
P95 Target: 300ms
```

**Allowed "Slow" Requests** (5% of 1,000):
```
Slow Request Budget: 1,000 × 0.05 = 50 requests
Fast Requests Required: 950 requests < 300ms
```

**Example Distribution**:
```
P50 (median):     150ms  ✓ Under budget
P75:              220ms  ✓ Under budget
P90:              280ms  ✓ Under budget
P95:              290ms  ✓ MEETING SLO (< 300ms)
P99:              450ms  ✗ Acceptable (within 5% budget)
Max:              800ms  ✗ Acceptable (outlier)
```

**Interpretation**: As long as P95 stays under 300ms, we're meeting the SLO even if P99 and max are higher.

### Daily Error Budget

**Over 24 hours** (assuming 10 requests/second):
```
Total Daily Requests: 10 req/s × 86,400 seconds = 864,000 requests
Allowed Slow Requests: 864,000 × 0.05 = 43,200 requests
```

**Budget Consumption Example**:

| Hour | Slow Requests | Hourly Budget | Daily Budget Used |
|------|--------------|---------------|-------------------|
| 00-01 | 120         | 1,800         | 6.7%              |
| 01-02 | 80          | 1,800         | 4.4%              |
| 02-03 | 50          | 1,800         | 2.8%              |
| ...   | ...         | ...           | ...               |
| **Total** | **2,100** | **43,200** | **4.9%**         |

**Interpretation**: Only 4.9% of daily budget used. Latency is well within SLO.

---

## Alert Thresholds Based on SLOs

### Availability Alerts

**Warning Alert**: Error rate > 1% for 5 minutes
```promql
(
  rate(http_requests_total{status=~"5.."}[5m]) 
  / 
  rate(http_requests_total[5m])
) > 0.01
```
- **Severity**: Warning
- **Action**: Investigate but don't page
- **Budget Impact**: Burns error budget 10x faster than SLO

**Critical Alert**: Error rate > 5% for 2 minutes
```promql
(
  rate(http_requests_total{status=~"5.."}[5m]) 
  / 
  rate(http_requests_total[5m])
) > 0.05
```
- **Severity**: Critical
- **Action**: Immediate response, page on-call engineer
- **Budget Impact**: Burns entire monthly budget in ~6 hours

### Latency Alerts

**Warning Alert**: P95 latency > 300ms for 5 minutes
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) > 0.3
```
- **Severity**: Warning
- **Action**: Check for performance degradation
- **Budget Impact**: Exactly at SLO threshold

**Critical Alert**: P95 latency > 500ms for 3 minutes
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) > 0.5
```
- **Severity**: Critical  
- **Action**: Immediate investigation
- **Budget Impact**: Significant user experience degradation

---

## Error Budget Policy

### When Budget > 50% Remaining
✅ **Normal Operations**
- Deploy new features freely
- Standard testing procedures
- Weekly releases allowed

### When Budget 20-50% Remaining
⚠️ **Caution Mode**
- Increase testing rigor
- Require approval for risky deployments
- Daily monitoring of budget consumption

### When Budget < 20% Remaining
🚨 **Reliability Focus**
- Feature freeze (only critical bugs)
- Mandatory canary deployments
- All hands focus on reliability improvements

### When Budget Exhausted (0%)
🛑 **Emergency Mode**
- Complete feature freeze
- Root cause analysis required
- Reliability improvements only
- Resume features only after:
  - Budget resets next month
  - OR critical fixes deployed and proven

---

## Monitoring Dashboard Panels

### Panel 1: SLO Compliance Gauge
```
Query: (1 - (rate(http_requests_total{status=~"5.."}[30d]) / rate(http_requests_total[30d]))) * 100
Thresholds:
  - Red: < 95%
  - Yellow: 95-99.5%
  - Green: > 99.5%
```

### Panel 2: Error Budget Burn Rate
```
Query: rate(http_requests_total{status=~"5.."}[1h]) / (total_monthly_budget / 720)
Interpretation:
  - 1.0 = Burning budget at sustainable rate
  - > 1.0 = Burning budget too fast
  - < 1.0 = Ahead of plan
```

### Panel 3: Latency Distribution
```
Queries:
  - P50: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
  - P95: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
  - P99: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
SLO Line: 300ms (horizontal line)
```

---

## Sample Incident Response Using Error Budget

### Scenario: Database Slowdown

**Time**: 14:00
**Alert**: "HighLatency - P95 > 500ms for 3 minutes"

**Error Budget Impact**:
```
Before Incident:
  - 30-day availability: 99.7%
  - Error budget remaining: 70%

During Incident (2 hours):
  - Failed requests: 2,400
  - Budget consumed: 48% (2,400 / 5,000)
  - New budget remaining: 22%

After Incident:
  - Root cause: Unindexed MongoDB query
  - Fix: Added compound index
  - Validation: Latency returned to 150ms P95
  - Budget status: 22% remaining (CAUTION MODE)
```

**Response Actions**:
1. Immediate: Roll back recent deployment
2. Short-term: Add database index
3. Long-term: Implement query performance testing in CI/CD

---

## Conclusion

These SLIs and SLOs provide:
1. **Clear reliability targets** that balance user needs with engineering velocity
2. **Objective measurements** using Prometheus queries
3. **Error budgets** that guide decision-making
4. **Alert thresholds** that escalate appropriately

By tracking these metrics in Grafana and responding to Prometheus alerts, the team can maintain high reliability while continuing to ship features.
