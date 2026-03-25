# Performance Testing Plan

**IRM Sentinel** - Enterprise GRC SaaS Platform
**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Active

## 1. Executive Summary

This document outlines IRM Sentinel's comprehensive performance testing strategy, including critical user journeys, SLO targets, test types, tooling, and CI/CD integration. Performance testing is mandatory for all release candidates to ensure enterprise-grade reliability.

---

## 2. Critical User Journeys

IRM Sentinel's performance testing focuses on the most common and high-value user workflows.

### Journey 1: Dashboard Load (Analytics View)

**Scenario**: User logs in and views the executive risk dashboard with 15 top risks, 37 control statuses, and 17 key risk indicators (KRIs).

**Steps**:
1. GET `/api/dashboard` - Fetch top 15 risks (sorted by criticality)
2. GET `/api/controls?status=active` - Fetch 37 active controls
3. GET `/api/kris?period=month` - Fetch 17 KRIs for past month
4. Render dashboard UI with charts (Chart.js)

**Metrics**:
- Time to first contentful paint (FCP): <1s
- Time to interactive (TTI): <3s
- Total page load: <5s

**Data Volume**: ~500KB JSON payload

---

### Journey 2: TPRM Vendor Drill-Down with AI Narrative

**Scenario**: Compliance manager navigates to third-party risk management (TPRM) module, selects a vendor, views risk assessment, and triggers AI-generated risk narrative.

**Steps**:
1. GET `/api/vendors?status=active` - List 150 vendors (paginated)
2. GET `/api/vendors/:id/risks` - Fetch 8 risk items for selected vendor
3. GET `/api/vendors/:id/assessments` - Fetch compliance assessment data (50 questions)
4. POST `/api/ai/narrative` - Generate risk narrative using OpenAI (streaming response)
5. Render vendor profile with AI narrative

**Metrics**:
- Vendor list load: <2s
- Vendor detail page: <3s
- AI narrative generation: <30s (including API latency)
- Streaming response latency: <5s first token

**Data Volume**: ~2MB (vendor profile + assessments)

---

### Journey 3: Compliance Impact Analysis

**Scenario**: Compliance manager uses the impact analysis tool to map 25 internal controls to 8 regulatory frameworks (SOC 2, GDPR, HIPAA, etc.) and visualize compliance gaps.

**Steps**:
1. GET `/api/controls` - Fetch all 25 controls (with metadata)
2. GET `/api/frameworks` - Fetch 8 applicable regulatory frameworks
3. GET `/api/compliance-mappings` - Fetch control-to-framework mappings
4. POST `/api/impact-analysis` - Compute compliance impact matrix
5. Render interactive control-framework heatmap

**Metrics**:
- Controls load: <2s
- Frameworks load: <1s
- Impact analysis computation: <5s
- Heatmap render: <2s

**Data Volume**: ~300KB (sparse compliance matrix)

---

### Journey 4: Copilot Chat with Streaming Response

**Scenario**: User opens Copilot (AI assistant) and asks a risk-related question (e.g., "What are the top 3 control gaps for HIPAA?"). Response streams in real-time.

**Steps**:
1. POST `/api/copilot/chat` - Submit question
2. Stream responses in Server-Sent Events (SSE) format
3. Render streamed text tokens in chat UI in real-time

**Metrics**:
- Time to first token: <2s
- Token streaming latency: <100ms between tokens (p95)
- Total response time (all tokens): <15s
- Chat UI update latency: <50ms per token

**Data Volume**: ~1000 tokens in response

---

### Journey 5: Control Register View (Paginated List)

**Scenario**: Auditor views the control register with 15+ SOC 2 controls, sorts by status, applies filters, and exports to CSV.

**Steps**:
1. GET `/api/controls?page=1&limit=50` - Fetch first 50 controls
2. GET `/api/controls?sort=status` - Re-sort by status
3. GET `/api/controls?filter[framework]=SOC2` - Filter by framework
4. GET `/api/controls/export?format=csv` - Initiate bulk export
5. Stream CSV download

**Metrics**:
- Control list load: <2s
- Sort operation: <1s
- Filter operation: <1s
- CSV export initiation: <3s
- Export stream (50 controls): <5s

**Data Volume**: ~100KB per page; ~50KB CSV export

---

## 3. SLO Targets

### Response Time SLOs

| Metric | Target | P95 | P99 |
|--------|--------|-----|-----|
| API endpoint latency | <100ms | <200ms | <500ms |
| Streaming (Copilot) | First token <2s | <3s | <5s |
| Page load (FCP) | <1s | <2s | <3s |
| Page load (TTI) | <3s | <5s | <8s |
| Database query | <50ms | <100ms | <200ms |
| Cache hit (Redis) | <5ms | <10ms | <20ms |

