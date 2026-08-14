# Build a Modern Gen-Z Cashback + Share-to-Earn Web Platform

You are a senior product designer, UX designer, frontend engineer, backend architect, and fintech/affiliate-platform engineer.

I want you to design and build a **production-quality cashback and earning web application** inspired by the best UX patterns from:

- CashKaro
- Hyyzo
- SavingKaro
- Zingoy
- PaisaWapas

Do NOT copy their branding, layouts, text, assets, or exact UI. Use them only as product/UX references.

The product should feel like a **modern Indian Gen-Z fintech/rewards platform**, not like an old coupon website.

The platform will use the **Cuelinks API + Cuelinks tracking/postback system** for affiliate tracking.

---

# 1. Core Product Concept

The platform has TWO major earning mechanisms:

## A. Shop & Earn Cashback

A user visits our website/app.

They browse stores such as:

- Flipkart
- Amazon
- Myntra
- AJIO
- Nykaa
- Tata CLiQ
- MakeMyTrip
- Booking.com
- Goibibo
- Swiggy
- etc.

Each store should have:

- Store logo
- Store name
- Cashback rate
- Cashback type
- Category
- Offer/coupon information
- "Earn Cashback" CTA
- "Visit Store" CTA
- Store details page

When a logged-in user clicks "Earn Cashback", generate a Cuelinks affiliate tracking URL with the user's identifier in the appropriate Sub ID.

The user is then redirected to the merchant.

Cuelinks tracks the click and later sends transaction information back through the configured postback/webhook.

---

# 2. Share & Earn / Profit Link

This is a major feature.

Logged-in users should be able to paste ANY supported merchant/product URL into a:

> "Share & Earn"

or

> "Create Profit Link"

tool.

Example:

User pastes:

https://www.example.com/product/123

Our backend:

1. Validates the URL.
2. Detects the merchant.
3. Checks whether the merchant/campaign is supported.
4. Converts the URL using the Cuelinks API.
5. Adds the logged-in user's attribution identifier.
6. Creates a shareable earning link.
7. Displays:
   - Original product URL
   - Merchant
   - Cashback/earning potential
   - Generated earning link
   - Copy button
   - WhatsApp share
   - Telegram share
   - Facebook share
   - X share
   - Native share where supported

The user can share this link with friends, family, WhatsApp groups, Telegram, Instagram bio, etc.

If another person purchases through the shared link, the original sharer should receive their configured share/profit reward.

This should work conceptually like the Profit Link / Share & Earn systems of Hyyzo and Zingoy.

---

# 3. IMPORTANT: Separate Cashback and Profit-Link Attribution

Design the tracking system so that we can distinguish:

### Direct shopping

USER A → Our website → Merchant

from:

### Profit link

USER A → Profit Link → Merchant

where USER B may ultimately make the purchase.

We need to know:

- Who generated the link
- Who clicked the link
- Which user eventually made the purchase
- Which merchant
- Which Cuelinks transaction
- Which order
- Which commission
- Which cashback belongs to buyer
- Which earning belongs to link creator
- Referral attribution if applicable

Never mix these attribution records.

---

# 4. Referral System

Implement a separate:

## Refer & Earn

Every registered user gets a unique referral code/link.

Example:

/refer/ABC123

or

/ref/ABC123

When a new user registers through that link:

- Save referrer
- Save referred user
- Prevent self-referral
- Prevent referral manipulation
- Track referral status
- Track referral earnings
- Track referral payout status

Admin should be able to configure:

- Fixed referral bonus
- Percentage of referred user's cashback
- Percentage of platform profit
- Duration of referral earning
- Maximum referral earning
- Minimum transaction requirement
- Minimum withdrawal requirement

---

# 5. Profit Distribution System

This is extremely important.

The Cuelinks commission received by us should NOT automatically become the user's cashback.

We need an internal commission-distribution engine.

Example:

Cuelinks commission:

₹100

Admin configuration:

- Customer cashback: 60%
- Profit-link creator: 15%
- Referral reward: 5%
- Platform revenue: 20%

The system should calculate:

Customer = ₹60
Profit-link creator = ₹15
Referral = ₹5
Platform = ₹20

But this distribution must be configurable PER STORE.

For example:

### Flipkart

Commission: ₹100

