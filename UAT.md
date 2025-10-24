# SnapRate - User Acceptance Testing (UAT) Guide

**Version**: 1.0  
**Date**: October 24, 2025  
**Platform**: SnapRate - Review Businesses. Earn Money.

---

## 📋 Overview

This document outlines test cases for the core features of SnapRate. Each section includes test scenarios, expected results, and pass/fail criteria.

**Test Environment**: http://localhost:3000

---

## 🎯 Testing Roles

| Role               | Access Level      | Primary Functions                                        |
| ------------------ | ----------------- | -------------------------------------------------------- |
| **Reviewer**       | User              | Submit reviews, claim coupons, earn rewards, refer users |
| **Business Owner** | Business          | Manage business profile, create coupons, view analytics  |
| **Agent**          | Enhanced Reviewer | Onboard businesses + all reviewer capabilities           |
| **Admin**          | Platform Manager  | Approve businesses, manage users, moderate content       |
| **Super Admin**    | Full Access       | Manage admins, configure platform settings               |

---

## 1️⃣ User Authentication & Registration

### Test Case 1.1: User Registration

**Objective**: Verify users can successfully register and create accounts

| Step | Action                                   | Expected Result                           | Status |
| ---- | ---------------------------------------- | ----------------------------------------- | ------ |
| 1    | Navigate to `/auth/signup`               | Registration form displays                | ⬜     |
| 2    | Enter valid email, name, password, phone | Form accepts input without errors         | ⬜     |
| 3    | Select state, city, and address          | Location fields populate correctly        | ⬜     |
| 4    | Submit registration form                 | Account created, redirect to verification | ⬜     |
| 5    | Check email for verification link        | Verification email received               | ⬜     |
| 6    | Click verification link                  | Email verified, account activated         | ⬜     |

**Pass Criteria**: User account created with status PENDING, unique referral code generated

---

### Test Case 1.2: User Sign In

**Objective**: Verify users can log in with valid credentials

| Step | Action                         | Expected Result                         | Status |
| ---- | ------------------------------ | --------------------------------------- | ------ |
| 1    | Navigate to `/auth/signin`     | Sign-in form displays                   | ⬜     |
| 2    | Enter valid email and password | Form accepts credentials                | ⬜     |
| 3    | Click "Sign In"                | User logged in, redirected to dashboard | ⬜     |
| 4    | Verify session persistence     | User remains logged in on page refresh  | ⬜     |

**Pass Criteria**: Successful authentication, correct role-based dashboard displayed

---

### Test Case 1.3: Google OAuth Sign In

**Objective**: Verify Google sign-in functionality

| Step | Action                      | Expected Result                   | Status |
| ---- | --------------------------- | --------------------------------- | ------ |
| 1    | Click "Sign in with Google" | Google OAuth popup appears        | ⬜     |
| 2    | Select Google account       | Account selected                  | ⬜     |
| 3    | Grant permissions           | User authenticated and redirected | ⬜     |
| 4    | Check user profile          | Profile created with Google data  | ⬜     |

**Pass Criteria**: User account created/linked via Google OAuth

---

## 2️⃣ Business Registration & Verification

### Test Case 2.1: Business Registration

**Objective**: Verify business owners can register businesses

| Step | Action                                        | Expected Result                      | Status |
| ---- | --------------------------------------------- | ------------------------------------ | ------ |
| 1    | Navigate to `/business/register`              | Registration form displays           | ⬜     |
| 2    | Enter business name, category, contact info   | Form accepts input                   | ⬜     |
| 3    | Enter business address (state, city, address) | Location fields populate             | ⬜     |
| 4    | Upload business logo (optional)               | Image uploads successfully           | ⬜     |
| 5    | Submit registration                           | Business created with PENDING status | ⬜     |

**Pass Criteria**: Business created, owner linked, verification status = PENDING

---

### Test Case 2.2: Business Verification Document Upload

**Objective**: Verify businesses can upload verification documents

| Step | Action                                                | Expected Result                   | Status |
| ---- | ----------------------------------------------------- | --------------------------------- | ------ |
| 1    | Navigate to `/business/verification`                  | Verification form displays        | ⬜     |
| 2    | Select Director ID type (National ID, Passport, etc.) | ID type selected                  | ⬜     |
| 3    | Upload Director ID image                              | Image uploads successfully        | ⬜     |
| 4    | Select CAC document type                              | Document type selected            | ⬜     |
| 5    | Upload CAC certificate/status report                  | Document uploads successfully     | ⬜     |
| 6    | Upload address evidence (utility bill/lease)          | Evidence uploads successfully     | ⬜     |
| 7    | Submit verification documents                         | Verification submitted for review | ⬜     |

