# SpareCarry Insurance Partnership Pitch

**Date**: January 2025  
**Version**: 1.0  
**Target**: Insurance Companies (Allianz, Travel Insurance Providers)

---

## Executive Summary

SpareCarry is a peer-to-peer delivery platform connecting travelers with people who need items delivered to remote destinations. We're seeking an insurance partnership to provide cargo insurance coverage for items in transit, protecting both requesters and travelers from loss, damage, and theft.

**Why Partner with SpareCarry?**

- Growing market: Remote delivery needs increasing
- High-value items: Average item value $200-$500
- Risk mitigation: Built-in safety features reduce claims
- Data-driven: Real-time tracking and verification
- Scalable: Platform handles claims processing

---

## Business Model Overview

### How SpareCarry Works

1. **Requester** posts a delivery request with item details, origin, destination, and maximum reward
2. **Traveler** (sailor, pilot, frequent flyer) posts a trip with spare capacity
3. **Platform** automatically matches requests with compatible trips
4. **Parties** communicate via in-app messaging to coordinate details
5. **Payment** held in escrow until delivery confirmation
6. **Delivery** tracked with GPS and photo proof
7. **Escrow** released automatically 24 hours after delivery confirmation

### Revenue Model

- **Platform Fees**: 12-18% of delivery value (0% for Pro subscribers)
- **Premium Subscriptions**: $6.99/month or $59/year
- **Lifetime Pro**: $100 one-time (limited availability)
- **Insurance Commission**: Potential revenue share on insurance premiums

---

## Risk Points & Safety Features

### Risk Points

1. **Item Loss**: Items lost in transit
2. **Item Damage**: Physical damage during transport
3. **Theft**: Items stolen during transport
4. **Delayed Delivery**: Items not delivered on time
5. **Restricted Items**: Lithium batteries, liquids, hazardous materials
6. **Emergency Deliveries**: Urgent deliveries with higher risk

### Existing Safety Features

#### 1. Restricted Items Enforcement

- **Automatic Method Restriction**: Restricted items automatically limited to boat transport (safer than plane)
- **Warning Modals**: Users must acknowledge restricted item warnings
- **Traveler Capability Flags**: Travelers specify what they can carry
- **Compliance Checks**: Platform validates items against airline/boat regulations

**Impact**: Reduces risk of prohibited items causing issues

#### 2. Emergency Multiplier with Limits

- **Tiered Bonus System**:
  - Base reward ≤ $20 → +25% bonus (max $5)
  - Base reward $20-$50 → +15% bonus (max $7.50)
  - Base reward > $50 → +10% bonus (max $15)
- **Cap**: Maximum $15 extra to prevent abuse
- **Purpose**: Incentivizes urgent deliveries without encouraging reckless behavior

**Impact**: Balances urgency with safety

#### 3. Messaging for Coordination

- **Real-time Chat**: Requesters and travelers communicate before and during transport
- **Photo Sharing**: Item photos shared before pickup
- **Address Exchange**: Shipping addresses shared securely
- **Meetup Coordination**: Specific meetup locations agreed upon

**Impact**: Reduces miscommunication and coordination errors

#### 4. Delivery Tracking & Proof

- **GPS Location**: Delivery location captured via GPS
- **Photo Proof**: Travelers upload photos of delivered items
- **Meetup Locations**: Pre-seeded safe meetup locations (20+ locations)
- **Auto-release**: Escrow released 24 hours after delivery confirmation

**Impact**: Provides evidence for claims and reduces disputes

#### 5. Rating System

- **5-Star Ratings**: Both parties rate each other after delivery
- **Reputation Building**: High-rated travelers get priority matching
- **Quality Incentives**: Rating-based platform fee discounts

**Impact**: Encourages quality service and reduces risk

#### 6. Escrow Payment System

- **Secure Payments**: Payments held in escrow until delivery
- **Dispute Handling**: Platform mediates disputes
- **Auto-release**: Automatic release after 24 hours (if no dispute)

**Impact**: Protects both parties financially

---

## Insurance Coverage Opportunities

### 1. Cargo Insurance

**Coverage**: Loss, damage, and theft during transport

**Pricing Model**:

- **Base Premium**: 5% of declared item value
- **Minimum Premium**: $50
- **Maximum Coverage**: $2,000,000 per item
- **Route Risk Factors**: Higher premiums for high-risk destinations

**Example**:

- Item Value: $500
- Base Premium: $25 (5% of $500)
- Minimum Premium: $50 (applied)
- **Total Premium**: $50

