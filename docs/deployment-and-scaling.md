# Deployment & Scaling Architecture

**IRM Command** - Enterprise GRC SaaS Platform
**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Active

## 1. Infrastructure Stack Overview

IRM Command is deployed on cloud-native infrastructure with Kubernetes orchestration, designed for high availability, auto-scaling, and multi-region disaster recovery.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Edge / CDN Layer                                   │
│  CloudFront / Cloud CDN - Caches static assets, DDoS protection         │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼──────────┐           ┌─────────▼────────┐
│  API Gateway     │           │  Nginx Frontend  │
│  ALB / Cloud LB  │           │  Container       │
│  SSL termination │           │  (React build)   │
│  rate limiting   │           └──────────────────┘
└───────┬──────────┘
        │
┌───────▼────────────────────────────────────────────┐
│        Kubernetes Cluster (EKS / GKE)              │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │        Node Pool: API Tier                  │ │
│  │  ┌─────────────┬─────────────┬────────────┐ │ │
│  │  │ API Pod 1   │ API Pod 2   │ API Pod N  │ │ │
│  │  │ Node.js 18+ │ Node.js 18+ │ Node.js 18+│ │ │
│  │  └─────────────┴─────────────┴────────────┘ │ │
│  │  Replicas: 3-30 (auto-scaled via HPA)       │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │        Node Pool: Worker Tier               │ │
│  │  ┌─────────────┬─────────────┬────────────┐ │ │
│  │  │ Worker 1    │ Worker 2    │ Worker N   │ │ │
│  │  │ (AI requests)│(Async jobs)│(Async jobs)│ │ │
│  │  └─────────────┴─────────────┴────────────┘ │ │
│  │  Replicas: 1-10 (queue-depth auto-scale)    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────┬───────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──┐   ┌────▼──────┐  ┌─▼──────────┐
│PostgreSQL│   │   Redis   │  │  S3/GCS    │
│RDS/Cloud │   │ Cache &   │  │   Storage  │
│   SQL    │   │ Sessions  │  │ Documents  │
│ Multi-AZ │   │ Multi-AZ  │  │ Artifacts  │
└──────────┘   └───────────┘  └────────────┘
```

---

## 2. Container Architecture

### Frontend Container (Nginx)

**Dockerfile:**
```dockerfile
# Stage 1: Build React app with Vite
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build
# Output: dist/

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Security: run as non-root
RUN addgroup -g 101 nginx && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copy built frontend
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080
USER nginx

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf (security & performance):**
```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
  worker_connections 4096;
  use epoll;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_min_length 1000;
  gzip_types text/plain text/css application/json application/javascript;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/s;
  limit_req_zone $http_x_forwarded_for zone=frontend_limit:10m rate=100r/s;

  # Upstream API
  upstream api_backend {
    least_conn;
    server api:3000 max_fails=3 fail_timeout=30s;
  }

  server {
    listen 8080;
    server_name _;

    # Security headers (from security-headers.conf)
    include /etc/nginx/conf.d/security-headers.conf;

    # Logging
    access_log /var/log/nginx/access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/error.log warn;

    # Health check endpoint
    location /health {
      access_log off;
      return 200 "healthy\n";
    }

    # Proxy API requests
    location /api/ {
      limit_req zone=api_limit burst=100 nodelay;
      proxy_pass http://api_backend;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_buffering off;
      proxy_request_buffering off;
    }

    # SPA: serve index.html for all non-file routes
    location / {
      limit_req zone=frontend_limit burst=50 nodelay;
      root /usr/share/nginx/html;
      try_files $uri $uri/ /index.html;
      expires 1h;
      add_header Cache-Control "public, max-age=3600";
    }

    # Static assets: long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
      root /usr/share/nginx/html;
      expires 30d;
      add_header Cache-Control "public, max-age=2592000, immutable";
    }
  }
}
```

### API Container (Node.js)

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Security: non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=app:app src ./src
COPY --chown=app:app dist ./dist
COPY --chown=app:app config ./config

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
USER app

# Graceful shutdown handling
STOPSIGNAL SIGTERM

CMD ["node", "dist/server.js"]
```

---

## 3. Kubernetes Manifests

### Deployment: API Tier

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: irm-api
  namespace: prod
  labels:
    app: irm-api
    tier: backend
spec:
  replicas: 3  # Overridden by HPA
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployment
  selector:
    matchLabels:
      app: irm-api
  template:
    metadata:
      labels:
        app: irm-api
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - irm-api
              topologyKey: kubernetes.io/hostname
      containers:
      - name: api
        image: gcr.io/irm-command/api:latest
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 3000
        - name: metrics
          containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-credentials
              key: openai-key
        - name: TENANT_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: var-run
          mountPath: /var/run
      volumes:
      - name: tmp
        emptyDir: {}
      - name: var-run
        emptyDir: {}
      terminationGracePeriodSeconds: 30
```