**Pass Criteria**: All documents uploaded, verification status = PENDING approval

---

### Test Case 2.3: Admin Business Verification

**Objective**: Verify admins can approve/reject business verification

| Step | Action                            | Expected Result                     | Status |
| ---- | --------------------------------- | ----------------------------------- | ------ |
| 1    | Login as Admin                    | Admin dashboard displays            | ⬜     |
| 2    | Navigate to `/admin/verification` | Pending verifications list displays | ⬜     |
| 3    | Click on pending business         | Verification details displayed      | ⬜     |
| 4    | Review uploaded documents         | Documents viewable                  | ⬜     |
| 5    | Add admin notes                   | Notes saved                         | ⬜     |
| 6    | Approve verification              | Business status = VERIFIED          | ⬜     |
| 7    | Verify business owner notified    | Notification sent                   | ⬜     |

**Pass Criteria**: Business verification approved, status updated, owner notified

---

## 3️⃣ Review System

### Test Case 3.1: Submit Business Review

**Objective**: Verify users can submit reviews for businesses

| Step | Action                                              | Expected Result                     | Status |
| ---- | --------------------------------------------------- | ----------------------------------- | ------ |
| 1    | Navigate to business detail page `/businesses/[id]` | Business details displayed          | ⬜     |
| 2    | Click "Write Review" button                         | Review form modal opens             | ⬜     |
| 3    | Select rating (1-5 stars)                           | Rating selected                     | ⬜     |
| 4    | Enter review text (min 50 characters)               | Text entered, character count shows | ⬜     |
| 5    | Upload images (optional, max 3)                     | Images upload successfully          | ⬜     |
| 6    | Upload video (optional)                             | Video uploads successfully          | ⬜     |
| 7    | Submit review                                       | Review submitted, status = PENDING  | ⬜     |
| 8    | Verify reward created                               | NGN 50 reward added to user balance | ⬜     |

**Pass Criteria**: Review created with PENDING status, NGN 50 reward credited

---

### Test Case 3.2: Admin Review Moderation

**Objective**: Verify admins can moderate and approve reviews

| Step | Action                         | Expected Result                      | Status |
| ---- | ------------------------------ | ------------------------------------ | ------ |
| 1    | Login as Admin                 | Admin dashboard displays             | ⬜     |
| 2    | Navigate to `/admin/reviews`   | Pending reviews list displays        | ⬜     |
| 3    | Click on pending review        | Review details displayed             | ⬜     |
| 4    | Review content and media       | All content viewable                 | ⬜     |
| 5    | Approve review                 | Review status = APPROVED             | ⬜     |
| 6    | Verify business rating updated | Business average rating recalculated | ⬜     |
| 7    | Verify reviewer rewarded       | Reward status = active               | ⬜     |

**Pass Criteria**: Review approved, business rating updated, reviewer rewarded

---

### Test Case 3.3: Review with Comments

**Objective**: Verify users can comment on reviews

| Step | Action                                     | Expected Result                   | Status |
| ---- | ------------------------------------------ | --------------------------------- | ------ |
| 1    | Navigate to business with approved reviews | Reviews displayed                 | ⬜     |
| 2    | Click "Comment" on a review                | Comment form appears              | ⬜     |
| 3    | Enter comment text                         | Text entered                      | ⬜     |
| 4    | Submit comment                             | Comment posted under review       | ⬜     |
| 5    | Reply to existing comment                  | Reply nested under parent comment | ⬜     |

**Pass Criteria**: Comments and replies successfully posted and displayed

---

## 4️⃣ Coupon Management

### Test Case 4.1: Business Creates Public Coupon

**Objective**: Verify businesses can create public coupons