### 2. Delivery Delay Insurance

**Coverage**: Compensation if delivery delayed beyond agreed window

**Pricing Model**:

- **Premium**: 2% of item value
- **Coverage**: Full refund of platform fees + reward if delayed > 7 days

### 3. Liability Insurance

**Coverage**: Protection for travelers against damage claims

**Pricing Model**:

- **Premium**: Included in platform fee
- **Coverage**: Up to $10,000 per delivery

### 4. Emergency Delivery Insurance

**Coverage**: Enhanced coverage for urgent deliveries

**Pricing Model**:

- **Premium**: 7% of item value (vs 5% standard)
- **Coverage**: Expedited claims processing

---

## Shipping Volumes & Projections

### Current Beta Metrics (Projected)

**Monthly Deliveries**: 50-100 (beta phase)
**Average Item Value**: $200-$500
**Average Delivery Value**: $300 (item + reward)
**Platform Fee Revenue**: $36-$54 per delivery (12-18%)

### Growth Projections

**Year 1**:

- **Monthly Deliveries**: 500-1,000
- **Average Item Value**: $300
- **Total Monthly Value**: $150,000-$300,000
- **Insurance Premiums** (at 5%): $7,500-$15,000/month
- **Annual Insurance Premiums**: $90,000-$180,000

**Year 2**:

- **Monthly Deliveries**: 2,000-5,000
- **Average Item Value**: $350
- **Total Monthly Value**: $700,000-$1,750,000
- **Insurance Premiums** (at 5%): $35,000-$87,500/month
- **Annual Insurance Premiums**: $420,000-$1,050,000

**Year 3**:

- **Monthly Deliveries**: 5,000-10,000
- **Average Item Value**: $400
- **Total Monthly Value**: $2,000,000-$4,000,000
- **Insurance Premiums** (at 5%): $100,000-$200,000/month
- **Annual Insurance Premiums**: $1,200,000-$2,400,000

### Item Value Distribution

- **Low Value** ($50-$200): 40% of deliveries
- **Medium Value** ($200-$500): 45% of deliveries
- **High Value** ($500-$2,000): 15% of deliveries

### Route Risk Distribution

- **Low Risk** (US domestic, Caribbean): 60%
- **Medium Risk** (International, remote): 30%
- **High Risk** (War zones, unstable regions): 10%

---

## Integration Opportunities

### 1. API Integration

**Purpose**: Real-time insurance quote generation and policy creation

**Endpoints Needed**:

- `POST /api/insurance/quote` - Generate insurance quote
- `POST /api/insurance/purchase` - Create insurance policy
- `GET /api/insurance/policy/{id}` - Get policy details
- `POST /api/insurance/claim` - Submit claim
- `GET /api/insurance/claim/{id}` - Get claim status

**Data Flow**:

1. User enters item value in shipping estimator
2. SpareCarry calls insurance API for quote
3. Quote displayed to user
4. User purchases insurance during payment
5. Policy created and linked to match
6. Claims submitted via API when needed

**Current Implementation**: Placeholder API ready for integration

### 2. Notification Integration

**Purpose**: Automated notifications for policy events

**Notifications**:

- Policy created
- Policy activated (when match confirmed)
- Policy expired (if delivery not completed)
- Claim submitted
- Claim approved/rejected
- Payment processed

**Integration**: Webhook endpoint for insurance provider

### 3. Claims Handling

**Purpose**: Streamlined claims process

**Process**:

1. User submits claim via SpareCarry app
2. SpareCarry collects evidence (photos, GPS, messages)
3. Claim forwarded to insurance provider
4. Status updates sent to user
5. Payment processed when approved

**Benefits**:

- User-friendly interface
- Evidence collection automated
- Faster processing

### 4. Dashboard Integration

**Purpose**: Insurance provider dashboard for SpareCarry policies

**Features**:

- Policy overview
- Claims dashboard
- Risk analytics
- Revenue tracking

---

## Why Partner with SpareCarry?

### 1. Built-in Risk Mitigation

- **Restricted Items Enforcement**: Reduces prohibited item risks
- **Emergency Limits**: Prevents reckless behavior
- **Delivery Tracking**: GPS and photo proof for claims
- **Rating System**: Quality travelers get priority

### 2. Data-Driven Insights

- **Real-time Tracking**: GPS location for every delivery
- **Photo Evidence**: Automatic photo collection
- **User Behavior**: Analytics on risk factors
- **Route Analytics**: Risk assessment by route

### 3. Scalable Platform

