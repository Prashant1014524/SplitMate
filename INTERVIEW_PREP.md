# 🎓 sPLIT: Final Year Project & Technical Interview Master Guide

This document is your **complete defense guide** for college project viva, presentations, and technical job interviews.

---

## 🏗️ 1. System Architecture Overview

```
 [ React Frontend (Vite + Tailwind) ] (Port 3000)
                  │
                  │ REST API Calls with JWT (Bearer Token)
                  ▼
 [ Node.js + Express Backend ] (Port 5000)
    ├── Middlewares: Auth (JWT), ErrorHandler, CORS
    ├── Controllers: Auth, Groups, Expenses, Settlements
    ├── Services:
    │    ├── Debt Simplification Algorithm (O(N log N))
    │    └── Cache Service (Redis Cache-Aside Pattern)
    ▼                                 ▼
[ PostgreSQL / Prisma ORM ]      [ Redis Cache (Upstash) ]
(ACID Transactions, Relational)  (Sub-5ms Balance Lookups)
```

### Folder Structure (Clean Layered Architecture)
```
sPLIT/
├── src/                    (React Frontend SPA)
│   ├── components/         (Navbar, Sidebar, Modals)
│   ├── pages/              (Dashboard, Groups, PersonalExpenses, Analytics, Auth)
│   ├── context/            (Global App Context)
│   └── utils/              (Client-side utilities)
│
├── server/                 (Node.js REST API Backend)
│   ├── prisma/             (schema.prisma & SQLite/PostgreSQL migrations)
│   ├── src/
│   │   ├── config/         (Database singleton & environment)
│   │   ├── controllers/    (HTTP Request handlers)
│   │   ├── middlewares/    (JWT authentication & error handlers)
│   │   ├── routes/         (API endpoint mappings)
│   │   ├── services/       (Greedy Split Engine & Redis Cache)
│   │   └── index.js        (Express Server bootstrap)
│   └── package.json
└── INTERVIEW_PREP.md       (This guide)
```

---

## 🧮 2. The Debt Simplification Algorithm

### Problem Statement
In a shared group of $N$ friends, if each person pays for random items, there could be up to $\frac{N(N - 1)}{2}$ chaotic cross-payments between each other.
* E.g., for 4 members: up to 6 different cross-transactions.
* For 10 members: up to 45 cross-transactions.

### Solution: Greedy Min-Cost Flow
1. **Net Balance Calculation**:
   $$\text{Net Balance}_i = \sum \text{Paid By } i - \sum \text{Owed By } i$$
2. Separate members into **Creditors** ($\text{Net} > 0$) and **Debtors** ($\text{Net} < 0$).
3. **Sort** both arrays descending by absolute amount.
4. Greedily match the largest debtor with the largest creditor. The payment amount is:
   $$\text{Payment} = \min(|\text{Debtor Balance}|, \text{Creditor Balance})$$
5. Update remaining balances and repeat until everyone is settled.

### Time & Space Complexity
* **Time Complexity**: $\mathcal{O}(N \log N)$ due to sorting $N$ members. Matching takes $\mathcal{O}(N)$.
* **Space Complexity**: $\mathcal{O}(N)$ to store net balances and transaction lists.
* **Guarantee**: Resolves all group debts in at most $N - 1$ transactions!

---

## ⚡ 3. The Redis Cache-Aside Pattern (The 40% Speedup)

In group expense applications, users check group balances frequently (Read-Heavy), but add expenses only occasionally (Write-Infrequent).

### Cache-Aside Lifecycle:
1. **Read Request** (`GET /api/groups/:id/balances`):
   * Backend checks Redis key `group:balances:{groupId}`.
   * **Cache Hit**: Data returned directly from memory in **<5 milliseconds** (zero database queries!).
   * **Cache Miss**: Backend runs the SQL aggregation, runs the Debt Simplification algorithm, writes the result to Redis with a 5-minute TTL (`EX 300`), and returns the response.
2. **Write Invalidation** (`POST /api/expenses`, `POST /api/settlements`):
   * Whenever a new expense is logged or a debt settled, the backend invalidates the cache key:
     `await cacheService.del("group:balances:" + groupId)`
   * Next read fetches fresh data from PostgreSQL and warms the cache again.

---

## 🔒 4. Database Transactions (ACID Properties)