Customer: 70%
Profit link: 10%
Referral: 5%
Platform: 15%

### Myntra

Customer: 60%
Profit link: 20%
Referral: 5%
Platform: 15%

### Another store

Customer: 40%
Profit link: 30%
Referral: 10%
Platform: 20%

Admin can change these percentages without changing code.

---

# 6. Admin Commission Rules

Create a powerful admin interface.

Admin should be able to search for a store and configure:

- Cashback percentage
- Cashback fixed amount
- Profit-link percentage
- Referral percentage
- Platform margin
- Maximum cashback
- Minimum purchase value
- Maximum cashback per order
- Cashback validity
- Category
- Store status
- Featured status
- Store ranking
- Store logo
- Store banner
- Coupon visibility
- Profit-link eligibility
- Cashback eligibility

Show a real-time calculation preview.

Example:

Cuelinks commission:
₹500

Distribution:

Customer cashback: 60% → ₹300
Profit link: 15% → ₹75
Referral: 5% → ₹25
Platform: 20% → ₹100

Show this visually in the admin panel.

---

# 7. Cuelinks Integration

Build the application around the current Cuelinks Publisher API.

Use the Cuelinks API for:

- Campaign/store discovery
- Campaign information
- Affiliate link conversion
- Sub ID attribution
- Transactions
- Reports
- Earnings reconciliation
- Missing transaction workflows where appropriate

Do NOT expose the Cuelinks API key to the browser.

All Cuelinks API calls must happen server-side.

Use environment variables such as:

CUELINKS_API_KEY

CUELINKS_CHANNEL_ID

CUELINKS_POSTBACK_SECRET

etc.

Never hardcode secrets.

---

# 8. Cuelinks Sub-ID Architecture

Use Sub IDs intelligently.

Suggested architecture:

### subid

Primary internal click/user attribution.

Example:

user_84729

### subid2

Traffic/link type.

Examples:

direct_cashback
profit_link
referral

### subid3

Profit-link ID / campaign attribution.

Example:

pl_928374

### subid4

Referral ID.

Example:

ref_82921

### subid5

Optional internal tracking metadata.

Do NOT put sensitive personal information in Sub IDs.

The exact mapping should be configurable in the backend.

Store all attribution information in our own database as well.

Never depend exclusively on Cuelinks Sub IDs.

---

# 9. Logged-In vs Logged-Out Behaviour

This is critical.

## Logged-in user

When a logged-in user clicks:

> Earn Cashback

generate a Cuelinks tracking URL with the user's attribution/sub ID.

Track:

- user ID
- store ID
- campaign ID
- click ID
- timestamp
- destination URL
- tracking URL
- attribution metadata

---

## Logged-out user

If a visitor is NOT logged in:

They should still be able to browse stores.

They can click:

> Visit Store

or

> Shop Now

But DO NOT attach a user-specific cashback attribution/sub ID.

Redirect them without the user ID.

Before redirecting, show a useful warning/modal:

> "You're not logged in. You may miss your cashback."

Buttons:

### Login & Earn Cashback

### Continue Without Cashback

The second option should redirect normally without a user-specific Sub ID.

Do not force login merely to browse the site.

---

# 10. Click Tracking

Create a first-party internal click record before redirecting.

Database example:

clicks

- id
- user_id nullable
- store_id
- campaign_id
- click_type
- profit_link_id nullable
- referral_id nullable
- original_url
- tracking_url
- subid
- subid2
- subid3
- subid4
- subid5
- created_at
- user_agent
- device_type
- country
- status

Do not store unnecessary sensitive information.

---

# 11. Transaction Tracking

Create a transaction table.

Fields should include approximately:

- internal_transaction_id
- cuelinks_transaction_id
- user_id
- store_id
- campaign_id
- campaign_name
- order_id
- merchant_reference_id
- sale_amount
- currency
- Cuelinks commission
- cashback amount
- profit-link earning
- referral earning
- platform earning
- transaction status
- transaction date
- created_at
- updated_at
- subid
- subid2
- subid3
- subid4
- subid5

Possible transaction states:

- Clicked
- Pending
- Confirmed
- Validated
- Rejected
- Cancelled
- Reversed
- Paid

Do not mark cashback as withdrawable before the merchant/Cuelinks transaction is confirmed according to our configured rules.

