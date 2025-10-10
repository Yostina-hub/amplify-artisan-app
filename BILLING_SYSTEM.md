# Unified Billing Management System

## Overview

The billing management system has been consolidated into a single, professional dashboard that integrates subscriptions, payments, and pricing management following SaaS industry standards (similar to Stripe, Chargebee).

## Access

**Admin Dashboard**: `/admin/billing`

## Features

### 1. Subscriptions Management

**What it does:**
- View all customer subscription requests
- Approve or reject requests with reasons
- Automatic payment record creation upon approval
- Status tracking throughout the lifecycle

**Workflow:**
```
Customer Request → Admin Review → Approve/Reject → Payment Created → Payment Verified → Subscription Active
```

**Statuses:**
- `pending` - Awaiting admin review
- `approved` - Approved, payment instructions sent
- `active` - Payment verified, subscription active
- `rejected` - Request denied with reason

### 2. Payment Management

**What it does:**
- Track all payment transactions
- Verify payments manually
- Automatic subscription activation on verification
- Revenue analytics and reporting

**Payment Methods Supported:**
- Telebirr
- CBE Birr
- Bank Transfer

**Workflow:**
```
Payment Created → Pending → Admin Verifies → Subscription Activated
```

### 3. Pricing Plans Management

**What it does:**
- Create and manage pricing tiers
- Configure features per plan
- Set pricing and billing periods
- Control plan visibility and ordering

**Plan Configuration:**
- Name, slug, description
- Price and currency
- Billing period (monthly/yearly)
- Feature list
- AI features toggle
- Support levels
- Team and account limits
- Active/inactive status

## Database Schema

### Tables Involved

1. **pricing_plans** - Master pricing data
   - Defines available subscription tiers
   - Features and limits per plan

2. **subscription_requests** - Customer subscriptions
   - Customer information
   - Selected pricing plan
   - Status and payment tracking

3. **payment_transactions** - Billing records
   - Links to subscription request
   - Payment method and status
   - Transaction references

### Relationships

```
pricing_plans (1) ← (N) subscription_requests (1) ← (N) payment_transactions
```

## Automated Workflows

### Subscription Approval Flow

1. Admin approves subscription request
2. System creates payment transaction record automatically
3. Payment instructions sent to customer
4. Subscription status: `pending` → `approved`

### Payment Verification Flow

1. Admin verifies payment transaction
2. System updates payment status to `verified`
3. Linked subscription automatically activated
4. Subscription status: `approved` → `active`

## Integration Points

### Edge Functions

- `analyze-subscription` - AI-driven subscription analysis
- `process-payment` - Payment processing (connected but not fully implemented)
- `send-trial-welcome-email` - Welcome emails
- `send-upgrade-confirmation` - Upgrade notifications

### Components

- `BillingManagement.tsx` - Main dashboard
- `PricingPlansTab.tsx` - Pricing management component

## Migration from Old System

### Old Routes (Still Available)
- `/admin/subscriptions` - Legacy subscription management
- `/admin/payments` - Legacy payment tracking
- `/admin/pricing` - Legacy pricing configuration

### New Unified Route
- `/admin/billing` - **Recommended** - All-in-one dashboard

**Note:** Old routes remain for backward compatibility but the new unified system is recommended for better workflow and data consistency.

## Best Practices

1. **Always approve subscriptions first** - This creates the payment record
2. **Verify payments promptly** - This activates the subscription
3. **Keep pricing plans updated** - Changes reflect immediately
4. **Monitor payment statuses** - Follow up on pending payments
5. **Use rejection reasons** - Helps improve customer communication

## Future Enhancements

Potential additions:
- Automated email notifications
- Invoice generation (PDF)
- Recurring billing automation
- Payment gateway integrations (Stripe, PayPal)
- Subscription renewal reminders
- Usage-based billing
- Proration handling
- Refund processing

## Security Notes

- All operations require admin role
- Row-level security (RLS) enforced on all tables
- Payment data encrypted
- Audit trail maintained

## Support

For issues or questions about the billing system:
1. Check database RLS policies
2. Review edge function logs
3. Verify payment gateway configurations
4. Contact system administrator