### Service: Expose API

```yaml
apiVersion: v1
kind: Service
metadata:
  name: irm-api-service
  namespace: prod
  labels:
    app: irm-api
spec:
  type: ClusterIP
  selector:
    app: irm-api
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  - name: metrics
    port: 3001
    targetPort: 3001
    protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

### HPA: Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: irm-api-hpa
  namespace: prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: irm-api
  minReplicas: 3
  maxReplicas: 30
  metrics:
  # CPU-based scaling
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  # Memory-based scaling
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  # Custom metric: request rate
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  # Custom metric: latency (p95)
  - type: Pods
    pods:
      metric:
        name: http_request_duration_seconds_p95
      target:
        type: AverageValue
        averageValue: "0.2"  # 200ms
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 5
        periodSeconds: 15
      selectPolicy: Max
```

### PDB: Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: irm-api-pdb
  namespace: prod
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: irm-api
```

---

## 4. Auto-Scaling Policies

### API Tier Scaling Triggers

**Scale Up** when ANY metric exceeds threshold:
- CPU utilization > 70%
- Memory utilization > 80%
- Request rate > 1000 rps per pod
- p95 latency > 200ms (5min sustained)

**Action**: Add 1 pod every 15 seconds (max +100% per minute)
**Max Replicas**: 30 pods

**Scale Down** when ALL metrics below threshold for 5 minutes:
- CPU utilization < 50%
- Memory utilization < 60%
- Request rate < 500 rps per pod
- p95 latency < 100ms

**Action**: Remove 50% of excess pods every 60 seconds (conservative)
**Min Replicas**: 3 pods

### Worker Tier Scaling Triggers

**Scale Up** when:
- Queue depth > 100 messages (Redis queue length)
- Job processing latency > 30 seconds
- Worker utilization > 80%

**Action**: Add 1 worker pod every 30 seconds (max +100% per minute)
**Max Replicas**: 10 pods

**Scale Down** when:
- Queue depth < 10 messages
- Worker utilization < 20%

**Action**: Remove 1 pod every 120 seconds
**Min Replicas**: 1 pod

---

## 5. Circuit Breakers

### AI Governance Service Circuit Breaker

The AI governance service (OpenAI API calls) is critical for risk narrative generation but non-essential for core operations. Implement circuit breaker to prevent cascading failures.

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Consecutive failures before open
  successThreshold: number;     // Consecutive successes before closed
  timeout: number;              // Time in half-open state (ms)
}

class AIServiceCircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  async callAIService(prompt: string): Promise<string> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > 60000) {
        // Try to recover after 1 minute
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        // Return fallback (local risk templates)
        return this.getFallbackNarrative();
      }
    }

    try {
      const result = await this.callOpenAIAPI(prompt);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 5) {
      this.state = 'open';
      this.failureCount = 0;
    }
  }

  private getFallbackNarrative(): string {
    // Return pre-built risk narrative templates (no API call)
    return "Risk exposure: High. Immediate remediation recommended.";
  }
}
```

**Fallback Behavior**: If circuit is open, return local risk templates (pre-computed risk narratives) instead of calling OpenAI.

---

## 6. Per-Tenant Rate Limiting

Implement token bucket algorithm to prevent noisy neighbor problem (one tenant consuming all resources).

```typescript
interface RateLimitConfig {
  tier: 'starter' | 'professional' | 'enterprise';
  requestsPerSecond: number;
  burstCapacity: number;
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  starter: { tier: 'starter', requestsPerSecond: 10, burstCapacity: 50 },
  professional: { tier: 'professional', requestsPerSecond: 100, burstCapacity: 500 },
  enterprise: { tier: 'enterprise', requestsPerSecond: 1000, burstCapacity: 5000 }
};

class TokenBucketRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  isAllowed(tenantId: string, tierLimit: RateLimitConfig): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(tenantId);

    if (!bucket) {
      bucket = { tokens: tierLimit.burstCapacity, lastRefill: now };
      this.buckets.set(tenantId, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * tierLimit.requestsPerSecond;
    bucket.tokens = Math.min(
      bucket.tokens + tokensToAdd,
      tierLimit.burstCapacity
    );
    bucket.lastRefill = now;

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

// Middleware
app.use((req, res, next) => {
  const tenantId = req.user.tenantId;
  const tierLimit = TIER_LIMITS[req.user.tier];
  const limiter = new TokenBucketRateLimiter();

  if (!limiter.isAllowed(tenantId, tierLimit)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 1
    });
  }

  next();
});
```

