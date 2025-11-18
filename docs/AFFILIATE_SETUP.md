# Affiliate Links Setup

This document explains how to set up affiliate links for West Marine, SVB, and Amazon.

## Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_WEST_MARINE_AFFILIATE_ID=your_west_marine_affiliate_id
NEXT_PUBLIC_SVB_AFFILIATE_ID=your_svb_affiliate_id
NEXT_PUBLIC_AMAZON_AFFILIATE_ID=your_amazon_associate_tag
```

## How It Works

1. **When Posting Request**: User selects a preferred retailer (West Marine, SVB, or Amazon)
2. **When Match Confirmed**: System generates affiliate link with:
   - Item search query (from request title)
   - Traveler's shipping address (auto-filled when available)
   - Affiliate ID appended to URL

3. **In Chat Screen**: Requester sees purchase button with:
   - Pre-filled affiliate link
   - Traveler's shipping address (copyable)
   - Direct link to retailer's website

## Affiliate Program Signup

- **West Marine**: Sign up at [West Marine Affiliate Program](https://www.westmarine.com/affiliate-program)
- **SVB**: Contact SVB directly for affiliate partnership
- **Amazon**: Sign up at [Amazon Associates](https://affiliate-program.amazon.com/)

## Address Auto-Fill

The system attempts to auto-fill shipping addresses, but:
- Some retailers don't support URL-based address pre-fill
- Users may need to manually copy/paste the address
- The address is displayed in a copyable format for easy use

## Testing

To test affiliate links:
1. Post a request with a retailer selected
2. Create a match
3. Check the purchase link button in the chat
4. Verify affiliate ID is appended to URL

