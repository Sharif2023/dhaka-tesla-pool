# Dhaka Tesla Pool
## Share a seat. Split the fare. Survive Dhaka traffic.

---

## 1. The Banani Rush-Hour Story

8:41 AM, Banani Road 11. Jashim is leaning against Bullet, his three-seat, battery-powered, entirely unaffiliated "Tesla." Nusrat, already late, books a ride to Mohakhali. Two minutes later a total stranger named Rafiq books almost the same route to Gulshan 1. The app now has to figure out, in about a second, whether these two can share a seat, split the fare fairly, and survive a ten-minute ride without any of it getting weird. Then Shirin tries to grab the last seat thirty seconds later, and things get properly interesting. Jashim just wants to know who's actually riding and when he can go. Everyone else just wants to get where they're going, pay a fair price, and not accidentally make a new friend.

Steal this cast for your seed data and demo, or bring your own - just be consistent about it. Either way, spare the evaluator another user1/driver1; nobody's ever been charmed by a user named user1.

---

## 2. The Product Problem

Nusrat wants to get from Banani to Mohakhali. Rafiq wants to get from Banani to Gulshan 1. Jashim's Bullet has three seats. Passengers should be able to request a ride and, when it makes sense, share a Tesla with someone else. The driver needs to see who's assigned to the ride and what stage it's at. Each passenger needs to see their own fare and their own status, not anyone else's. And once a ride wraps up, the system should hold onto enough history to explain exactly what happened, in case anyone asks later.

---

## 3. Your Mission: Build the MVP

Build an MVP around three actors: Passenger (Nusrat, Rafiq, Shirin), Driver/Tesla (Jashim, Bullet), and Ride/Pool.

### Passenger
- Sign up/in
- Request ride: pickup, destination, seats
- See estimated fare
- Track status: waiting -> matched -> in progress -> completed/cancelled
- View history; cancel while valid

### Driver / Tesla
- Sign in; go online/offline
- Own a Tesla with fixed capacity
- See relevant requests; accept a ride/pool
- Mark arrival, start, complete trip
- See passengers/seats and ride history

### Pool / Ride Split
- Multiple requests may share one Tesla
- Occupied seats never exceed capacity
- Each passenger gets an individual fare
- Clear lifecycle; obvious pool membership

### Suggested lifecycle:
REQUESTED -> MATCHED/ACCEPTED -> DRIVER_ARRIVED -> STARTED -> COMPLETED (+ CANCELLED)

---

## 4. Keeping Geography Simple

Keep it simple - a predefined list of Dhaka areas (Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara, etc.), plain lat/long points, or a lightweight free map. Invent and document a matching rule (e.g. same pickup zone or compatible routes).

---

## 5. Fare Model - Keep It Understandable

passengerFare = baseFare + distanceCharge - poolDiscount

Explain how you store money (integer paisa/poysha vs. decimal) and why. Payment: Cash or simulated TeslaPay wallet - no real gateway needed.

---

## 6. Technical Scope & Mandated Stack

### Frontend: React or Next.js (App Router recommended)
### Backend: Node.js (Express, NestJS, Fastify, or other - justify the pick)
### Database: Candidate choice (Relational store recommended)
### Other tooling: ORM, validation, auth, test framework, hosting - all justified in README.

---

## 7. Technology Choice & Justification

For every non-mandated choice, README needs: what you picked and realistic alternatives; why it fits a ride-pooling MVP specifically; what would make you switch later.

---

## 8. AI Usage Policy - Yes, AI Is Allowed

Use ChatGPT, Claude, Copilot, Cursor, documentation, Stack Overflow, or other legitimate tools - do not hide their use. README AI Usage section required.

---

## 9. Architecture First

Include an architecture diagram (Mermaid/Excalidraw/draw.io/image) showing Browser -> Next.js/React -> Node.js API -> Database, plus an ERD. Do not introduce microservices, Kafka, Kubernetes, Redis, or queues just to look advanced.

---

## 10. Git Workflow - Part of the Assessment

Long-lived branches: master, pre-release, and release/<version>, plus feature/* branches.
Flow: feature branch -> master -> pre-release -> release/v1.0.0

---

## 11. Commit Message Rules

Use <type>(<scope>): <short description> (feat/fix/refactor/test/docs/chore/build).

Examples:
- feat(auth): add passenger login endpoint
- feat(pool): enforce Bullet's seat capacity
- fix(pool): prevent overbooking available seats
- build(docker): add compose setup for api and postgres

---

## 12. README, Testing, Concurrency & Bonus

### Testing should cover:
- Bullet's capacity can never be exceeded
- Invalid state transitions are rejected
- Nusrat's and Rafiq's pooled fares calculate correctly
- Users can't modify another user's ride
- Cancellation rules hold
- Two concurrent requests can't corrupt pool capacity

### The concurrency problem:
Bullet has 1 seat left. Nusrat and Shirin both try to claim it at nearly the same instant.

### Bonus - "If Oi Tesla Goes Viral":
Scale to 1M passengers and 100k drivers - load balancing, horizontal scaling, DB indexing/read replicas, caching, geospatial search, queues/events, real-time communication, rate limiting, idempotency, observability.

---

## 13. Six-Minute Final Video

- 0:00-1:00 understanding of the problem
- 1:00-3:00 how you engineered it (architecture, backend, frontend, database, ride/pool lifecycle)
- 3:00-6:00 product tour (passenger flow, driver flow, shared-Tesla/pooling, fare/status)

---

## 14. Submission Checklist

- Public/evaluator-accessible repo with working MVP
- Docker setup, .env.example, no secrets committed
- Migrations and seed/demo data using story cast
- Architecture diagram and ERD
- master / pre-release / release/v1.0.0 branches with meaningful commit history
- Tests for important behavior, self-explanatory README
- Six-minute video link, AI Usage section, viral-scale bonus

---

## 15. What We Will Evaluate

| Dimension | What It Covers |
|-----------|----------------|
| Product | Understood the problem, sensible assumptions |
| Process | Followed the instructions, git engineering, traceability |
| Backend / DB | API/state/validation design; modeling, constraints, integrity |
| Frontend | Correct flows/states, integration, maintainability |
| Docker / Deploy | Runs reliably elsewhere; shipped, not just coded |
| Testing / Docs | Tested what's risky; another engineer can operate it |
| Ownership | Can explain, defend, and change your own code |

---

## 16. What NOT to Do

- Pay for infrastructure/services
- Commit API keys, passwords, tokens, or .env secrets
- Submit a single giant "initial commit"
- Push all feature development directly to master
- Add technologies only to look impressive
- Polish animations while core data integrity is broken
- Hide AI usage
- Use generic placeholders (user1/driver1)

---

## 17. Assumptions Are Allowed

When something is unclear: make a reasonable assumption, document it, implement it consistently.

---

## 18. Why the Details Matter

Keep the cast consistent. Git history tells us how you got there. Be ready to talk through your own choices.

---

## 19. Final Note From RoBenDevs

Understand -> Design -> Build -> Commit -> Test -> Ship -> Explain -> Debug -> Change

Good luck, Chief Tesla Engineer.