---

# 12. Cuelinks Postback / Webhook

Create a secure backend endpoint for Cuelinks Global Postback.

Example concept:

POST /api/webhooks/cuelinks

The endpoint should:

1. Validate the request.
2. Verify authentication/signature if provided by Cuelinks.
3. Parse transaction information.
4. Match the transaction to our click/user using Sub IDs and stored attribution.
5. Create/update transaction.
6. Calculate cashback.
7. Calculate profit-link earning.
8. Calculate referral earning.
9. Update wallet ledger.
10. Keep an immutable transaction/audit record.
11. Handle duplicate postbacks idempotently.
12. Handle status changes such as validation/rejection/reversal.
13. Log failures.
14. Retry safely when required.

Never create duplicate wallet credits if the same postback arrives multiple times.

---

# 13. Transaction Sync

In addition to postback, create a background reconciliation job.

The job should periodically fetch Cuelinks transactions using the API.

Use this for:

- Backfill
- Reconciliation
- Missing postbacks
- Status updates
- Data consistency

Use incremental syncing where possible.

Create an admin page:

> Cuelinks Sync

showing:

- Last successful sync
- Transactions imported
- Transactions updated
- Failed records
- API errors
- Next scheduled sync

---

# 14. Wallet System

Create a proper ledger-based wallet.

Do NOT simply store:

user.balance = 500

Instead create wallet transactions.

Example:

wallet_transactions

- id
- user_id
- type
- amount
- currency
- source
- source_transaction_id
- status
- description
- created_at

Types:

- cashback_pending
- cashback_confirmed
- cashback_reversed
- profit_link_earning
- referral_earning
- referral_bonus
- withdrawal
- withdrawal_reversal
- adjustment

Balances:

- Pending cashback
- Confirmed cashback
- Available balance
- Withdrawn
- Lifetime earnings

---

# 15. Withdrawal System

Create a withdrawal section.

Support architecture for:

- UPI
- Bank account
- Other payout methods later

Minimum withdrawal amount should be configurable by admin.

Show:

Available balance

₹1,250

Minimum withdrawal:

₹100

Button:

> Withdraw

Withdrawal status:

- Requested
- Processing
- Paid
- Failed
- Cancelled

Admin can process withdrawals.

Keep a complete audit trail.

---

# 16. User Dashboard

Create a beautiful logged-in dashboard.

Header:

Good morning, [Name]

Available Cashback:

₹1,240

Pending:

₹430

Lifetime Earned:

₹8,920

Withdrawn:

₹6,450

Main actions:

- Shop & Earn
- Share & Earn
- Refer & Earn
- Withdraw

---

# 17. Recent Activity Page

Create a dedicated:

> Recent Activity

page.

It should show both clicks and transactions.

Tabs:

### All

### Clicks

### Cashback

### Profit Link

### Referral

### Withdrawals

Filters:

- Date range
- Store
- Status
- Transaction type
- Amount
- Category

Search:

- Order ID
- Store
- Transaction ID

Example:

Myntra

₹2,499 order

Cashback:

₹125

Status:

Pending

Date:

14 Aug 2026

---

# 18. Recent Clicks Page

Create a page specifically for recent clicks.

Columns/cards:

- Store logo
- Store name
- Click type
- Date/time
- Device
- Status
- Profit-link information

Example:

🛍️ Myntra

Direct Cashback

Today, 4:32 PM

Tracked

---

# 19. Transaction Detail Page

When the user opens a transaction:

Show:

Store logo

Store name

Order ID

Purchase amount

Cuelinks commission

Your cashback

Profit-link earning if applicable

Referral earning if applicable

Status

Purchase date

Last updated

Timeline:

Clicked

→

Transaction received

→

Pending

→

Confirmed

→

Cashback available

Keep the user-facing interface simple.

Do not expose unnecessary internal Cuelinks data.

---

# 20. Store Directory

Homepage must showcase stores.

Every store card MUST have a logo.

Store card:

[LOGO]

Flipkart

Up to 8% Cashback

Shop Now →

Also include:

- Search stores
- Categories
- Popular stores
- Highest cashback
- Trending stores
- New stores
- Featured stores

Store categories:

