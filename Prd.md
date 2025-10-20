# SnapRate - Product Requirements Document (PRD)

## Product Overview

**Product Name:** SnapRate  
**Tagline:** Review Businesses. Earn Money.

**Summary:**  
SnapRate is an incentive-driven platform where users (“Reviewers”) rate Nigerian businesses in exchange for rewards (airtime, coupons, cash). The platform ensures authenticity of reviews, provides business owners with customer engagement tools and analytics, and introduces a trusted agent network for business onboarding.

---

## Target Users & Roles

### 1. Reviewer (User)

-   Register with email and phone verification
-   Submit reviews (text, photo, video)
-   Earn NGN 50 per valid review
-   Recommend businesses (earn NGN 100 per approved business)
-   Share referral code/link (earn NGN 20 per verified referral)
-   Redeem rewards: airtime or coupons (minimum payout NGN 1000 for airtime)
-   View review/referral/earnings history
-   Claim public coupons; get assigned private coupons
-   Can apply to become an Agent

### 2. Business Owner

-   Register and verify a business (provide CAC documents, ID, utility bill, etc.)
-   Upload logo, 1-3 cover/product images
-   Create and manage business profile
-   Offer and manage coupons (public/private)
-   Create and manage promotions/campaigns (with start/end dates)
-   Invite and manage staff (role-based access via link/code)
-   Generate and scan coupons for redemptions
-   Track business analytics: visits, reviews, coupon activity

### 3. Agent

-   **Inherits all Reviewer capabilities**: Can review businesses, earn rewards, claim coupons, refer users
-   Apply via Reviewer account (requires ID verification)
-   Onboard new businesses (complete and submit verification docs)
-   Earn NGN 1000 per verified business onboarded (starting from 3rd business)
-   Track commissions and activity via dedicated dashboard
-   Add/manage bank accounts for payouts
-   Access to both Reviewer dashboard and Agent-specific features

### 4. Admin

-   Manage and approve Reviewer, Business, and Agent accounts/applications
-   Track and moderate platform activity, reviews, reports
-   Oversee metrics, disburse rewards, and handle flagged content
-   Cannot access or manage Super Admin accounts

### 5. Super Admin

-   Add, edit, or delete Admins
-   Configure system-wide settings (rewards, airtime API, etc.)
-   Full platform configuration and access

---

## Role Hierarchy & Dual-Role System

### Agent as Enhanced Reviewer

-   **Agents are Reviewers with additional privileges**
-   All Agents retain full Reviewer capabilities:
    -   Submit reviews and earn NGN 50 per valid review
    -   Claim public coupons and receive private coupons
    -   Share referral links and earn NGN 20 per verified referral
    -   Recommend businesses and earn NGN 100 per approved business
    -   Redeem rewards (airtime/coupons)
    -   Access to Reviewer dashboard and features
-   **Additional Agent privileges**:
    -   Onboard businesses and earn NGN 1000 commission (from 3rd business onward)
    -   Access to Agent dashboard with commission tracking
    -   Business verification and submission capabilities

### Role Progression

1. **Reviewer** → Basic platform access (review, earn, redeem)
2. **Agent** → Reviewer + business onboarding capabilities
3. **Business Owner** → Business management and coupon creation
4. **Admin** → Platform moderation and user management
5. **Super Admin** → Full system configuration

---

## User Journeys

### Reviewer

1. Register an account → verify phone/email
2. Browse/search business listings
3. Review or rate businesses (with optional photos/videos)
4. Earn rewards (displayed transparently in dashboard/ledger)
5. Redeem rewards (airtime, coupons; redemption methods configurable)
6. Refer friends (via unique referral link / code)
7. Optionally recommend or register a new business (as Agent)
8. (After approval) Onboard businesses to earn higher agent commissions

### Business Owner

1. Register account → verify email/phone/business identity
2. Upload required docs (CAC, utility bill, ID)
3. Create/edit a business profile (logo, description, images, contact, etc.)
4. Create public/private coupons, set restrictions
5. Launch and manage campaigns/promotions with date restrictions
6. Review business analytics and customer engagement metrics
7. Invite staff to manage the business

### Agent

1. Start as a Reviewer with full platform access (review, earn, redeem)
2. Apply for Agent status via Reviewer profile (ID upload required)
3. Register two verified businesses (auto-promotion to Agent)
4. Gain additional Agent capabilities while retaining all Reviewer functions
5. Onboard additional businesses (start earning from 3rd onward)
6. Manage commissions, payouts, and registration statuses