| Step | Action                                             | Expected Result                 | Status |
| ---- | -------------------------------------------------- | ------------------------------- | ------ |
| 1    | Login as Business Owner                            | Business dashboard displays     | ⬜     |
| 2    | Navigate to `/business/coupons`                    | Coupon management page displays | ⬜     |
| 3    | Click "Create Coupon"                              | Coupon creation form appears    | ⬜     |
| 4    | Enter coupon title and description                 | Text entered                    | ⬜     |
| 5    | Select coupon type (PUBLIC)                        | Type selected                   | ⬜     |
| 6    | Select value type (PERCENTAGE or FIXED_AMOUNT)     | Type selected                   | ⬜     |
| 7    | Enter coupon value                                 | Value entered                   | ⬜     |
| 8    | Set validity dates (from and until)                | Dates selected                  | ⬜     |
| 9    | Configure restrictions (min spend, max uses, etc.) | Restrictions configured         | ⬜     |
| 10   | Save coupon as DRAFT                               | Coupon saved with DRAFT status  | ⬜     |
| 11   | Activate coupon                                    | Status changed to ACTIVE        | ⬜     |
| 12   | Verify 9-character base code generated             | Code format: XXX-XXX-XXX        | ⬜     |

**Pass Criteria**: Public coupon created with unique base code, status = ACTIVE

---

### Test Case 4.2: User Claims Public Coupon

**Objective**: Verify users can claim available public coupons

| Step | Action                                          | Expected Result                                | Status |
| ---- | ----------------------------------------------- | ---------------------------------------------- | ------ |
| 1    | Login as Reviewer                               | Reviewer dashboard displays                    | ⬜     |
| 2    | Navigate to `/coupons`                          | Public coupons catalog displays                | ⬜     |
| 3    | Browse available coupons                        | Coupons from various businesses shown          | ⬜     |
| 4    | Click "Claim" on a coupon                       | Claim confirmation modal appears               | ⬜     |
| 5    | Confirm claim (first time - no review required) | Coupon claimed successfully                    | ⬜     |
| 6    | Verify user-specific code generated             | Code format: XXX-XXX-XXX-XXXX (base + user ID) | ⬜     |
| 7    | Navigate to "My Coupons"                        | Claimed coupon appears in user's list          | ⬜     |
| 8    | Try to claim another coupon from same business  | System prompts for review requirement          | ⬜     |

**Pass Criteria**: Coupon claimed, user-specific code generated, review requirement enforced

---

### Test Case 4.3: Coupon Verification & Redemption

**Objective**: Verify coupon verification and redemption process

| Step | Action                                                 | Expected Result                       | Status |
| ---- | ------------------------------------------------------ | ------------------------------------- | ------ |
| 1    | User navigates to claimed coupon                       | Coupon details with QR code displayed | ⬜     |
| 2    | Click "Show QR Code"                                   | QR code displays                      | ⬜     |
| 3    | Business staff scans QR code                           | Redirected to verification page       | ⬜     |
| 4    | Verification page displays coupon details              | Coupon valid/invalid status shown     | ⬜     |
| 5    | If valid, verify shows: user info, restrictions, value | All details correctly displayed       | ⬜     |
| 6    | Staff clicks "Redeem Coupon"                           | Redemption confirmation appears       | ⬜     |
| 7    | Enter order amount (if applicable)                     | Amount validated against minimum      | ⬜     |
| 8    | Confirm redemption                                     | Coupon marked as redeemed             | ⬜     |
| 9    | Verify user can't reuse single-use coupon              | Coupon shows as used                  | ⬜     |

**Pass Criteria**: Coupon successfully verified and redeemed, usage tracking accurate

---

### Test Case 4.4: Business Creates Private Coupon

**Objective**: Verify businesses can create and assign private coupons

| Step | Action                                      | Expected Result                    | Status |
| ---- | ------------------------------------------- | ---------------------------------- | ------ |
| 1    | Login as Business Owner                     | Business dashboard displays        | ⬜     |
| 2    | Create new coupon with type PRIVATE         | Private coupon created             | ⬜     |
| 3    | Navigate to "Assign Coupon"                 | User selection interface appears   | ⬜     |
| 4    | Search for user by email/name               | User search works                  | ⬜     |
| 5    | Select user and assign coupon               | Coupon assigned to specific user   | ⬜     |
| 6    | Verify user receives notification           | User notified of coupon assignment | ⬜     |
| 7    | Verify private coupon not in public catalog | Coupon not visible publicly        | ⬜     |

**Pass Criteria**: Private coupon created, assigned to user, not publicly visible

---

## 5️⃣ Rewards & Redemption

### Test Case 5.1: Earning Rewards