---

## 7. Noisy Neighbor Mitigation

### Per-Tenant Resource Quotas (Kubernetes)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota-acme
  namespace: acme-prod
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: ["tenant-acme"]
```

### Priority Queues for Async Jobs

```typescript
interface Job {
  id: string;
  tenantId: string;
  priority: 'high' | 'normal' | 'low';
  createdAt: number;
  handler: () => Promise<void>;
}

class PriorityJobQueue {
  private queues = {
    high: [] as Job[],
    normal: [] as Job[],
    low: [] as Job[]
  };

  enqueue(job: Job) {
    this.queues[job.priority].push(job);
  }

  dequeue(): Job | null {
    // High priority: 50%
    // Normal priority: 30%
    // Low priority: 20%
    const random = Math.random();

    if (random < 0.5 && this.queues.high.length > 0) {
      return this.queues.high.shift() || this.dequeue();
    }
    if (random < 0.8 && this.queues.normal.length > 0) {
      return this.queues.normal.shift() || this.dequeue();
    }
    if (this.queues.low.length > 0) {
      return this.queues.low.shift() || this.dequeue();
    }

    return null;
  }
}
```

---

## 8. Multi-Region Considerations

### Data Residency

Customers specify data residency region at signup:
- **US**: AWS us-east-1 (N. Virginia)
- **EU**: AWS eu-west-1 (Ireland) + GDPR compliance
- **APAC**: AWS ap-southeast-1 (Singapore)

All data (PostgreSQL, S3, Redis) stored in customer's specified region.

### Cross-Region Replication

**Read Replicas**: Async PostgreSQL read replicas in secondary regions (for disaster recovery)
**S3 Replication**: Cross-region replication for document storage (durability, not performance)
**Redis**: Primary-replica replication within region; no cross-region cache replication

---

## 9. Disaster Recovery Strategy

### Architecture: Active-Passive Failover

**Active Region** (Primary): US-East-1
- All writes go to primary database
- All reads from primary (strong consistency)

**Passive Region** (Secondary): US-West-2
- Read-only replica database (RPO 1 hour)
- Standby K8s cluster (inactive)
- Cached artifacts in S3 (synced hourly)

### Failover Procedure

**Trigger**: Primary region ALB unhealthy for >5 minutes
**Automated Actions**:
1. DNS failover (Route53): Direct traffic to secondary region
2. Promote read replica to primary (RDS)
3. Spin up K8s pods in secondary cluster
4. Restore cache from backup
5. Alert ops team (PagerDuty)

**Time**: 10-15 minutes (mostly database promotion + DNS propagation)
**Impact**: Users may see stale data (up to 1 hour old); new writes unavailable during promotion

**RTO/RPO**:
- **RTO**: 4 hours (manual DNS revert + primary region recovery)
- **RPO**: 1 hour (backup sync interval)

### Backup & Restore Testing

- **Backup Frequency**: Continuous transaction logs + daily snapshots
- **Retention**: 30 days hot, 7 years cold (Glacier)
- **Monthly Drill**: Restore backup to test cluster; verify data integrity
- **Incident Log**: All restores logged with reason + approval

---

## 10. Deployment Checklist

```markdown
# Pre-Deployment
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan (Snyk) clear
- [ ] Performance tests show <5% latency increase
- [ ] Database migrations tested in staging
- [ ] Feature flags set correctly (kill-switches ready)
- [ ] Runbook reviewed by on-call engineer
- [ ] Rollback procedure tested

# Deployment
- [ ] Blue-green: 10% canary (2-3 pods)
- [ ] Wait 5 minutes: monitor error rate, latency
- [ ] 50% canary (10-15 pods)
- [ ] Wait 5 minutes: monitor + customer spot-checks
- [ ] 100% rollout (30 pods)
- [ ] Post-deploy validation (smoke tests)

# Post-Deployment (24h monitoring)
- [ ] Error rate normal (<0.1%)
- [ ] Latency p95 <200ms
- [ ] No customer incidents
- [ ] Database performance healthy
- [ ] Logs flowing to SIEM
```

---

## 11. Scaling Metrics Dashboard

Key metrics to monitor:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Pod Replicas | 3-30 | Auto-scale |
| Worker Pod Replicas | 1-10 | Auto-scale |
| Request Rate | <1000/s per pod | >1500/s per pod |
| p95 Latency | <200ms | >500ms |
| Error Rate | <0.1% | >1% |
| Database Connection Pool | <20 | >25 |
| Cache Hit Ratio | >80% | <60% |
| Disk Usage (S3) | Monitored | >90% quota |

**Next Review**: 2026-06-24