---

## Key Features & Functional Requirements

### General

-   Mobile-first web app (PWA-ready)
-   OAuth-based auth (email/phone verification)
-   Secure unique referral and registration links
-   Robust media support (image/video review uploads)
-   Dynamic system/roles and permission management

#### Dynamic Settings (via System Settings Table)

-   **Reward/Point System**: Admin can switch between NGN rewards and points system
-   **Review Limits**: Maximum reviews per day (anti-abuse protection)
-   **Review Requirements**: Minimum text length, mandatory photo/video settings
-   **Coupon Limits**: Value caps per business per period
-   **Business Sectors**: Dynamic categories (beyond hospitality and transport)
-   **Reward/point values** (can be adjusted by Super Admin)
-   **Partner reward providers** (airtime APIs, coupon partners)
-   **Subscription/feature levels**
-   **Anti-fraud Settings**: AI checks, manual review triggers

### Coupon System

#### Coupon Creation

-   Businesses can create up to 5 active coupons
-   9-character unique alphanumeric codes (e.g., K2X-PL7-YJ9)
-   Each coupon tied to a unique value; only one active coupon with the same value at once
-   Coupon restrictions configurable: one-time/multiple use, min spend, time/day, excludes other promotions, etc.
-   Types:
    -   **Public**: Any Reviewer can claim (first time without review; subsequently, review required)
    -   **Private**: Manually assigned to Reviewer by Business Owner

#### Reviewer Coupon Assignment

-   Each Reviewer has a unique 4-character User ID (randomized)
-   When claiming a coupon, UID is appended: e.g., K2X-PL7-YJ9-70BR
-   Coupons are only redeemable by their assigned user account

#### Coupon Redemption

-   Can redeem in-person or online
-   Coupon available as QR code + code
-   QR code links to verification page (no app required for staff)
-   Staff can alternatively verify via code entry at snaprate.com/verify
-   Redemption page shows coupon & user details, status (valid/invalid) & reason

### Verification & Trust

-   **Reviewer:** SMS/email verification (prevent spam/abuse)
-   **Business:** Valid director/authorized signatory ID + at least one business doc (CAC, tax clearance, address evidence). "Verified Address" status for additional address evidence.
-   **Agent:** ID upload required; promoted to agent after two verified registrations

---

## Rewards & Gamification

### Reviewer

-   Earn NGN 50 per valid review (admin-configurable)
-   Earn NGN 100 per approved business recommendation
-   Referral bonus: NGN 20 per verified user
-   Badges: Level up with more reviews (“Local Hero”, “Top Reviewer”)
-   Monthly leaderboards and daily streak bonuses (e.g., NGN 10 extra for 3+ reviews/day)
-   Weekly quests and tasks
-   “Spin the Wheel” for instant prizes post-review (optional feature)

### Agent

-   NGN 1000 for each verified onboarded business (from 3rd onward)
-   Milestone bonuses (e.g., NGN 10,000 for 10 onboarded businesses)
-   Ranking tiers, performance dashboard

### Business

-   “Verified Business” badge, top-rated badge
-   Option to buy engagement credits, boosted listings
-   Analytics dashboard with insights

---

## Monetization

-   Featured business listings (paid promotion)
-   Campaign/promotion boosts (fee-based)
-   Data Analytics as a Service (for businesses)
-   Commission on coupon redemptions
-   Partnership with business locations
-   Subscriptions (Snap Core, Premium, Executive tiers; see below)

---

## UI/UX Breakdowns

### 1. Landing Page

-   Hero image/CTA: "Review Businesses. Earn Money."
-   How It Works: Rate → Earn → Redeem (illustrated)
-   Screenshots/testimonials
-   Footer (About, Contact, Socials)

### 2. Reviewer Dashboard

-   Profile (avatar, rewards, referral code, nav tabs)
    -   My Reviews & rewards earned
    -   Referrals (count, earnings)
    -   Coupons (redeemable, expired, used)
    -   Rewards: redemption options
    -   Leaderboard access

### 3. Business Dashboard

-   Header: name, status, campaign balance
-   Sections: Overview (visits/reviews/redemptions), Manage Coupons, Promotions, Reviews, Staff

### 4. Agent Dashboard