Fashion
Electronics
Beauty
Food
Travel
Grocery
Mobiles
Home
Finance
Recharge
Entertainment
Health
Others

---

# 21. Store Detail Page

SEO-friendly route:

/store/flipkart

or

/stores/flipkart

Page should contain:

Store logo

Store name

"Earn up to X% cashback"

CTA:

> Earn Cashback

Coupon section

Cashback rates

How cashback works

Important terms

FAQ

Related stores

Related categories

SEO content

---

# 22. Homepage

Create a high-conversion homepage.

Hero section:

Large headline:

> Shop Smarter. Get Cashback. Earn More.

Subheadline:

> Shop your favourite stores, get real cashback, and earn extra by sharing deals.

Primary CTA:

> Start Earning

Secondary CTA:

> Explore Stores

Hero should include a visually attractive cashback/earning animation.

---

# 23. Homepage Sections

Include:

### Search

"Search stores, brands & offers"

### Popular Stores

Logo grid

### Highest Cashback

Store cards

### Trending Deals

Product/deal cards

### Share & Earn

Large feature section:

> Don't just shop. Share and earn.

Paste product link.

[ Create Profit Link ]

### How It Works

1. Find a store
2. Shop through us
3. Get cashback

Then:

1. Create profit link
2. Share it
3. Earn when others shop

### Categories

Visual category cards

### Recently Added Stores

### Popular Offers

### Refer & Earn

### FAQ

---

# 24. Gen-Z Visual Design

The design should feel:

- Modern
- Energetic
- Trustworthy
- Premium
- Fun
- Mobile-first
- Gen-Z
- Fintech

Avoid the boring "traditional coupon website" aesthetic.

Use:

- Large typography
- Rounded cards
- Soft gradients
- Subtle glassmorphism where appropriate
- Bold CTA buttons
- Micro animations
- Smooth hover states
- Animated cashback counters
- Floating UI elements
- Modern icons
- Strong visual hierarchy

Use a tasteful modern color system.

Possible direction:

- Deep navy / near-black
- Electric purple
- Vibrant violet
- Cyan
- Lime/green for money/cashback
- White backgrounds for content areas

Do NOT make the entire site neon.

Keep it premium.

---

# 25. Mobile First

The majority of users will likely be mobile users.

Design mobile first.

Mobile bottom navigation:

Home

Stores

Earn

Activity

Profile

Floating:

Share & Earn

button where appropriate.

Store cards should work extremely well on mobile.

---

# 26. SEO Architecture

The website must be SEO-friendly.

Use:

Server-side rendering or an SEO-friendly rendering architecture.

Every store should have a crawlable page.

Examples:

/stores

/stores/flipkart

/stores/myntra

/stores/ajio

/categories/fashion

/categories/electronics

/deals

/cashback

/share-and-earn

/refer-and-earn

Create:

- Unique title
- Meta description
- Canonical URL
- Open Graph metadata
- Structured data
- Breadcrumb schema
- FAQ schema where appropriate
- Organization schema
- WebSite schema
- Store/Offer structured data where valid

Generate SEO-friendly content dynamically from store data.

Do not create thin duplicate pages.

---

# 27. Performance

Optimize for:

- Core Web Vitals
- Fast first load
- Image optimization
- Lazy loading
- CDN
- Caching
- API caching
- Database indexes
- Pagination
- Server-side rendering where appropriate

Store logos should be optimized and cached.

---

# 28. Store Logo System

Every store must have a logo.

Create a store asset system.

Fields:

- logo_url
- logo_square
- banner
- favicon
- brand_color

If Cuelinks provides campaign/store information but not a usable logo, create an admin interface to upload the logo.

Never rely on random Google image URLs.

Use optimized local/CDN assets.

---

# 29. Admin Portal

Create a separate admin dashboard.

Admin sections:

Dashboard

Users

Stores

Categories

Campaigns

Cashback Rules

Profit Link Rules

Referral Rules

Transactions

Clicks

Wallet

Withdrawals

Postbacks

Cuelinks Sync

Missing Transactions

Coupons

Deals

SEO

Settings

Admins

Audit Logs

---

# 30. Admin Dashboard KPIs

Show:

Total users

Active users

Clicks today

Clicks this month

Transactions

Pending cashback

Confirmed cashback

Total commission

Customer cashback