**Objective**: Verify users earn rewards for actions

| Step | Action                                 | Expected Result                    | Status |
| ---- | -------------------------------------- | ---------------------------------- | ------ |
| 1    | Submit approved review                 | NGN 50 credited to balance         | ⬜     |
| 2    | Refer new user (user verifies account) | NGN 20 credited to balance         | ⬜     |
| 3    | Recommend business (business verified) | NGN 100 credited to balance        | ⬜     |
| 4    | Navigate to `/reviewer/rewards`        | All rewards displayed with history | ⬜     |
| 5    | Check total balance                    | Balance = sum of all rewards       | ⬜     |

**Pass Criteria**: All rewards correctly credited and tracked

---

### Test Case 5.2: Airtime Redemption

**Objective**: Verify users can redeem rewards for airtime

| Step | Action                                 | Expected Result                      | Status |
| ---- | -------------------------------------- | ------------------------------------ | ------ |
| 1    | Navigate to reward redemption page     | Redemption options displayed         | ⬜     |
| 2    | Select "Airtime" option                | Airtime form appears                 | ⬜     |
| 3    | Check balance meets minimum (NGN 1000) | Validation checks minimum            | ⬜     |
| 4    | Enter phone number                     | Phone number validated               | ⬜     |
| 5    | Select amount (minimum NGN 1000)       | Amount selected                      | ⬜     |
| 6    | Confirm redemption                     | Redemption request created           | ⬜     |
| 7    | Verify balance deducted                | Balance reduced by redemption amount | ⬜     |
| 8    | Check redemption status                | Status = PENDING                     | ⬜     |

**Pass Criteria**: Redemption request created, balance deducted, status tracked

---

### Test Case 5.3: Referral System

**Objective**: Verify referral code generation and tracking

| Step | Action                            | Expected Result                       | Status |
| ---- | --------------------------------- | ------------------------------------- | ------ |
| 1    | Navigate to user profile          | Unique referral code displayed        | ⬜     |
| 2    | Copy referral link                | Link copied to clipboard              | ⬜     |
| 3    | Share link with new user          | New user receives link                | ⬜     |
| 4    | New user signs up using link      | Account created with referrer tracked | ⬜     |
| 5    | New user verifies account         | Referrer receives NGN 20 reward       | ⬜     |
| 6    | Check referral count in dashboard | Count incremented                     | ⬜     |

**Pass Criteria**: Referral tracked, reward credited upon verification

---

## 6️⃣ Agent System

### Test Case 6.1: Apply for Agent Status

**Objective**: Verify users can apply to become agents

| Step | Action                                 | Expected Result               | Status |
| ---- | -------------------------------------- | ----------------------------- | ------ |
| 1    | Login as Reviewer                      | Reviewer dashboard displays   | ⬜     |
| 2    | Navigate to Agent application          | Application form displays     | ⬜     |
| 3    | Fill out motivation, experience fields | Text entered                  | ⬜     |
| 4    | Upload ID document                     | Document uploads successfully | ⬜     |
| 5    | Submit application                     | Application status = PENDING  | ⬜     |
| 6    | Admin reviews application              | Admin can view application    | ⬜     |

**Pass Criteria**: Application submitted, pending admin approval

---

### Test Case 6.2: Agent Onboards Business

**Objective**: Verify agents can onboard businesses

| Step | Action                               | Expected Result                     | Status |
| ---- | ------------------------------------ | ----------------------------------- | ------ |
| 1    | Login as approved Agent              | Agent dashboard displays            | ⬜     |
| 2    | Navigate to "Onboard Business"       | Business registration form displays | ⬜     |
| 3    | Enter business details               | All fields filled                   | ⬜     |
| 4    | Upload verification documents        | Documents upload successfully       | ⬜     |
| 5    | Enter business owner details         | Owner info entered                  | ⬜     |
| 6    | Submit registration                  | Business registered by agent        | ⬜     |
| 7    | Admin verifies business              | Business status = VERIFIED          | ⬜     |
| 8    | Check agent earnings (3rd+ business) | NGN 1000 credited to agent          | ⬜     |

**Pass Criteria**: Business onboarded, agent credited after 3rd verified business

---

### Test Case 6.3: Agent Dual-Role Access

**Objective**: Verify agents retain reviewer capabilities

