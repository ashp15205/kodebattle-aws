# ⚔️ KodeBattle: Competitive 1v1 Algorithm Arena

![KodeBattle Banner](https://img.shields.io/badge/Platform-AWS_Cloud-FF9900?style=for-the-badge&logo=amazonaws) ![Next.js](https://img.shields.io/badge/Framework-Next.js_14-black?style=for-the-badge&logo=next.js) ![MySQL](https://img.shields.io/badge/Database-RDS_MySQL-4479A1?style=for-the-badge&logo=mysql)

**KodeBattle** is a high-performance, cloud-native competitive web application that pits developers against each other in real-time, 1v1 algorithmic quiz battles. Designed around maximum scalability and fairness, KodeBattle mimics the high-stakes, adrenaline-inducing environment of E-Sports for Computer Science logic.

---

## 🎯 Core Features

- **Ranked Matchmaking Protocol:** Real-time pairing engine that locates waiting opponents and instantly locks them into a high-stakes competitive lobby.
- **Strict Anti-Cheat Engine:** Battles enforce full-screen environments. Navigating away or clicking off the window triggers automated warnings. Three warnings result in absolute forfeit and rank deduction.
- **AWS S3 Object Streaming:** Profile avatars completely bypass the database and stream asynchronously through Amazon Simple Storage Service (S3).
- **Asymmetric Scoring System:** Accuracy is paramount. Ranked matches yield exactly **+1 point per correct answer**, and an overarching **+10 point bonus** is awarded strictly to the victor.
- **Dynamic Marketplace & Rewards:** Players convert their hard-earned competitive rankings into tangible utility (mock configurations like AWS text-books, Discord Nitro, and exclusive ML/AI test sets).
- **Offline / Practice Modes:** Safe, unranked environments to repeatedly drill computational logic and receive detailed breakdown metrics.

---

## 🛤️ User Flow

1. **Onboarding:** Secure registration utilizing `bcryptjs` password hashing and JWT issuance.
2. **Dashboard HQ:** A pristine, Apple-inspired Light UI dashboard showcasing live statistics (Wins, Win-Rate, Global Rank).
3. **The Queue:** Selecting "Battle" initiates an asynchronous polling heartbeat sequence hunting for an opponent.
4. **Collision & Versus Phase:** Opponent acquired. A 10-second cinematic build-up locks both clients.
5. **The Arena:** Both screens transition into locked Full-Screen mode. A synchronized 1.5-minute timer dictates the duration to solve 10 advanced Data Structure queries.
6. **Settlement:** Real-time algorithmic breakdown of the battle. Points distributed. Users gracefully rerouted to the Lobby.

---

## 🏛️ Cloud Architecture & Assignment Breakdown

This project was engineered specifically to fulfill 5 rigorous cloud-computing assignments by deploying across a highly available **AWS Infrastructure Model**.

* **Assignment 1: Virtual Machine Storage (Amazon EC2)** 
  The core Next.js engine operates across multiple Ubuntu Linux instances guaranteeing zero cold-start latency compared to serverless functions, maintaining steady matchmaking heartbeat connections.
* **Assignment 2: Cloud Storage (Amazon S3)** 
  To prevent network bloat during thousands of consecutive API calls, heavy user profile images are offloaded directly to `us-east-1` AWS buckets via specific IAM profiles.
* **Assignment 3: Relational Database (Amazon RDS MySQL)** 
  Using MySQL, the platform enforces strict ACID constraints during rapid matchmaking phases, ensuring two users can confidently dock into a match concurrently without race-condition collisions.
* **Assignment 4: Cloud Networking (VPC Security Groups)** 
  The production RDS Database is invisible to the internet (`0.0.0.0/0`), accepting packet ingress strictly from the precise Security ID attached to the localized EC2 machines.
* **Assignment 5: High Availability (Application Load Balancer)** 
  Dual EC2 deployments are mapped behind an ALB utilizing Round-Robin DNS algorithms to distribute global participant load dynamically, guaranteeing zero downtime if an availability zone collapses.

---

## 💻 Tech Stack

**Frontend Design:**
- Framework: Next.js (React 19)
- Styling: Custom Vanilla CSS (Apple-Inspired Light Theme Glassmorphism)
- Session Handling: JSON Web Tokens (Cookies & LocalStorage Backup)

**Backend Engine:**
- Engine: Next.js Native App Route Handlers (`/api/...`)
- Security: `bcryptjs`
- Matchmaking: Polled Async Locking Mechanisms

**Database & Cloud:**
- Local Instance: `DEMO_MODE=true` (In-Memory Arrays)
- Production DB: AWS RDS (MySQL2 Client)
- Production Objects: AWS SDK (`@aws-sdk/client-s3`)

---

## 🛠️ Installation & Setup

1. **Clone the Source Code**
   ```bash
   git clone https://github.com/ashp15205/kodebattle-aws.git
   cd kodebattle-aws
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file at the root.
   ```env
   # Toggle to TRUE to skip AWS configuration and test flawlessly in RAM:
   DEMO_MODE=true  

   # AWS S3 Configurations (Assignment 2)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   S3_BUCKET_NAME=your_bucket_name

   # AWS RDS Configurations (Assignment 3)
   DB_HOST=kodebattle-db.xxx.rds.amazonaws.com
   DB_PORT=3306
   DB_USER=admin
   DB_PASS=admin_password
   DB_NAME=kodebattle

   # Auth Security
   JWT_SECRET=super_secret_jwt_signature
   ```

4. **Initialize Local Server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` and dive into the Arena!