### Availability SLOs

| SLO | Target |
|-----|--------|
| API Availability | 99.9% (43.2 min downtime/month) |
| Error Rate | <0.1% |
| Success Rate | >99.9% |

### Throughput SLOs

| Metric | Target |
|--------|--------|
| Sustained request rate | 1000 rps per pod |
| Peak request rate (burst) | 2000 rps per pod |
| Concurrent users | 500+ simultaneous |

---

## 4. Performance Test Types

### 4.1 Load Test

**Purpose**: Validate system behavior under normal/expected load.

**Profile**: Gradual ramp-up to target load, sustained for 10 minutes, then ramp-down.

```
Concurrent Users (VUs)
       │
    500│               ┌─────────────────────────┐
       │              ╱                           ╲
    400│             ╱                             ╲
       │            ╱                               ╲
    300│           ╱                                 ╲
       │          ╱                                   ╲
    200│         ╱                                     ╲
       │        ╱                                       ╲
    100│       ╱                                         ╲
       │      ╱                                           ╱
      0└────────────────────────────────────────────────────────
       0    2min     4min     6min     8min    10min   12min  14min
              Ramp-up (10 VUs/sec)  Sustain  Ramp-down
```

**Success Criteria**:
- p95 latency <200ms throughout
- p99 latency <500ms throughout
- Error rate <0.1%
- Database connection pool healthy
- CPU utilization <70%

**Duration**: 15 minutes total

---

### 4.2 Stress Test

**Purpose**: Find the breaking point; push beyond expected capacity to identify limits.

**Profile**: Ramp-up to 2x normal peak (1000 VUs) over 10 minutes, hold for 5 minutes, observe failure modes.

```
Concurrent Users (VUs)
      1000│                    ┌──────────┐
       900│                   ╱            ╲
       800│                  ╱              ╲
       700│                 ╱                ╲
       600│                ╱                  ╲
       500│               ╱                    ╲
       400│              ╱                      ╲
       300│             ╱                        ╲
       200│            ╱                          ╲
       100│           ╱                            ╲
         0└────────────────────────────────────────────
          0    2min    4min    6min    8min   10min  12min
                 Ramp-up            Hold   Ramp-down
```

**Success Criteria**:
- p95 latency <1000ms (acceptable degradation)
- p99 latency <2000ms
- Error rate <5% (some failures expected)
- Graceful degradation (circuit breakers activate)
- Auto-scaling triggered
- No memory leaks (heap stable post-test)

**Duration**: 15 minutes total

---

### 4.3 Spike Test

**Purpose**: Validate behavior during sudden traffic spikes.

**Profile**: Normal load (100 VUs) → sudden jump to 1000 VUs (10x spike) in <2 min → return to normal.

```
Concurrent Users (VUs)
      1000│          ╱─────────────────────╲
       800│         ╱                         ╲
       600│        ╱                           ╲
       400│       ╱                             ╲
       200│      ╱                               ╲
       100│─────╱                                 ╲────
         0└──────────────────────────────────────────────
          0    1min    2min    3min    4min    5min
                Spike!            Hold  Return to normal
```

**Success Criteria**:
- p95 latency <300ms during spike (some acceptable degradation)
- Error rate <1%
- Auto-scaling reacts within 1 minute
- No customer session loss
- System recovers to normal metrics within 2 minutes of spike subsiding

**Duration**: 5 minutes total

---

### 4.4 Soak Test

**Purpose**: Detect memory leaks, connection pool exhaustion, and other long-running issues.

**Profile**: Moderate load (200 VUs) sustained for 4 hours continuously.

**Success Criteria**:
- p95 latency stable throughout (no gradual degradation)
- Error rate <0.1% throughout
- Memory usage stable (no growth >100MB over 4h)
- Database connection count stable
- No hung requests (all complete)

**Duration**: 4 hours

---

## 5. k6 Performance Test Scripts

### 5.1 Load Test Script: Dashboard Journey