- **Automated Processing**: API integration handles quotes and policies
- **Claims Automation**: Evidence collection automated
- **Growth Potential**: Platform designed to scale

### 4. Market Opportunity

- **Growing Market**: Remote delivery needs increasing
- **High-Value Items**: Average $200-$500 per delivery
- **Recurring Revenue**: Monthly/annual subscriptions
- **Network Effects**: More users = more deliveries = more premiums

### 5. Low Claims Rate Potential

- **Community-Driven**: Users have reputation to protect
- **Escrow System**: Financial incentive for successful delivery
- **Rating System**: Quality travelers get more matches
- **Safety Features**: Multiple layers of risk mitigation

---

## Proposed Partnership Structure

### Option 1: Revenue Share

- **Insurance Provider**: 70% of premiums
- **SpareCarry**: 30% of premiums
- **SpareCarry Responsibilities**: Marketing, user acquisition, claims collection
- **Insurance Provider Responsibilities**: Underwriting, claims processing, payouts

### Option 2: White-Label Insurance

- **Insurance Provider**: Provides insurance product
- **SpareCarry**: Sells insurance under SpareCarry brand
- **Revenue Split**: Negotiable
- **Benefits**: Brand consistency, user trust

### Option 3: Referral Partnership

- **SpareCarry**: Refers users to insurance provider
- **Insurance Provider**: Pays referral fee per policy
- **Benefits**: Simple integration, low commitment

---

## Technical Integration Requirements

### 1. API Endpoints

**Required**:

- Quote generation
- Policy creation
- Claims submission
- Policy status updates

**Optional**:

- Real-time policy updates
- Advanced risk assessment
- Custom pricing models

### 2. Webhook Support

**Required**:

- Policy status changes
- Claim updates
- Payment confirmations

### 3. Data Requirements

**From SpareCarry**:

- Item details (value, description, photos)
- Route information (origin, destination)
- Traveler information (rating, history)
- Delivery tracking (GPS, photos)

**To Insurance Provider**:

- Policy details
- Claim information
- Evidence (photos, GPS, messages)

### 4. Security Requirements

- **HTTPS**: All API calls encrypted
- **API Keys**: Secure key management
- **Webhook Signatures**: Signature verification
- **Data Privacy**: GDPR/CCPA compliant

---

## Next Steps

### Phase 1: Pilot Program (3 months)

- **Deliveries**: 50-100 per month
- **Coverage**: Cargo insurance only
- **Integration**: Basic API integration
- **Evaluation**: Claims rate, user adoption, revenue

### Phase 2: Expansion (6 months)

- **Deliveries**: 500-1,000 per month
- **Coverage**: All insurance types
- **Integration**: Full API + webhook integration
- **Marketing**: Co-marketing campaigns

### Phase 3: Scale (12 months)

- **Deliveries**: 2,000-5,000 per month
- **Coverage**: Custom insurance products
- **Integration**: Advanced analytics and risk assessment
- **Partnership**: Long-term revenue share agreement

---

## Contact Information

**SpareCarry Team**  
Email: partnerships@sparecarry.com  
Website: https://sparecarry.com

**Document Version**: 1.0  
**Last Updated**: January 2025

---

## Appendix: Example Insurance Scenarios

### Scenario 1: Standard Delivery

- **Item**: Marine equipment, $300 value
- **Route**: Miami → Grenada (low risk)
- **Premium**: $50 (5% of $300, minimum applies)
- **Coverage**: $300 (item value)
- **Expected Claims Rate**: < 2%

### Scenario 2: High-Value Delivery

- **Item**: Electronics, $1,500 value
- **Route**: Los Angeles → Fiji (medium risk)
- **Premium**: $75 (5% of $1,500)
- **Coverage**: $1,500 (item value)
- **Expected Claims Rate**: < 3%

### Scenario 3: Emergency Delivery

- **Item**: Medical supplies, $500 value
- **Route**: New York → Caribbean (low risk, urgent)
- **Premium**: $50 (standard) or $70 (emergency coverage)
- **Coverage**: $500 (item value) + expedited processing
- **Expected Claims Rate**: < 2.5%

### Scenario 4: Restricted Items

- **Item**: Lithium batteries, $200 value
- **Route**: San Francisco → French Polynesia (medium risk)
- **Premium**: $50 (minimum applies)
- **Coverage**: $200 (item value)
- **Safety**: Automatically limited to boat transport
- **Expected Claims Rate**: < 1.5% (due to safety restrictions)

---

**Ready to discuss partnership opportunities? Contact us at partnerships@sparecarry.com**