Profit-link payouts

Referral payouts

Platform revenue

Withdrawals

Conversion rate

Top stores

Top users

Top profit-link creators

---

# 31. Store Admin

Admin can:

Add store

Edit store

Delete/deactivate store

Upload logo

Set category

Set cashback

Set profit-link percentage

Set referral percentage

Set platform margin

Set maximum cashback

Set minimum order value

Set featured

Set ranking

Set SEO title

Set SEO description

Set slug

Set store terms

Enable/disable profit links

Enable/disable cashback

---

# 32. Cashback Rule Engine

Create a flexible rule engine.

Rules can be:

Store-level

Category-level

Campaign-level

User-level if required later

Examples:

Store A:

Customer = 70%

Profit Link = 10%

Referral = 5%

Platform = 15%

Store B:

Customer = 50%

Profit Link = 20%

Referral = 10%

Platform = 20%

The admin UI should validate that:

Customer + Profit Link + Referral + Platform <= 100%

Also allow a fixed amount rule where appropriate.

---

# 33. Cuelinks Configuration Page

Create:

Admin → Integrations → Cuelinks

Fields:

API Key

Channel ID

Postback URL

Postback secret/auth configuration if applicable

API status

Last successful API request

Last postback received

Last transaction sync

Test connection button

Test link conversion button

Sync now button

Do not expose the API key to normal users.

Mask secrets in UI.

---

# 34. Cuelinks Setup Documentation Inside Admin

Create an internal documentation/help page called:

> How to Configure Cuelinks

It should explain exactly what the administrator needs to configure.

Include:

1. Create/obtain Cuelinks Publisher API key.
2. Enable required API scopes.
3. Configure publisher/channel.
4. Approve/access required merchant campaigns.
5. Configure affiliate link conversion.
6. Configure Sub ID strategy.
7. Configure Global Postback.
8. Add our postback URL.
9. Configure any required authentication/security.
10. Test a click.
11. Test a transaction/postback.
12. Verify transaction attribution.
13. Run reconciliation.

Important:

Do NOT invent Cuelinks fields or undocumented postback parameters.

Build the UI so Cuelinks-specific settings can be adjusted when their API/postback configuration changes.

Reference the official Cuelinks API documentation when implementing the integration.

---

# 35. Security

Implement:

- Authentication
- Authorization
- Role-based admin access
- Rate limiting
- CSRF protection where relevant
- Input validation
- URL validation
- SSRF protection for user-submitted URLs
- XSS protection
- SQL injection protection
- Secure cookies
- Secret management
- Webhook authentication
- Idempotency
- Audit logs

Profit-link generation must not become an open redirect vulnerability.

Only allow supported/validated destination URLs.

---

# 36. Fraud Prevention

Because this is a cashback platform, include basic anti-fraud architecture.

Detect:

- Self-referrals
- Duplicate accounts
- Suspicious transaction patterns
- Excessive click activity
- Repeated device/IP patterns where legally appropriate
- Abnormal profit-link behaviour
- Cashback abuse
- Withdrawal abuse

Create a:

> Risk Status

for users:

Normal

Review

Restricted

Blocked

Do not automatically permanently ban users based solely on weak signals.

---

# 37. Missing Cashback

Create:

> Missing Cashback?

page.

User can submit:

- Store
- Order ID
- Purchase date
- Purchase amount
- Screenshot
- Description

Admin can review and associate it with a Cuelinks transaction.

Possible statuses:

Submitted

Under Review

Matched

Approved

Rejected

Paid

---

# 38. Notifications

Create notification architecture.

Notifications for:

- Cashback tracked
- Cashback confirmed
- Cashback rejected
- Profit-link earning
- Referral earning
- Withdrawal requested
- Withdrawal completed
- Withdrawal failed
- Missing cashback update

Support future:

Email

Push

WhatsApp

SMS

---

# 39. User Profile

Profile page:

Name

Mobile

Email

Referral code

UPI

Bank details

KYC status if required

Notification preferences

Security

Logout

---

# 40. UX Rules

Always make the earning amount clear.

Example:

> Earn ₹150 Cashback

is better than:

> Cashback available

Use real money amounts where possible.

Use:

₹

rather than generic "points" unless the product explicitly introduces points later.

Avoid dark patterns.