```typescript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const dashboardLoadTime = new Trend('dashboard_load_time');
const dashboardErrors = new Counter('dashboard_errors');
const controlsFetchTime = new Trend('controls_fetch_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up from 0 to 100 VUs
    { duration: '5m', target: 500 },   // Ramp up to 500 VUs
    { duration: '5m', target: 500 },   // Stay at 500 VUs
    { duration: '2m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    'http_req_failed': ['rate<0.001'],
    'dashboard_errors': ['count<5'],
  },
  ext: {
    loadimpact: {
      projectID: 3356642,
      name: 'IRM Sentinel - Dashboard Load Test',
    },
  },
};

const BASE_URL = 'https://irm.company.com';

export default function () {
  // Authenticate (or use pre-authenticated session)
  const authToken = __ENV.AUTH_TOKEN || 'test-token-123';

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  group('Dashboard Load', () => {
    // 1. Fetch top 15 risks
    const riskStart = new Date();
    const riskRes = http.get(
      `${BASE_URL}/api/dashboard/risks?limit=15&sort=-criticality`,
      { headers }
    );
    const riskTime = new Date() - riskStart;
    dashboardLoadTime.add(riskTime);

    check(riskRes, {
      'risks loaded': (r) => r.status === 200,
      'risks response < 1s': (r) => r.timings.duration < 1000,
    }) || dashboardErrors.add(1);

    // 2. Fetch 37 active controls
    const controlStart = new Date();
    const controlRes = http.get(
      `${BASE_URL}/api/controls?status=active&limit=40`,
      { headers }
    );
    const controlTime = new Date() - controlStart;
    controlsFetchTime.add(controlTime);

    check(controlRes, {
      'controls loaded': (r) => r.status === 200,
      'controls response < 2s': (r) => r.timings.duration < 2000,
    }) || dashboardErrors.add(1);

    // 3. Fetch 17 KRIs
    const kriRes = http.get(
      `${BASE_URL}/api/kris?period=month&limit=20`,
      { headers }
    );

    check(kriRes, {
      'kris loaded': (r) => r.status === 200,
      'kris response < 1s': (r) => r.timings.duration < 1000,
    }) || dashboardErrors.add(1);

    sleep(1); // Simulate user reading dashboard
  });
}
```

### 5.2 Spike Test Script: Copilot Chat

```typescript
import http from 'k6/http';
import ws from 'k6/ws';
import { check, group } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },    // Normal load: 100 VUs
    { duration: '2m', target: 1000 },   // SPIKE: 10x jump to 1000 VUs
    { duration: '1m', target: 100 },    // Return to normal
  ],
  thresholds: {
    'http_req_duration': ['p(95)<300', 'p(99)<1000'],
    'ws_connecting': ['count<50'],
  },
};

const BASE_URL = 'https://irm.company.com';
const WS_URL = 'wss://irm.company.com/api/copilot/ws';

export default function () {
  const authToken = __ENV.AUTH_TOKEN || 'test-token-123';

  group('Copilot Chat - Streaming Response', () => {
    // Open WebSocket for real-time chat
    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'CopilotChat' },
    };

    const startTime = new Date();

    ws.connect(WS_URL, params, function (socket) {
      socket.on('open', () => {
        // Send query
        socket.send(JSON.stringify({
          type: 'message',
          content: 'What are the top 3 control gaps for HIPAA?',
        }));
      });

      socket.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === 'stream') {
          // Token received; measure latency
          const latency = new Date() - startTime;
          check(latency < 100, {
            'token latency < 100ms': true,
          });
        }
        if (msg.type === 'done') {
          socket.close();
        }
      });

      socket.on('error', (e) => {
        console.error('ws error:', e);
      });

      socket.setTimeout(20000); // 20 sec timeout
    });
  });
}
```

### 5.3 Soak Test Script: Control Register

```typescript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Gauge } from 'k6/metrics';

const memoryUsage = new Gauge('memory_usage');
const queryTime = new Trend('query_time_soak');

export const options = {
  stages: [
    { duration: '4h', target: 200 }, // Sustain 200 VUs for 4 hours
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'http_req_failed': ['rate<0.001'],
  },
};

const BASE_URL = 'https://irm.company.com';

export default function () {
  const authToken = __ENV.AUTH_TOKEN;
  const headers = { 'Authorization': `Bearer ${authToken}` };

  group('Control Register - Soak Test', () => {
    // Paginate through controls
    const page = Math.floor(Math.random() * 10) + 1; // Random page 1-10

    const res = http.get(
      `${BASE_URL}/api/controls?page=${page}&limit=50`,
      { headers }
    );

    check(res, {
      'status 200': (r) => r.status === 200,
      'latency stable': (r) => r.timings.duration < 200,
      'no memory explosion': () => true, // Monitor externally via Prometheus
    });

    queryTime.add(res.timings.duration);

    // Simulate occasional filter
    if (Math.random() < 0.1) {
      const filterRes = http.get(
        `${BASE_URL}/api/controls?filter[framework]=SOC2`,
        { headers }
      );
      check(filterRes, {
        'filter successful': (r) => r.status === 200,
      });
    }

    sleep(2); // Simulate user thinking time
  });
}
```

