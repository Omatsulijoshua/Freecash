# 💸 FREE CASH — Paid-Action Marketplace Platform v2.0

> A production-ready, fullstack paid-action marketplace platform connecting advertisers with users completing legitimate microtasks, digital research, surveys, app testing, and user-generated content. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Key Features & Capabilities

### 👥 For Earner Users
- **Task Marketplace (`/tasks`):** Real-time task discovery filtered by category, reward amount, difficulty, and search terms.
- **Interactive Proof Submission (`/tasks/[id]`):** Step-by-step instructions, countdown timer, text proof & screenshot evidence submission.
- **Task History (`/dashboard/user/history`):** Complete tracking of pending, approved, and rejected task submissions.
- **Double-Entry Financial Wallet (`/dashboard/user/wallet`):** Immutable transaction ledger (`WalletTransaction`) showing real-time available and pending balances.
- **Bank Transfer Payouts (`/dashboard/user/withdraw`):** Automated NUBAN Nigerian commercial bank account name resolution and withdrawal payouts (₦1,000 minimum threshold).
- **Referral & Growth Engine (`/dashboard/user/referrals`):** Unique referral share links (`?ref=CODE`), attribution tracking, and ₦100 referral reward claims.
- **Help Desk & Tickets (`/dashboard/user/support`):** Interactive ticketing system for payment issues, task disputes, and account queries.
- **Personal Earnings Analytics (`/dashboard/user/analytics`):** Performance charts and downloadable CSV transaction ledger reports.

### 🏢 For Advertisers
- **8-Step Campaign Creation Wizard (`/dashboard/advertiser/campaigns/create`):** Real-time budget allocation, target country selection, and 20% platform commission calculation.
- **Verification Queue Workspace (`/dashboard/advertiser/verifications`):** Review user submission proof text and screenshot URLs, approve or reject with custom feedback.
- **7-Step Transactional Payout Pipeline:** Automatic ledger wallet credits upon submission approval.
- **Automated Webhooks (`/api/verifications/webhook`):** External verification integrations for automated campaign fulfillment.

### 🛡️ For Admins & Support Staff
- **Executive Analytics Overview (`/dashboard/admin`):** Platform Gross Merchandise Value (GMV), net revenue, user acquisition, and active campaigns.
- **User Directory & Wallet Adjustments (`/dashboard/admin/users`):** Account status management (`ACTIVE`, `FLAGGED`, `SUSPENDED`) and audited wallet balance adjustments.
- **Withdrawal Queue Review (`/dashboard/admin/withdrawals`):** Payout queue approval and refund controls with mandatory reason logging.
- **Real-Time Anti-Fraud Engine (`/dashboard/admin/fraud`):** Multi-signal risk scoring (0-100), duplicate proof & screenshot URL detection, disposable email flagging, and IP velocity tracking.
- **Dynamic System Settings (`/dashboard/admin/settings`):** Live configuration of platform commission %, minimum withdrawal limits, and referral bonuses.
- **Support Staff Desk (`/dashboard/support`):** Support ticket management queue with status filters and staff reply workspace.

---

## 📱 Mobile-First Responsive Design & Accessibility

- **Sticky Bottom Navigation Bar (`MobileNav.tsx`):** Quick touch access on mobile viewports (`< 768px`) for Tasks, Wallet, Referrals, and Profile.
- **Slide-Over Navigation Drawer:** Mobile menu for extended role navigation and quick links.
- **Touch-Optimized Controls:** Minimum 44px touch targets across all buttons, inputs, and controls.
- **Dark & Light Mode Theme Engine (`ThemeToggle.tsx`):** Persistent theme toggle supporting dark mode across all dashboard workspaces.
- **Security Hardening:** Edge rate limiting (Auth: 5 req/min, General: 60 req/min), XSS input sanitization, and HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 14 (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript (Strict Type Safety)
- **Database & ORM:** PostgreSQL + Prisma ORM (22 Relational Entities)
- **Authentication:** Edge JWTs (`jose`) + HTTP-Only Cookies + BCrypt Password Hashing
- **Styling:** Tailwind CSS + Lucide React Icons + Custom Theme Engine
- **Validation:** Zod Schema Validation
- **Testing & CI/CD:** Master Integration Test Runner (`prisma/verify-all.js`) + GitHub Actions (`.github/workflows/ci.yml`)

---

## 🔑 Pre-Configured Test Credentials

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Earner** | `earner@freecash.com` | `Password123!` | Discover tasks, submit evidence, earn rewards, withdraw to bank, refer friends |
| **Advertiser** | `advertiser@freecash.com` | `Password123!` | Create campaigns, fund deposits, review submission evidence queue |
| **Admin** | `admin@freecash.com` | `Password123!` | Executive KPIs, user directory, manual balance adjustments, fraud control panel |
| **Support Staff** | `support@freecash.com` | `Password123!` | Support operations queue, ticket resolution workspace, customer replies |

---

## 🚀 Quickstart & Setup Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Omatsulijoshua/Freecash.git
cd Freecash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/freecash?schema=public"
JWT_SECRET="freecash_production_jwt_secret_key_min32chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Migration & Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed initial categories, users, campaigns, and wallets
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing & Verification

Run the master end-to-end integration test runner:
```bash
node prisma/verify-all.js
```

Run Next.js production build check:
```bash
npm run build
```

---

## 📄 License
This project is open-source under the MIT License.