| Step | Action                         | Expected Result                 | Status |
| ---- | ------------------------------ | ------------------------------- | ------ |
| 1    | Login as Agent                 | Agent dashboard displays        | ⬜     |
| 2    | Submit business review         | Review submitted, NGN 50 earned | ⬜     |
| 3    | Claim public coupon            | Coupon claimed successfully     | ⬜     |
| 4    | Refer new user                 | Referral tracked                | ⬜     |
| 5    | Access agent-specific features | Agent dashboard accessible      | ⬜     |

**Pass Criteria**: Agent can perform all reviewer actions + agent actions

---

## 7️⃣ Business Dashboard & Analytics

### Test Case 7.1: Business Dashboard Overview

**Objective**: Verify business owners can view dashboard analytics

| Step | Action                  | Expected Result                       | Status |
| ---- | ----------------------- | ------------------------------------- | ------ |
| 1    | Login as Business Owner | Business dashboard displays           | ⬜     |
| 2    | View total visits       | Visit count displayed                 | ⬜     |
| 3    | View total reviews      | Review count and average rating shown | ⬜     |
| 4    | View active coupons     | Coupon count displayed                | ⬜     |
| 5    | View coupon redemptions | Redemption statistics shown           | ⬜     |

**Pass Criteria**: All key metrics accurately displayed

---

### Test Case 7.2: Business Profile Management

**Objective**: Verify businesses can edit their profiles

| Step | Action                          | Expected Result              | Status |
| ---- | ------------------------------- | ---------------------------- | ------ |
| 1    | Navigate to `/business/profile` | Profile edit form displays   | ⬜     |
| 2    | Update business description     | Changes saved                | ⬜     |
| 3    | Upload new logo                 | Image updated                | ⬜     |
| 4    | Upload service images (1-3)     | Images uploaded successfully | ⬜     |
| 5    | Update contact information      | Contact details updated      | ⬜     |
| 6    | Save changes                    | All changes persisted        | ⬜     |

**Pass Criteria**: Profile updates saved and reflected immediately

---

### Test Case 7.3: Business Analytics

**Objective**: Verify detailed analytics are available

| Step | Action                             | Expected Result             | Status |
| ---- | ---------------------------------- | --------------------------- | ------ |
| 1    | Navigate to `/business/analytics`  | Analytics page displays     | ⬜     |
| 2    | View visitor trends (last 30 days) | Chart displays visitor data | ⬜     |
| 3    | View review trends                 | Chart displays review data  | ⬜     |
| 4    | View coupon performance            | Coupon stats displayed      | ⬜     |
| 5    | Filter by date range               | Data filtered correctly     | ⬜     |
| 6    | Export analytics report            | CSV/PDF download successful | ⬜     |

**Pass Criteria**: Comprehensive analytics with accurate data and export functionality

---

## 8️⃣ Admin Panel

### Test Case 8.1: User Management

**Objective**: Verify admins can manage users

| Step | Action                                | Expected Result          | Status |
| ---- | ------------------------------------- | ------------------------ | ------ |
| 1    | Login as Admin                        | Admin dashboard displays | ⬜     |
| 2    | Navigate to `/admin/users`            | Users list displays      | ⬜     |
| 3    | Search for specific user              | Search returns results   | ⬜     |
| 4    | View user details                     | Full profile displayed   | ⬜     |
| 5    | Update user status (suspend/activate) | Status changed           | ⬜     |
| 6    | View user activity history            | Activity log displayed   | ⬜     |

**Pass Criteria**: Admin can view and manage all users

---

### Test Case 8.2: Business Moderation

**Objective**: Verify admins can moderate businesses

| Step | Action                          | Expected Result               | Status |
| ---- | ------------------------------- | ----------------------------- | ------ |
| 1    | Navigate to `/admin/businesses` | Business list displays        | ⬜     |
| 2    | Filter by verification status   | Filter works correctly        | ⬜     |
| 3    | View pending verifications      | Pending businesses shown      | ⬜     |
| 4    | Approve verified business       | Business status = VERIFIED    | ⬜     |
| 5    | Reject with notes               | Business rejected with reason | ⬜     |
| 6    | View business analytics         | Business metrics accessible   | ⬜     |

**Pass Criteria**: Admin can approve/reject and manage all businesses

---

### Test Case 8.3: Content Moderation

**Objective**: Verify admins can moderate reviews and reports

