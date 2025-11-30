# CarrySpace Features Documentation

## Dynamic Platform Fee (12-18%)

Platform fees are calculated dynamically based on:

- **Method**: Plane (18% base) vs Boat (15% base)
- **User History**: Volume discounts based on completed deliveries
  - 10+ deliveries: 1% discount
  - 20+ deliveries: 2% discount
  - 50+ deliveries: 3% discount
- **User Rating**: Rating-based discounts
  - 4.5+ rating: 0.5% discount
  - 4.8+ rating: 1% discount
- **Subscription**: Pro subscribers get 0% fee

**Minimum fee**: 12% (even with all discounts)

## Insurance Upsell (Allianz)

- Automatic quote generation when item value > $0
- Coverage: Up to $2M default
- Premium: Calculated as 5% of item value (minimum $50)
- Route risk factors applied for high-risk destinations
- Policy stored in database and linked to match
- Placeholder API ready for Allianz integration

## Referral Program

- **Referrer**: Earns $50 credit when referred user completes first delivery
- **Referred**: Earns $50 credit after completing first delivery
- Unique referral codes generated per user
- Credits stored in `referral_credits` field
- Credits can be applied to future deliveries
- Stats tracked: total referrals, credits earned, credits available

## Internationalization (next-intl)

- **Languages**: English (en), Spanish (es), French (fr)
- **Locale Detection**: Automatic based on browser/device
- **URL Structure**: `/es/...` or `/fr/...` for non-default locales
- **Translation Files**: `messages/{locale}.json`
- **Components**: Use `useTranslations()` hook

## Capacitor Mobile App

- **iOS**: Full native iOS app support
- **Android**: Full native Android app support
- **Plugins**: App, Haptics, Keyboard, Status Bar
- **Build**: `npm run capacitor:build` then `npm run capacitor:ios` or `capacitor:android`
- **Config**: `capacitor.config.ts`

## Group Buys

- Multiple requesters can join the same trip
- **Organizer**: Creates group buy for a trip
- **Participants**: Join with their requests
- **Discount**: Configurable discount per participant
- **Status**: open → full → closed → completed
- **Max Participants**: Configurable (default 10)
- All participants share the same trip, reducing costs

### Group Buy Flow:

1. Traveler posts trip
2. Organizer creates group buy for that trip
3. Other requesters join with their items
4. When full or closed, all matches are created
5. Traveler delivers all items together