-   **Dual Access**: Inherits all Reviewer dashboard features + Agent-specific features
-   Welcome banner, commission stats
-   Tabs:
    -   **Reviewer Features**: My Reviews, Referrals, Coupons, Rewards, Leaderboard
    -   **Agent Features**: Businesses Added, Payment Settings, Performance tracking

### 5. Admin/Super Admin Panel

-   User/business/agent overviews
-   Advanced approval tools
-   Abuse/reported content logs
-   Reward disbursement tracking
-   Admin management (Super Admin only)
-   System settings management

---

## Business Verification Process

-   **Required:** ID of director/signatory (National ID, passport, DL, voter card) **+**
    -   CAC Certificate / CAC Status or Biz Name Reg.
    -   OR FIRS Tax Clearance
    -   OR Utility bill, lease, or signage for address evidence
-   **"Verified Address"**: Utility bill, lease, or signage provided

### Business Profile

-   Logo (featured image), description (services/products)
-   1–3 cover/product images
-   Address, contact phone/email, website

---

## Coupon Management Workflow

1. **Business creates coupon** (fills form: value, restrictions, type, expiration)
2. **Coupon code** generated (unique 9-char alphanumeric)
3. **Reviewer claims coupon**
    - User ID appended
    - Coupon linked to Reviewer
    - Rules (First claim = no review; repeat claim needs new review)
4. **Reviewer redeems coupon** (shows QR or code)
5. **Business staff verify** via QR/link/code entry page

Safeguards:

-   Each code tied to user—can’t swap/forge
-   Coupon validation on claim and redemption

---

## Agent Requirements/Workflow

-   **Start as Reviewer**: Must have active Reviewer account with review history
-   Apply for Agent status (submit ID verification)
-   Must register 2 verified businesses (then auto-approved)
-   **Dual Role Access**: Retains all Reviewer capabilities while gaining Agent privileges
-   No commission on recommended businesses until full registration and approval
-   "Recommended" businesses appear with "Unverified" tag

---

## Business Registration Options

-   Owner signs up and registers business
-   Agent registers business (on behalf/with approval)
-   Reviewer or agent recommends business

---

## Guest/Discovery Pages

-   Business directory (grid/list, sortable, filterable)
    -   Display avg. rating, #reviews, badges
-   Business detail (profile, reviews, comments, coupons)
-   All public coupons page
-   Static pages: About Us, Careers (dynamic content), etc.

---

## Subscription Tiers

1. **Snap Core**

    - Business profile
    - Limited review requests/month
    - Basic coupons
    - Analytics dashboard
    - Email support

2. **Snap Premium**

    - Everything in Core
    - Advanced coupon options
    - Three promotions/campaigns
    - Priority listing
    - Enhanced analytics, team access (2 staff), chat support

3. **Snap Executive**
    - Everything in Premium
    - Unlimited review requests
    - Five promotions/campaigns
    - Featured placement
    - Dedicated account manager, API, early feature access
    - Unlimited staff/team access

**Subscriptions & limits managed via the platform’s settings table.**

---

## Technical/Architectural Requirements

-   Backend: RESTful API/GraphQL, secure user auth, scalable DB
-   Frontend: Responsive PWA
-   SMS & email integration
-   Unique code generation (secure random alphanumeric)
-   QR code generator and PDF export for coupons
-   File & media handling (photos/videos)
-   Audit logs for critical actions
-   Rich dashboard for all roles
-   System settings table (admin-editable: rewards, feature toggles, sector lists, etc.)

---

## Next Steps / Immediate Priorities

-   User registration with referral support
-   Multi-role auth with dual-role support (Reviewer/Agent, Business, Admin, Super Admin)
-   Reward transactions ledger (fully auditable)
-   QR coupon system—generation, linking, redemption
-   Dashboards build-out per role
-   Reward/coupon redemption (airtime API, coupon integration)
-   Admin content/user management panel

---

## Resolved Questions

✅ **Reward System**: Admin can switch between NGN rewards and points system modes  
✅ **Review Limits**: Maximum reviews per day configurable via admin settings (anti-abuse)  
✅ **Review Requirements**: Admin can set minimum text length and photo/video requirements  
✅ **Coupon Limits**: Value caps per business per period configurable via settings  
✅ **Business Sectors**: Dynamic categories beyond hospitality and transport, fully admin-configurable  
✅ **Anti-fraud Features**: AI checks and manual review triggers implemented

---

**End of PRD - SnapRate**