| Step | Action                            | Expected Result                   | Status |
| ---- | --------------------------------- | --------------------------------- | ------ |
| 1    | Navigate to `/admin/moderation`   | Reported content displays         | ⬜     |
| 2    | View reported reviews             | List of flagged reviews shown     | ⬜     |
| 3    | Review report details             | Report reason and content visible | ⬜     |
| 4    | Take action (approve/remove/flag) | Action applied successfully       | ⬜     |
| 5    | Add admin notes                   | Notes saved                       | ⬜     |
| 6    | Notify reporter of resolution     | Notification sent                 | ⬜     |

**Pass Criteria**: Admin can efficiently moderate and resolve reports

---

## 9️⃣ Super Admin Functions

### Test Case 9.1: Admin Management

**Objective**: Verify Super Admin can manage admin accounts

| Step | Action                       | Expected Result                | Status |
| ---- | ---------------------------- | ------------------------------ | ------ |
| 1    | Login as Super Admin         | Super Admin dashboard displays | ⬜     |
| 2    | Navigate to admin management | Admin list displays            | ⬜     |
| 3    | Send admin invitation        | Invitation email sent          | ⬜     |
| 4    | New admin accepts invitation | Admin account activated        | ⬜     |
| 5    | Update admin permissions     | Changes applied                | ⬜     |
| 6    | Remove admin access          | Admin role revoked             | ⬜     |

**Pass Criteria**: Super Admin can fully manage admin accounts

---

### Test Case 9.2: Platform Settings

**Objective**: Verify Super Admin can configure platform settings

| Step | Action                                | Expected Result                 | Status |
| ---- | ------------------------------------- | ------------------------------- | ------ |
| 1    | Navigate to `/admin/settings`         | Settings page displays          | ⬜     |
| 2    | Update review reward amount           | Value changed                   | ⬜     |
| 3    | Update referral reward amount         | Value changed                   | ⬜     |
| 4    | Update minimum redemption amount      | Value changed                   | ⬜     |
| 5    | Update business recommendation reward | Value changed                   | ⬜     |
| 6    | Save settings                         | All changes persisted           | ⬜     |
| 7    | Verify new values take effect         | New rewards use updated amounts | ⬜     |

**Pass Criteria**: Platform-wide settings configurable and immediately effective

---

## 🔟 Business Search & Discovery

### Test Case 10.1: Public Business Directory

**Objective**: Verify users can browse and search businesses

| Step | Action                          | Expected Result                 | Status |
| ---- | ------------------------------- | ------------------------------- | ------ |
| 1    | Navigate to `/businesses`       | Business directory displays     | ⬜     |
| 2    | View all businesses             | Grid/list of businesses shown   | ⬜     |
| 3    | Search by business name         | Search results filtered         | ⬜     |
| 4    | Filter by category              | Businesses filtered by category | ⬜     |
| 5    | Filter by location (state/city) | Businesses filtered by location | ⬜     |
| 6    | Sort by rating                  | Businesses sorted correctly     | ⬜     |
| 7    | Sort by most reviewed           | Businesses sorted correctly     | ⬜     |

**Pass Criteria**: Search and filtering work accurately

---

### Test Case 10.2: Business Detail Page

**Objective**: Verify business detail page displays correctly

| Step | Action                       | Expected Result                       | Status |
| ---- | ---------------------------- | ------------------------------------- | ------ |
| 1    | Click on a business          | Detail page displays                  | ⬜     |
| 2    | View business information    | Name, description, contact info shown | ⬜     |
| 3    | View business images         | Logo and service images displayed     | ⬜     |
| 4    | View business rating         | Average rating and review count shown | ⬜     |
| 5    | View business reviews        | All approved reviews listed           | ⬜     |
| 6    | View business coupons        | Public coupons displayed              | ⬜     |
| 7    | View business hours (if set) | Operating hours shown                 | ⬜     |

**Pass Criteria**: All business information accurately displayed

---

## 1️⃣1️⃣ Notifications & Communications

### Test Case 11.1: Email Notifications

**Objective**: Verify email notifications are sent correctly

| Test Scenario              | Expected Email           | Status |
| -------------------------- | ------------------------ | ------ |
| New user registration      | Verification email       | ⬜     |
| Review approved            | Notification to reviewer | ⬜     |
| Coupon claimed             | Notification to business | ⬜     |
| Coupon redeemed            | Notification to business | ⬜     |
| Business verified          | Notification to owner    | ⬜     |
| Agent application approved | Notification to agent    | ⬜     |
| Private coupon assigned    | Notification to user     | ⬜     |