---

## 6. CI/CD Integration

Performance tests run automatically on release candidates before production deployment.

### GitHub Actions Workflow

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main, staging]
  workflow_dispatch:

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          echo "Deploying PR to staging environment..."
          # Terraform/Helm apply to staging cluster

      - name: Wait for deployment
        run: kubectl rollout status deployment/irm-api -n staging --timeout=5m

      - name: Run Load Test
        run: |
          k6 run tests/performance/load-test.js \
            --vus 500 \
            --duration 10m \
            --out json=results-load.json \
            -e BASE_URL="https://staging-irm.internal" \
            -e AUTH_TOKEN="${{ secrets.STAGING_AUTH_TOKEN }}"

      - name: Run Spike Test
        run: |
          k6 run tests/performance/spike-test.js \
            --out json=results-spike.json \
            -e BASE_URL="https://staging-irm.internal" \
            -e AUTH_TOKEN="${{ secrets.STAGING_AUTH_TOKEN }}"

      - name: Analyze Results
        run: |
          # Compare against baseline
          node scripts/analyze-perf-results.js \
            --current results-load.json \
            --baseline baseline-load.json \
            --threshold-p95 200 \
            --threshold-error-rate 0.001

      - name: Check SLO Compliance
        run: |
          # Fail if SLOs violated
          if [[ $(jq '.metrics.http_req_duration.percentiles."95"' results-load.json) -gt 200 ]]; then
            echo "FAIL: p95 latency exceeded 200ms"
            exit 1
          fi

      - name: Report Results to Datadog
        run: |
          curl -X POST https://api.datadoghq.com/api/v1/events \
            -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
            -d "{
              \"title\": \"Performance test completed\",
              \"text\": \"Load test p95: $(jq '.metrics.http_req_duration.percentiles.\"95\"' results-load.json)ms\",
              \"priority\": \"low\",
              \"tags\": [\"env:staging\", \"service:irm-api\"]
            }"

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: results-*.json

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const load = JSON.parse(fs.readFileSync('results-load.json'));
            const p95 = load.metrics.http_req_duration.percentiles['95'];
            const errorRate = load.metrics.http_req_failed.value;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Performance Test Results\n- p95 Latency: ${p95.toFixed(0)}ms (target: <200ms)\n- Error Rate: ${errorRate.toFixed(2)}%\n- Status: ${p95 < 200 ? '✅ PASS' : '❌ FAIL'}`
            });
```

---

## 7. Observability During Tests

### Per-Tenant Latency Dashboards

Monitor performance breakdown by tenant during load tests:

```
Dashboard: "Load Test - Tenant Performance"

Panels:
1. Request Latency by Tenant (p95, p99)
2. Error Rate by Tenant (%)
3. Throughput by Tenant (rps)
4. Database Query Latency (by query type)
5. Redis Cache Hit Ratio
6. API Gateway Connection Count
7. Pod CPU & Memory Usage (per node)
8. Network I/O (egress/ingress)
```

### Auto-Scaling Event Correlation

Plot HPA scaling events alongside latency metrics to validate scaling effectiveness:

```
Timeline:
- T=0min: Load starts (100 VUs)
- T=2min: CPU >70% → HPA scales to 10 pods
- T=4min: CPU >70% again → HPA scales to 15 pods
- T=5min: Latency drops to <100ms (scaling effect)
- T=10min: Load stable, HPA holds 15 pods
- T=12min: Load ramps down, HPA scales down to 5 pods
```

### Memory & CPU Monitoring

```
Dashboard: "Pod Resource Usage"

Panels:
1. Memory Usage Over Time (per pod)
   - Should be stable (no growth >100MB/hour)
   - Detect memory leaks early
2. CPU Usage Over Time
   - Should track with load (increase with spike)
3. Garbage Collection Events
   - Monitor if GC pause times increase
4. Connection Pool Stats
   - Open connections, idle connections, wait queue
```

---

## 8. Tooling & Infrastructure

### Primary Tool: k6

- **Why**: Open-source, cloud-native, scriptable in JavaScript
- **Features**:
  - Real-time metrics during tests
  - Flexible thresholds (SLO validation)
  - Cloud integration (k6 Cloud for distributed tests)
  - WebSocket support (for Copilot chat)

### Dashboard: Grafana