Make transaction statuses understandable.

---

# 41. Important Login Flow

When logged out:

User clicks:

> Earn Cashback

Show:

--------------------------------

🔐 Login to protect your cashback

You're currently not logged in.

If you continue without logging in, we cannot associate this shopping trip with your account and you may miss cashback.

[ Login & Earn ]

[ Continue Without Cashback ]

--------------------------------

If they choose Continue:

Redirect without user-specific Sub ID.

If they choose Login:

After successful login, return them to the intended store and generate the correct tracking link.

---

# 42. Profit Link Flow

Create an extremely simple UI.

Page:

> Share & Earn

Headline:

> Turn product links into earning links.

Input:

Paste a product or store URL

[ Create Earning Link ]

Result:

Store logo

Store name

Potential cashback

Your earning potential

Generated link

[ Copy ]

[ WhatsApp ]

[ Share ]

Show:

> Share this link. When someone shops through it, you earn according to the store's earning rules.

---

# 43. Referral Page

Create:

> Invite friends. Earn together.

Show:

Your referral link

[ Copy Link ]

[ WhatsApp ]

[ Share ]

Stats:

Friends joined

Active referrals

Referral earnings

Pending earnings

Lifetime referral earnings

---

# 44. Database Design

Design a normalized relational database.

Likely tables:

users

user_profiles

stores

store_categories

campaigns

clicks

profit_links

profit_link_clicks

referrals

transactions

wallets

wallet_transactions

withdrawals

cashback_rules

referral_rules

profit_link_rules

coupons

deals

notifications

missing_cashback_claims

cuelinks_sync_logs

cuelinks_postbacks

audit_logs

admin_users

settings

store_assets

seo_metadata

Create appropriate indexes.

Use foreign keys and unique constraints.

---

# 45. Architecture

Prefer a modern stack such as:

Frontend:

Next.js

React

TypeScript

Tailwind CSS

shadcn/ui or a similarly polished component system

Backend:

Next.js server/API routes or a dedicated backend service

Database:

PostgreSQL

Cache:

Redis where useful

Background jobs:

BullMQ / Redis or equivalent

Storage:

S3-compatible object storage

Authentication:

Secure session-based or token-based authentication

Payments/payouts:

Design an abstraction layer so payout providers can be added later.

---

# 46. API Architecture

Create clean internal APIs.

Examples:

POST /api/auth/login

GET /api/stores

GET /api/stores/:slug

POST /api/clicks

POST /api/affiliate/redirect

POST /api/profit-links

GET /api/profit-links

GET /api/activity

GET /api/transactions

GET /api/wallet

POST /api/withdrawals

POST /api/referrals

POST /api/webhooks/cuelinks

POST /api/admin/cuelinks/sync

POST /api/admin/stores/:id/rules

---

# 47. Affiliate Redirect Architecture

Do not expose complicated Cuelinks implementation to the frontend.

Frontend calls:

GET /go/:storeSlug

Backend:

1. Authenticate user if available.
2. Find store/campaign.
3. Create internal click.
4. Generate Cuelinks tracking URL.
5. Attach appropriate Sub IDs.
6. Save tracking information.
7. Redirect user to Cuelinks tracking URL.

For profit links:

GET /p/:profitLinkCode

Backend:

1. Resolve profit link.
2. Record click.
3. Resolve creator.
4. Generate tracking URL with creator attribution.
5. Redirect to merchant.

---

# 48. Direct Merchant Homepage Links

On the homepage, every store should have:

Logo

Store name

Cashback rate

CTA:

> Shop & Earn

The CTA should take the logged-in user through our tracking redirect.

If user wants to simply visit the merchant without cashback, provide:

> Visit Store

which does not necessarily need user-specific cashback attribution.

---

# 49. Analytics

Track product analytics events:

page_view

store_view

store_search

store_click

cashback_click

login_prompt_shown

login_completed

direct_redirect

profit_link_created

profit_link_shared

profit_link_clicked

referral_shared

referral_signup

transaction_received

cashback_confirmed

withdrawal_requested

Do not send sensitive personal information to analytics tools.

---

# 50. Design System

Create reusable components:

Button

StoreCard

CashbackBadge

StoreLogo

CategoryCard

DealCard

EarningCard

TransactionCard