**Pass Criteria**: All email notifications sent with correct content

---

## 1️⃣2️⃣ Security & Validation

### Test Case 12.1: Input Validation

**Objective**: Verify proper input validation across forms

| Test Area    | Invalid Input        | Expected Behavior       | Status |
| ------------ | -------------------- | ----------------------- | ------ |
| Email        | Invalid format       | Error message displayed | ⬜     |
| Password     | Too short (<8 chars) | Error message displayed | ⬜     |
| Phone        | Invalid format       | Error message displayed | ⬜     |
| Review text  | Less than min chars  | Error message displayed | ⬜     |
| Coupon value | Negative number      | Error message displayed | ⬜     |
| File upload  | Exceeds size limit   | Error message displayed | ⬜     |

**Pass Criteria**: All inputs properly validated with clear error messages

---

### Test Case 12.2: Authorization & Access Control

**Objective**: Verify role-based access control

| Test Scenario              | User Role      | Expected Result | Status |
| -------------------------- | -------------- | --------------- | ------ |
| Access business dashboard  | Reviewer       | 403 Forbidden   | ⬜     |
| Access admin panel         | Business Owner | 403 Forbidden   | ⬜     |
| Edit another user's review | Reviewer       | 403 Forbidden   | ⬜     |
| Create coupon              | Reviewer       | 403 Forbidden   | ⬜     |
| Manage admins              | Admin          | 403 Forbidden   | ⬜     |

**Pass Criteria**: Proper authorization checks prevent unauthorized access

---

## 📊 Success Criteria Summary

### Critical Features (Must Pass)

- ✅ User registration and authentication
- ✅ Business registration and verification
- ✅ Review submission and moderation
- ✅ Coupon creation and redemption
- ✅ Reward earning and tracking
- ✅ Admin moderation capabilities

### Important Features (Should Pass)

- ✅ Referral system
- ✅ Agent onboarding
- ✅ Business analytics
- ✅ Search and filtering
- ✅ Email notifications

### Nice-to-Have Features

- ✅ Advanced analytics
- ✅ Bulk operations
- ✅ Export functionality
- ✅ Real-time notifications

---

## 🐛 Bug Reporting Template

When reporting bugs during UAT, use this format:

```
**Bug ID**: UAT-[NUMBER]
**Test Case**: [Test Case Reference]
**Severity**: [Critical/High/Medium/Low]
**Description**: [Clear description of the issue]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Screenshots**: [Attach if applicable]
**Environment**: [Browser, OS, Device]
**Tested By**: [Your Name]
**Date**: [Test Date]
```

---

## 📝 UAT Sign-Off

### Test Completion

| Role           | Features Tested        | Pass Rate | Sign-Off   | Date     |
| -------------- | ---------------------- | --------- | ---------- | -------- |
| Reviewer       | Test Cases 1, 3, 5, 10 | \_\_%     | **\_\_\_** | \_\_\_\_ |
| Business Owner | Test Cases 2, 4, 7     | \_\_%     | **\_\_\_** | \_\_\_\_ |
| Agent          | Test Cases 6           | \_\_%     | **\_\_\_** | \_\_\_\_ |
| Admin          | Test Cases 8           | \_\_%     | **\_\_\_** | \_\_\_\_ |
| Super Admin    | Test Cases 9           | \_\_%     | **\_\_\_** | \_\_\_\_ |

### Overall UAT Status

- **Total Test Cases**: 48
- **Passed**: \_\_\_
- **Failed**: \_\_\_
- **Blocked**: \_\_\_
- **Pass Rate**: \_\_\_%

**UAT Approval**: ☐ Approved ☐ Conditional ☐ Rejected

**Approver Name**: **\*\*\*\***\_\_\_**\*\*\*\***  
**Signature**: **\*\*\*\***\_\_\_**\*\*\*\***  
**Date**: **\*\*\*\***\_\_\_**\*\*\*\***

---

## 📞 Support

For UAT questions or issues:

- **Email**: dev@snaprate.com
- **Documentation**: /README.md, /Prd.md
- **Test Environment**: http://localhost:3000

---

**SnapRate** - Empowering authentic business reviews and rewarding honest feedback. 🚀
