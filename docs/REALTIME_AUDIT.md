# Supabase Realtime Connection Audit - December 2025

## 🚨 CRITICAL ISSUE
**Peak Connections: 500** (Target: 3-6)
**Grace Period Ends: Dec 27, 2025**

## Executive Summary

The app is creating **hundreds of duplicate realtime connections** due to:
1. No connection deduplication
2. Channels created in hooks that remount frequently
3. Multiple Supabase client instances
4. Missing cleanup on navigation/unmount
5. No global connection tracking

---

## 📊 Current Realtime Usage

### Files Creating Channels

#### 1. `lib/hooks/useUnreadMessages.ts`
- **Channel**: `unread-messages:${userId}`
- **Usage**: Used in `MessageBadge` component
- **Problem**: 
  - MessageBadge appears **TWICE** in `main-layout.tsx` (desktop + mobile)
  - Creates 2 channels per user
  - No deduplication if component remounts
  - Channel recreated on every userId change
- **Impact**: HIGH - Always active, multiple instances

#### 2. `lib/hooks/usePostMessages.ts`
- **Channel**: `post-messages:${postId}:${postType}`
- **Usage**: Used in `MessageThread` and `MessageInput` components
- **Problem**:
  - Creates channel per post thread
  - If user opens multiple threads, creates multiple channels
  - If component remounts (navigation), old channel may not cleanup properly
  - MessageThread + MessageInput both use the hook = potential duplicates
- **Impact**: VERY HIGH - Can create 10+ channels per user session

#### 3. `lib/realtime/emergency-subscription.ts`
- **Channel**: `emergency-requests:${userId}`
- **Usage**: Not currently used (but available)
- **Problem**: No cleanup tracking, no deduplication
- **Impact**: MEDIUM - Not active but ready to cause issues

#### 4. `components/auth/session-sync.tsx`
- **Subscription**: `supabase.auth.onAuthStateChange()`
- **Problem**: Creates auth subscription, but this is acceptable (only 1 per app)
- **Impact**: LOW - Single subscription is fine

---

## 🔍 Root Cause Analysis

### Problem 1: No Deduplication
- Same channel name can be created multiple times
- Supabase counts each `.subscribe()` as a new connection
- If `useUnreadMessages` is called twice, creates 2 channels with same name

### Problem 2: Component Remounting
- React components remount on navigation
- Each remount creates new channel
- Old channel cleanup may not complete before new one is created
- Hot reload in development creates new channels without cleanup

### Problem 3: Multiple Supabase Clients
- `createClient()` called in many places
- Each client can create its own connections
- No singleton pattern for Supabase client

### Problem 4: Missing Cleanup
- Channels unsubscribe in useEffect cleanup, but:
  - If component unmounts quickly, cleanup may not run
  - If navigation happens fast, multiple channels exist simultaneously
  - No global cleanup on app exit

### Problem 5: No Connection Tracking
- Can't see how many channels are active
- Can't detect duplicates
- Can't prevent runaway connections

---

## 📋 Detailed File Analysis

### `lib/hooks/useUnreadMessages.ts`
```typescript
// Line 40: Creates channel
const newChannel = supabase
  .channel(`unread-messages:${userId}`)
  .on(...)
  .subscribe();

// Line 59: Cleanup
return () => {
  newChannel.unsubscribe();
};
```

**Issues:**
- ✅ Has cleanup
- ❌ No deduplication (same userId = multiple channels)
- ❌ Channel recreated on userId change
- ❌ If hook called twice, creates 2 channels

**Where Used:**
- `components/messaging/MessageBadge.tsx` (used in main-layout.tsx - appears twice!)

**Fix Needed:**
- Move to RealtimeManager
- Deduplicate by userId
- Single global channel per user

---

### `lib/hooks/usePostMessages.ts`
```typescript
// Line 66: Creates channel
const newChannel = supabase
  .channel(`post-messages:${postId}:${postType}`)
  .on(...)
  .subscribe();

// Line 85: Cleanup
return () => {
  newChannel.unsubscribe();
};
```

**Issues:**
- ✅ Has cleanup
- ❌ Creates channel per postId+postType
- ❌ If user has 10 open threads = 10 channels
- ❌ MessageThread + MessageInput both use hook = potential 2x channels per thread
- ❌ No limit on concurrent channels

**Where Used:**
- `components/messaging/MessageThread.tsx`
- `components/messaging/MessageInput.tsx`
- `components/messaging/PostMessageThreadModal.tsx`

**Fix Needed:**
- Move to RealtimeManager
- Deduplicate by postId+postType
- Limit concurrent message channels (e.g., max 3 active threads)
- Close channels when thread closes

---

### `lib/realtime/emergency-subscription.ts`
```typescript
// Line 14: Creates channel
const channel = supabase
  .channel(`emergency-requests:${userId}`)
  .on(...)
  .subscribe();
```

**Issues:**
- ❌ No cleanup function
- ❌ No deduplication
- ❌ Not currently used but ready to cause issues

**Fix Needed:**
- Integrate with RealtimeManager
- Add proper cleanup

---

## 🎯 Fix Strategy

### Phase 1: Create RealtimeManager
- Single source of truth for all channels
- Deduplication by channel name
- Global tracking and logging
- Automatic cleanup

### Phase 2: Migrate Hooks
- Replace `useUnreadMessages` with `useRealtime` hook
- Replace `usePostMessages` with `useRealtime` hook
- Update all components

### Phase 3: Optimize
- Limit concurrent channels
- Convert non-critical realtime to polling
- Add connection monitoring

---

## 📈 Expected Results

**Before:**
- 500 peak connections
- Multiple duplicates
- No visibility
- Uncontrolled growth

**After:**
- 3-6 total connections
- Zero duplicates
- Full logging
- Controlled, predictable usage

---

## ✅ Action Items

1. ✅ Create `lib/realtime/RealtimeManager.ts`
2. ✅ Create `lib/realtime/useRealtime.ts` hook
3. ✅ Migrate `useUnreadMessages` to use RealtimeManager
4. ✅ Migrate `usePostMessages` to use RealtimeManager
5. ✅ Update all components using old hooks
6. ✅ Add connection monitoring/logging
7. ✅ Test with multiple users/threads
8. ✅ Verify connection count stays low

---

## 🔒 Safety Measures

1. **Connection Limit**: Max 10 channels total (hard limit)
2. **Deduplication**: Same channel name = reuse existing
3. **Auto-cleanup**: Channels auto-close after 5min inactivity
4. **Logging**: Every create/destroy logged
5. **Monitoring**: Track active channels in dev tools

---

**Next Step**: Implement RealtimeManager