ActivityTimeline

WalletSummary

ReferralCard

ProfitLinkGenerator

ShareButtons

LoginPrompt

FilterBar

SearchBar

Pagination

StatusBadge

AdminDataTable

CommissionDistributionEditor

---

# 51. Design the Admin Commission Editor Carefully

This is one of the most important screens.

Example:

STORE: Flipkart

Cuelinks Commission

₹500

Distribution

Customer Cashback
[ 60 ] %

Profit Link
[ 15 ] %

Referral
[ 5 ] %

Platform
[ 20 ] %

Total
100%

Estimated distribution:

Customer: ₹300

Profit Link: ₹75

Referral: ₹25

Platform: ₹100

Use a visual bar/chart to show the distribution.

Add:

[ Save Rules ]

[ Reset ]

[ Test Calculation ]

---

# 52. Error States

Design proper states for:

Store unavailable

Campaign unavailable

Cuelinks API error

Merchant not supported

Link conversion failed

Transaction pending

Transaction rejected

No cashback available

User not logged in

Invalid product URL

Profit link unavailable

Withdrawal failed

Missing transaction

---

# 53. Empty States

Create attractive empty states.

Examples:

No transactions yet

> Your first cashback is waiting.

[ Explore Stores ]

No profit links

> Turn your next product recommendation into earnings.

[ Create Profit Link ]

No referrals

> Your network is empty. Start sharing.

[ Invite Friends ]

---

# 54. Final Deliverables

I want you to produce:

1. Complete product architecture.
2. Complete sitemap.
3. User flows.
4. Database schema.
5. API architecture.
6. Cuelinks integration architecture.
7. Postback architecture.
8. Admin architecture.
9. Cashback distribution engine.
10. Profit-link attribution engine.
11. Referral engine.
12. Wallet/ledger architecture.
13. SEO architecture.
14. Responsive UI.
15. Production-quality frontend.
16. Admin portal.
17. Authentication.
18. Error/loading/empty states.
19. Seed/demo data.
20. README with setup instructions.
21. Environment variable documentation.
22. Cuelinks configuration documentation.

---

# 55. Most Important Product Principle

The platform should not feel like:

"another coupon website."

It should feel like:

> **A social cashback + earning platform where users can save money AND make money by sharing products.**

The three primary CTAs should be:

### 🛍️ Shop & Earn

Get cashback from your own purchases.

### 🔗 Share & Earn

Create earning links and make money when others shop.

### 👥 Refer & Earn

Invite people and earn from their eligible activity.

Make these three concepts immediately understandable within the first 5 seconds of landing on the homepage.

---

# 56. Cuelinks Implementation Requirement

Before implementing the Cuelinks integration, inspect the current official Cuelinks API documentation and use the currently supported API endpoints/parameters.

The current Cuelinks API supports campaign discovery, link conversion, Sub ID fields, transaction retrieval, reports and other publisher functionality. Link conversion supports `subid` through `subid5`, and Cuelinks recommends Global Postback for real-time transaction updates with API synchronization for reconciliation/backfills.

Do not assume undocumented parameters.

If a required capability is not available through the API, clearly isolate it behind an adapter/service layer and document the limitation rather than inventing an API.

---

# 57. Build Quality

Write clean, maintainable, production-oriented code.

Use:

- TypeScript
- Strong typing
- Validation schemas
- Reusable services
- Repository/service architecture where useful
- Proper database transactions
- Idempotent webhook processing
- Structured logging
- Error monitoring hooks
- Tests for commission calculations
- Tests for attribution
- Tests for referral calculations
- Tests for duplicate postbacks
- Tests for transaction reversals
- Tests for logged-out redirects

The commission calculation engine must have automated tests because financial calculations are critical.

---

# 58. Start Here

First create:

1. Product architecture
2. Sitemap
3. User flow
4. Database schema
5. Cuelinks integration architecture
6. Cashback/profit/referral calculation model
7. Homepage wireframe
8. Admin commission-rule wireframe

Then implement the application.

Do not build a superficial landing page.

Build the foundation for a real cashback/earning platform.

The final UI should look like a **modern 2026 Indian fintech/rewards startup**, with polished Gen-Z visual language, excellent mobile UX, fast performance, strong SEO, and a trustworthy financial-product feel.