- **Data Source**: Prometheus (scraped from k6 Cloud API)
- **Dashboards**:
  - Real-time test metrics (latency, throughput, errors)
  - Comparison against baseline
  - Trend analysis (week-over-week)

### Metrics Collection: Prometheus

- **Scrape Targets**:
  - API pods: `/metrics` endpoint (Node.js Prometheus client)
  - Kubernetes nodes: CPU, memory, disk I/O
  - Database: `pg_exporter` for PostgreSQL metrics
  - Redis: `redis_exporter` for cache metrics

---

## 9. Test Environment Requirements

### Production-Like Infrastructure

- **Cluster**: EKS/GKE cluster in same region as production
- **Node Count**: 10+ nodes (match production)
- **Instance Type**: Same as production (e.g., c5.2xlarge)
- **Network**: Isolated VPC (no cross-environment traffic)
- **Database**: Separate RDS/Cloud SQL instance (production clone schema)
- **Load Balancer**: AWS ALB / GCP Cloud LB (production-like configuration)

### Synthetic Tenant Data

- **Tenant Count**: 10 test tenants
- **Controls per Tenant**: 50-200 (mix of sizes)
- **Risks per Tenant**: 100-500
- **Historical Data**: 1 year of compliance records (for soak test)
- **Size**: ~5-10 GB database (test database)

### Test Data Cleanup

After each test run:
```bash
# Delete test data (preserve baseline for comparison)
DELETE FROM audit_logs WHERE created_at > test_start_time;
DELETE FROM controls WHERE created_by = 'test-runner';
VACUUM ANALYZE; -- Rebuild statistics
```

---

## 10. Performance Testing Schedule

| Test Type | Frequency | Trigger |
|-----------|-----------|---------|
| Load Test | Per PR | On every pull request |
| Spike Test | Weekly | Release candidates |
| Stress Test | Monthly | On-demand (or release week) |
| Soak Test | Quarterly | Major release cycle |

---

## 11. SLO Violation Response

If performance tests fail SLOs:

1. **Threshold**: If p95 > 200ms, error rate > 0.1%, or throughput < 1000 rps
2. **Action**: Block merge to main branch
3. **Investigation**:
   - Check for N+1 queries (database profiler)
   - Review code changes (diff vs baseline)
   - Check for memory leaks (heap snapshots)
   - Examine slow query logs
4. **Remediation**: Fix root cause, re-test
5. **Baseline Update**: Update baseline after merge to avoid regression

---

## 12. Example: Dashboard Load Test Report

```markdown
# Performance Test Report: v1.5.0 Release Candidate

**Test Date**: 2026-03-24
**Duration**: 15 minutes
**Peak Concurrent Users**: 500

## Results: PASS ✅

### Latency Metrics
| Metric | Target | Result | Status |
|--------|--------|--------|--------|
| p50 | N/A | 45ms | ✅ |
| p95 | <200ms | 168ms | ✅ |
| p99 | <500ms | 387ms | ✅ |
| Max | N/A | 1247ms | ⚠️ (outlier) |

### Throughput
- **Peak**: 2,847 rps
- **Avg**: 1,923 rps
- **Target**: 1,000 rps minimum
- **Status**: ✅ PASS

### Error Rate
- **Total**: 42 errors / 1,728,456 requests
- **Rate**: 0.002%
- **Target**: <0.1%
- **Status**: ✅ PASS

### Resource Utilization
- **API CPU Peak**: 68% (target: <70%)
- **API Memory Peak**: 1.2GB (target: <2GB)
- **Database CPU Peak**: 45%
- **Redis Hit Ratio**: 89% (target: >80%)

### Auto-Scaling Events
- Pod count: 3 → 15 (scaled up at T=2min)
- Scale-down: 15 → 3 (at T=12min when load decreased)
- Reaction time: ~90 seconds

### Database Metrics
- Slow queries (>100ms): 3 (acceptable)
- Connection pool: Max 42 of 50 available
- Lock wait time: 0ms (no contention)

## Conclusion

**APPROVED FOR PRODUCTION**: All SLOs met. Performance is stable under 500 concurrent users.

Recommendation: Monitor real user metrics post-deployment.
```

---

## 13. Roadmap

| Enhancement | Status | Target |
|-------------|--------|--------|
| Synthetic monitoring (continuous tests) | Planned | Q2 2026 |
| Real user monitoring (RUM) integration | Planned | Q2 2026 |
| Chaos engineering suite | Planned | Q3 2026 |
| Load test federation (multi-region) | Planned | Q4 2026 |

**Next Review**: 2026-06-24
