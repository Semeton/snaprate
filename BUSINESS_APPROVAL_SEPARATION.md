# Business Approval System Separation

## Overview

The business approval system has been separated into two distinct processes to avoid confusion and provide clear separation of concerns:

1. **Business Review Approval** (`/admin/businesses`)
2. **Document Verification** (`/admin/verification`)

## 1. Business Review Approval (`/admin/businesses`)

### Purpose

- **Controls whether a business can receive reviews from users**
- **Does NOT verify business documents or compliance**
- **Focus**: Reviewability and user engagement

### What It Does

- Sets `business.reviewStatus` to:
  - `PENDING` - Business cannot receive reviews yet
  - `APPROVED` - Business can receive reviews from users
  - `REJECTED` - Business is blocked from receiving reviews
  - `SUSPENDED` - Business reviews are temporarily suspended

### API Endpoint

- **Route**: `/api/admin/businesses/[id]/verify`
- **Method**: POST
- **Action**: Updates `reviewStatus` field

### Use Cases

- New business registration approval
- Business review suspension for policy violations
- Re-enabling reviews for previously suspended businesses

### Status Badges

- 🟡 **Review Pending** - Awaiting approval for reviews
- 🟢 **Reviews Allowed** - Business can receive user reviews
- 🔴 **Reviews Blocked** - Business cannot receive reviews
- 🔴 **Reviews Suspended** - Reviews temporarily disabled

---

## 2. Document Verification (`/admin/verification`)

### Purpose

- **Verifies business compliance documents**
- **Ensures business meets regulatory requirements**
- **Focus**: Document authenticity and compliance

### What It Verifies

- **Director ID**: National ID, Passport, Driver's License, Voter Card
- **CAC Documents**: Certificate of Incorporation, Status Report, Business Registration
- **FIRS Tax Clearance**: Tax compliance documents
- **Address Evidence**: Utility bills, lease agreements, signage photos

### What It Does

- Sets `businessVerification.verificationStatus` to:

  - `PENDING` - Documents submitted, awaiting review
  - `UNDER_REVIEW` - Documents being examined
  - `APPROVED` - Documents verified and approved
  - `REJECTED` - Documents rejected (requires resubmission)

- Sets `business.verificationStatus` to:

  - `PENDING` - Verification in progress
  - `VERIFIED` - All documents verified
  - `REJECTED` - Verification failed

- Sets `business.addressVerificationStatus` to:
  - `UNVERIFIED` - Address not verified
  - `VERIFIED` - Address verified
  - `REJECTED` - Address verification failed

### API Endpoint

- **Route**: `/api/admin/verification`
- **Method**: POST
- **Action**: Updates verification document statuses

### Use Cases

- Business compliance verification
- Regulatory requirement fulfillment
- Document authenticity verification
- Address verification for business operations

### Status Badges

- 🟡 **Documents Pending** - Documents submitted, awaiting review
- 🔵 **Documents Under Review** - Documents being examined
- 🟢 **Documents Approved** - All documents verified
- 🔴 **Documents Rejected** - Documents failed verification

---

## Key Differences

| Aspect            | Business Review Approval | Document Verification                     |
| ----------------- | ------------------------ | ----------------------------------------- |
| **Purpose**       | Control reviewability    | Verify compliance                         |
| **Field Updated** | `business.reviewStatus`  | `businessVerification.verificationStatus` |
| **Impact**        | Can users review?        | Is business compliant?                    |
| **Requirements**  | Basic business info      | Legal documents                           |
| **Timing**        | Can be done immediately  | Requires document submission              |
| **Reversibility** | Easy to change           | Requires new documents                    |

## Workflow

### New Business Registration

1. **Business registers** → `reviewStatus: PENDING`
2. **Admin reviews basic info** → Approve for reviews (`reviewStatus: APPROVED`)
3. **Business can now receive reviews from users**
4. **Separately**: Business submits verification documents
5. **Admin reviews documents** → Approve verification (`verificationStatus: APPROVED`)

### Document Verification Process

1. **Business submits documents** → `verificationStatus: PENDING`
2. **Admin reviews documents** → `verificationStatus: APPROVED/REJECTED`
3. **Business verification status updated** → `verificationStatus: VERIFIED/REJECTED`

## Benefits of Separation

1. **Clear Responsibilities**: Each process has a distinct purpose
2. **Independent Operations**: Can approve reviews without waiting for documents
3. **Better User Experience**: Businesses can receive reviews immediately
4. **Compliance Tracking**: Document verification is separate from review approval
5. **Audit Trail**: Clear separation of admin actions
6. **Flexibility**: Can suspend reviews without affecting verification status

## Migration Notes

- Existing businesses with `verificationStatus: VERIFIED` will have `reviewStatus: APPROVED`
- New businesses will start with `reviewStatus: PENDING`
- Document verification is a separate, parallel process
- Both systems can operate independently

## Future Enhancements

- **Review Approval**: Could add more granular controls (review limits, moderation)
- **Document Verification**: Could add document expiry tracking, renewal reminders
- **Integration**: Could link verification status to review approval requirements
- **Automation**: Could auto-approve reviews for verified businesses
