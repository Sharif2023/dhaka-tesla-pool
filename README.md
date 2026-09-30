# ⚡ Dhaka Tesla Pool

> **Share a seat. Split the fare. Survive Dhaka traffic.**

A ride-pooling MVP for Dhaka's battery-powered "Tesla" three-wheelers. Built around Jashim, his Tesla "Bullet," and passengers Nusrat, Rafiq, and Shirin.

---

## 📺 Demo Video

> 🎬 [Watch 6-minute demo video](#) ← _Link after recording_

---

## 🚀 Live Demo

> 🌐 [https://dhaka-tesla-pool.vercel.app](#) ← _After deployment_

**Demo credentials** (all use password: `Tesla@2024`):

| Role      | Name          | Phone            | Email                          |
|-----------|---------------|------------------|--------------------------------|
| 🚗 Driver  | Jashim Uddin  | +8801711000001   | jashim@dhakateslapool.com      |
| 🧑 Passenger | Nusrat Jahan | +8801811000002   | nusrat@example.com             |
| 🧑 Passenger | Rafiq Islam  | +8801911000003   | rafiq@example.com              |
| 🧑 Passenger | Shirin Akter | +8801611000004   | shirin@example.com             |

---

## 📋 Problem Statement

8:41 AM, Banani Road 11. Jashim leans against Bullet, his 3-seat electric Tesla. Nusrat books a ride to Mohakhali. Rafiq books to Gulshan 1. The app must decide in ~1 second if they can share, split the fare fairly, and get moving. Shirin tries to grab the last seat 30 seconds later.

**The engineering challenge:** pool matching, capacity enforcement, per-passenger fare isolation, concurrency-safe bookings, and a clear lifecycle — all in a system that Jashim (driver) and each passenger can independently understand.

---

## ✅ Features Implemented

### Passenger
- [x] Register / Login (JWT auth)
- [x] Request ride with pickup, destination, seats
- [x] Real-time fare estimate (solo vs pooled comparison)
- [x] Ride status tracking: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
- [x] View ride history with timeline / status events
- [x] Cancel ride (valid while not STARTED)
- [x] TeslaPay wallet (simulated)

### Driver / Tesla
- [x] Login, go Online / Offline
- [x] Bullet (Tesla) — 3 seats, capacity enforced
- [x] See active pools and pending requests
- [x] Accept pool → Mark arrived → Start → Complete
- [x] View per-passenger fare in each pool
- [x] Trip history with earnings summary

### Pool / Ride Sharing
- [x] Passengers in same zone auto-matched into one pool
- [x] Seat capacity never exceeded (DB-level enforcement)
- [x] Each passenger sees only their own fare
- [x] Complete audit trail (RideStatusHistory)
- [x] Pool lifecycle: OPEN → LOCKED → IN_PROGRESS → COMPLETED

---

## 🏗️ Architecture

```mermaid
graph LR
    Browser["🌐 Browser\n(Next.js App Router)"] -->|HTTPS / REST| API["⚙️ Node.js API\n(Express + TypeScript)"]
    API -->|Prisma ORM| DB[("🐘 PostgreSQL\n(Supabase / local)")]
    API -->|JWT| Auth["🔐 Auth\n(bcrypt + JWT)"]

    subgraph Frontend["Frontend — Next.js 15 (App Router)"]
        Browser
        Zustand["🗄️ Zustand\n(client state)"]
    end

    subgraph Backend["Backend — Express + TypeScript"]
        API
        Routes["📡 Routes\n(auth/rides/driver/pools)"]
        Controllers["🎮 Controllers"]
        Services["⚙️ Business Logic\n(fare calc, pool match)"]
    end
```

### ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER                        │  TESLA                          │
│  id (PK)                     │  id (PK)                        │
│  name, phone, email          │  driverId (FK→User)             │
│  passwordHash                │  name, licensePlate             │
│  role: PASSENGER|DRIVER      │  capacity (3 for Bullet)        │
│  createdAt                   │  status: OFFLINE|ONLINE|ON_TRIP │
└──────────────────┬───────────┴──────────────┬──────────────────┘
                   │                           │
              1:N (rides)                 1:N (pools)
                   │                           │
┌──────────────────▼────────────────────────────▼──────────────────┐
│  RIDE_REQUEST                │  POOL                            │
│  id (PK)                     │  id (PK)                         │
│  passengerId (FK→User)       │  teslaId (FK→Tesla)              │
│  poolId (FK→Pool)            │  status: OPEN|LOCKED|IN_PROGRESS │
│  pickupLocationId (FK)       │  seatsOccupied ≤ tesla.capacity  │
│  destLocationId (FK)         │  pickupZone (for matching)       │
│  seatsRequested              │  startedAt, completedAt          │
│  status: REQUESTED→COMPLETED │                                  │
│  baseFarePaisa               │  LOCATION                        │
│  distanceChargePaisa         │  id (PK)                         │
│  poolDiscountPaisa           │  name, zone, lat, lng            │
│  totalFarePaisa (INTEGER)    │                                  │
│  paymentMethod, paymentStatus│                                  │
└──────────────────┬───────────┴──────────────────────────────────┘
                   │
              1:N (history)
                   │
┌──────────────────▼──────────────────┐
│  RIDE_STATUS_HISTORY                │
│  id, rideRequestId, fromStatus      │
│  toStatus, changedBy, createdAt     │
│  (audit trail — never deleted)      │
└─────────────────────────────────────┘
```

---

## 💰 Fare Model

**Formula (hand-verifiable):**
```
passengerFare = baseFare + distanceCharge − poolDiscount

baseFare       = 3000 paisa  (30 BDT flat)
distanceCharge = distance_m × 3 paisa/meter  (= 30 BDT/km)
poolDiscount   = 800 paisa   (8 BDT if pooled with another passenger)
```

**Nusrat's trip: Banani → Mohakhali (~1800m, pooled)**
```
distanceCharge = 1800 × 3 = 5400 paisa
fare = 3000 + 5400 − 800 = 7600 paisa = 76.00 BDT ✓
```

**Rafiq's trip: Banani → Gulshan 1 (~1100m, pooled)**
```
distanceCharge = 1100 × 3 = 3300 paisa
fare = 3000 + 3300 − 800 = 5500 paisa = 55.00 BDT ✓
```

**Money storage:** `INTEGER` in paisa (1 BDT = 100 paisa). No floating-point errors. Display divides by 100 with `.toFixed(2)`.

---

## 🔀 Pool Matching Rule

> **Passengers in the same zone, requesting from the same area, can share one Tesla pool.**

1. When a passenger requests a ride, we look for an **OPEN** pool in the same pickup zone
2. If available seats ≥ requested seats → join the pool (seat count incremented atomically)
3. If no open pool or no space → create a new pool assigned to an online Tesla
4. Driver "accepts" the pool (OPEN → LOCKED) → rides transition REQUESTED → MATCHED

---

## 🔒 Concurrency Handling

**The Shirin Problem:** Bullet has 1 seat left. Nusrat and Shirin both see it.

**MVP solution:** PostgreSQL transactions with an **optimistic update check**:
```sql
UPDATE Pool 
SET seatsOccupied = seatsOccupied + seatsRequested
WHERE id = ? AND seatsOccupied <= (capacity - seatsRequested)
```
If another request won the race, this update matches 0 rows → we fall through to create a new pool.

**At scale:** row-level locking (`SELECT FOR UPDATE`), database sequences, or Redis atomic increments for distributed deployments.

---

## 🛠️ Tech Stack

| Layer | Choice | Why | When to switch |
|-------|--------|-----|----------------|
| Frontend | Next.js 15 (App Router) | SSR, routing, TypeScript built-in | When needing more SPA-like feel → React + Vite |
| Backend | Express + TypeScript | Simple, explicit, wide ecosystem | NestJS when team > 3 and needs DI framework |
| Database | PostgreSQL | ACID transactions for capacity enforcement, relational pooling joins | Add read replicas at scale |
| ORM | Prisma | Type-safe, excellent migrations, Prisma Studio | Raw SQL for complex geospatial queries |
| Auth | JWT + bcrypt | Stateless, no session store needed for MVP | Add refresh tokens + Redis at scale |
| State (FE) | Zustand | Minimal boilerplate, persisted auth | Redux for very complex state |
| Tests | Jest + Supertest | Standard Node.js testing | Playwright for E2E |
| Containerization | Docker Compose | One-command local setup | Kubernetes at scale |
| Money | INTEGER (paisa) | Zero floating-point errors | Same — this is correct for any scale |

---

## 📁 Project Structure

```
dhaka-tesla-pool/
├── Task.md                    # Full challenge specification
├── docker-compose.yml         # One-command setup
├── .env.example               # Root env template
├── .gitignore
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full data model
│   │   └── seed.ts            # Jashim/Bullet/Nusrat/Rafiq/Shirin seed
│   ├── src/
│   │   ├── config/            # App + DB config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── routes/            # Express routers
│   │   ├── utils/             # Fare calc, logger, errors
│   │   └── __tests__/         # Jest tests
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/               # Next.js App Router pages
    │   │   ├── auth/          # Login, Register
    │   │   ├── passenger/     # Dashboard, Book, History
    │   │   └── driver/        # Dashboard, History
    │   ├── components/        # Shared UI components
    │   ├── lib/api.ts         # Typed API client
    │   └── store/authStore.ts # Zustand auth
    ├── Dockerfile
    └── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm

### Option 1: Docker (Recommended)
```bash
git clone <repo-url> dhaka-tesla-pool
cd dhaka-tesla-pool

# Copy env files
cp backend/.env.example backend/.env
cp .env.example .env

# Start everything (DB + API + Frontend)
docker compose up --build
```

App will be at: http://localhost:3000  
API at: http://localhost:4000  
API Health: http://localhost:4000/health

### Option 2: Manual
```bash
# 1. Start PostgreSQL
createdb dhaka_tesla_pool

# 2. Backend
cd backend
cp .env.example .env
# Edit .env with your DB credentials
npm install
npx prisma migrate dev --name init
npx prisma db seed  # ← seeds Jashim, Bullet, Nusrat, Rafiq, Shirin
npm run dev         # starts on port 4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev         # starts on port 3000
```

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
npm test

# With coverage
npm run test:coverage
```

**Test coverage includes:**
- ✅ Bullet's capacity can never be exceeded
- ✅ Invalid state transitions rejected
- ✅ Nusrat & Rafiq pooled fares calculate correctly (hand-verifiable)
- ✅ Users can't modify another user's ride
- ✅ Cancellation rules enforced
- ✅ Two concurrent requests can't corrupt pool capacity
- ✅ Auth: register, login, JWT validation

---

## 🔌 API Overview

```
POST   /api/auth/register          Register passenger or driver
POST   /api/auth/login             Login → JWT token
GET    /api/auth/me                Get current user profile

GET    /api/locations              List all Dhaka areas
GET    /api/rides/estimate         Fare estimate (solo + pool)
POST   /api/rides                  Request a ride (passenger)
GET    /api/rides                  Get my rides (passenger)
GET    /api/rides/:id              Get single ride
PATCH  /api/rides/:id/cancel       Cancel a ride

POST   /api/driver/online          Go online
POST   /api/driver/offline         Go offline
GET    /api/driver/requests        See active pools
POST   /api/driver/pool/:id/accept Accept a pool
PATCH  /api/driver/pool/:id/:action Advance trip (arrive|start|complete)
GET    /api/driver/history         Completed trips

GET    /api/pools/:poolId          Get pool status
GET    /api/users/profile          User profile
GET    /api/users/wallet           TeslaPay wallet

GET    /health                     Health check
```

---

## 🏢 Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool
JWT_SECRET=your-secret-key-change-in-prod
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX=100
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

> ⚠️ Never commit real `.env` files. Only `.env.example` and `.env.docker` (no real secrets) are committed.

---

## ⚖️ Key Decisions & Trade-offs

### Why REST over GraphQL?
REST maps cleanly to our resource model (users, pools, rides). GraphQL adds tooling overhead that's unnecessary for this MVP. If the mobile app has highly variable data needs, GraphQL becomes attractive.

### Why PostgreSQL over MongoDB?
Ride pooling is fundamentally relational: pools have many rides, rides belong to passengers, capacity is a numeric constraint. ACID transactions are critical for seat booking. A document DB would require application-level consistency.

### Why Prisma over raw SQL?
Type-safe queries eliminate entire categories of bugs. The migration system is clean. Downside: can't write complex raw SQL as easily — acceptable for MVP.

### Why no real-time (WebSockets)?
Polling every 8 seconds is sufficient for MVP and avoids significant infra complexity. The architecture comment in `app.ts` shows where Socket.io would go.

---

## 🔧 Known Limitations

- **No real-time push:** Clients poll every 8s. At scale, this would be WebSockets/SSE.
- **No geospatial routing:** Distances are haversine (as-crow-flies). Real routing uses map APIs.
- **Single server:** No horizontal scaling; DB is single instance.
- **No email/SMS notifications:** Passengers must refresh to see updates.
- **Pool matching is zone-based:** Simplified matching for MVP.

---

## 🚀 Viral Scale: "If Oi Tesla Goes Viral"

> *Scaling to 1M passengers and 100k drivers*

```mermaid
graph TB
    LB["⚖️ Load Balancer\n(nginx / ALB)"] --> API1["API Pod 1"]
    LB --> API2["API Pod 2"]
    LB --> API3["API Pod N..."]

    API1 & API2 & API3 --> Cache["⚡ Redis Cache\n(sessions, fare rates)"]
    API1 & API2 & API3 --> Queue["📨 Message Queue\n(BullMQ/SQS for matching)"]
    API1 & API2 & API3 --> Primary[("🐘 Postgres Primary")]

    Primary --> Replica1[("📖 Read Replica 1")]
    Primary --> Replica2[("📖 Read Replica 2")]

    Queue --> Matcher["🧮 Matching Service\n(geospatial R-tree)"]
    Matcher --> Primary

    API1 & API2 --> WSS["🔴 WebSocket Server\n(Socket.io cluster)"]
    WSS --> Redis["Redis Pub/Sub"]
```

**Key scaling concerns:**
1. **DB contention (seat booking):** Use `SELECT FOR UPDATE SKIP LOCKED` + connection pooling (PgBouncer). At extreme scale, atomic Redis counter with eventual DB sync.
2. **Ride matching:** Move to PostGIS for geospatial queries. R-tree index on driver locations. Background matching worker, not inline.
3. **Real-time:** Socket.io with Redis adapter for multi-node pub/sub. Drivers and passengers subscribe to pool events.
4. **Rate limiting:** Redis-based sliding window per IP/user, not in-process.
5. **Idempotency:** UUID per request in headers. Server deduplicates.
6. **Caching:** Fare rates, location data → Redis with 5min TTL.
7. **Observability:** OpenTelemetry traces, Prometheus metrics, structured JSON logs → Grafana.
8. **Security at scale:** API gateway (Kong), OAuth2, refresh tokens in HttpOnly cookies.

---

## 🤖 AI Usage

This project was built with assistance from **Claude (Anthropic)** and **GitHub Copilot**.

**Tools used for:**
- Initial architecture planning (structure, schema design decisions)
- Boilerplate reduction (Express route setup, Prisma query patterns)
- Test case brainstorming

**One accepted suggestion:**
> Using `INTEGER paisa` instead of `DECIMAL BDT` for money storage. Claude suggested this as a best practice — avoids all floating-point precision issues in fare calculations. Adopted wholesale.

**One rejected/changed suggestion:**
> Claude initially suggested using Prisma's `@default(autoincrement())` for IDs. Rejected in favor of `@default(cuid())` — CUIDs are more URL-safe and collision-resistant across distributed systems, better for external-facing IDs even at MVP stage.

---

## 🛤️ Git Workflow

Branches used:
- `master` — stable, merged features
- `feature/project-scaffold` — initial project structure
- `feature/passenger-auth` — auth system
- `feature/tesla-pooling` — pool matching + capacity
- `feature/driver-flow` — driver dashboard + lifecycle
- `feature/frontend-ui` — Next.js frontend
- `pre-release` — integration fixes + docs
- `release/v1.0.0` — submitted version

---

## 📈 Next Improvements

1. WebSocket real-time ride status updates
2. Driver ↔ Passenger in-app messaging
3. Rating system (post-ride)
4. Actual geospatial matching (PostGIS)
5. Push notifications (SMS via Twilio)
6. Trip receipt email
7. Surge pricing model

---

*Built for the RoBenDevs Dhaka Tesla Pool challenge. 🇧🇩*