When an expense is split among 4 users, **multiple database writes** must succeed together:
1. `INSERT INTO expenses ...` (1 record)
2. `INSERT INTO expense_splits ...` (4 records)

In `server/src/controllers/expenseController.js`, we wrap this in `prisma.$transaction`:
* **Atomicity**: If inserting the splits fails (e.g., database timeout or network blip), the expense row is automatically **rolled back**. No half-saved corrupt data can ever exist.
* **Consistency**: Balances and split percentages always sum up to the total expense amount.

---

## 🎯 5. Top 10 Viva & Interview Questions (Verbatim Winning Answers)

### Q1: "What is the tech stack of your project and why did you choose it?"
> **Answer**: *"I used the PERN-style modern stack: React with Tailwind CSS on the frontend for a fast, responsive user interface, Node.js with Express for the REST API backend, PostgreSQL with Prisma ORM for relational data integrity, and Redis for high-speed caching. This stack provides complete type-safety, ACID transactional guarantees, and horizontal scalability."*

### Q2: "Why PostgreSQL instead of MongoDB?"
> **Answer**: *"An expense tracking and splitting application is fundamentally relational and financial. Expenses belong to groups, groups have members, and expenses have individual splits. PostgreSQL provides relational foreign key constraints (`ON DELETE CASCADE`), ACID transactions for multi-row writes, and composite indexing, preventing data anomalies that could easily occur in non-relational databases like MongoDB."*

### Q3: "How does your debt simplification algorithm work?"
> **Answer**: *"It uses a greedy bipartite matching algorithm. First, it computes the net balance of every member ($\text{Paid} - \text{Owed}$). It then partitions users into creditors and debtors and sorts them descending by amount. At each step, it matches the largest debtor with the largest creditor to eliminate multi-party debt chains (e.g., A owes B, B owes C $\rightarrow$ A pays C directly). This reduces the total number of transactions to at most $N-1$."*

### Q4: "What is the time complexity of the debt simplification?"
> **Answer**: *"$\mathcal{O}(N \log N)$ where $N$ is the number of members in the group, dominated by the sorting of debtors and creditors. The greedy two-pointer matching runs in linear time $\mathcal{O}(N)$."*

### Q5: "How does authentication work?"
> **Answer**: *"We use stateless JWT (JSON Web Token) authentication. When a user registers or logs in, their password is verified against an encrypted bcrypt hash (salt rounds = 10). Upon success, the server signs a JWT containing the user ID with an expiration of 7 days. The frontend passes this token in the `Authorization: Bearer <token>` header, which our custom Express middleware validates before granting access to protected routes."*

### Q6: "Why did you use Redis, and what is the Cache-Aside pattern?"
> **Answer**: *"Group balance calculations require multi-table joins across `expenses`, `expense_splits`, and `settlements`. Instead of recalculating this on every page refresh, we use the Cache-Aside pattern with Redis. The server checks Redis first; if present, it returns immediately in under 5ms. On writes (like adding an expense or settlement), the server automatically deletes the group's Redis key to prevent stale reads."*

### Q7: "How do you handle concurrent expense additions or settlements?"
> **Answer**: *"We use PostgreSQL database transactions (`prisma.$transaction`). The expense record and all member split rows are wrapped in an atomic transaction block. If any step fails or violates a constraint, the entire transaction rolls back, preventing race conditions or partial writes."*

### Q8: "How does your project achieve per-user data isolation?"
> **Answer**: *"Authorization is enforced at both the database and middleware layers. Every request's JWT is verified to extract `req.user.id`. SQL queries strictly filter by `where: { userId }` or check that `req.user.id` is an active member in `group_members`. A user can never read or mutate groups they do not belong to."*

### Q9: "Why did you use Prisma ORM?"
> **Answer**: *"Prisma provides a declarative schema (`schema.prisma`), automatic migration management, and auto-generated type-safe database queries. It eliminates SQL injection vulnerabilities through parameterized queries and makes database transitions between local dev and cloud PostgreSQL seamless."*

### Q10: "How would you scale this app to 1 million daily active users?"
> **Answer**: *"1. Deploy stateless Node.js instances behind an AWS Application Load Balancer (ALB).  
2. Implement read replicas in PostgreSQL for heavy read queries with connection pooling (e.g., PgBouncer).  
3. Use a distributed Redis cluster for caching and session management.  
4. Offload asynchronous tasks (like email invitations and monthly budget reports) to a message queue like BullMQ or AWS SQS."*
