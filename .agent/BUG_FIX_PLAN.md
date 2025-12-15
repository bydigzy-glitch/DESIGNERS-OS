# COMPREHENSIVE BUG FIX PLAN - DESIGNERS-OS

## Current Critical Issues (As of 2025-12-13)

### 1. Habits Not Persisting ❌

**Symptom**: Habits reset after page refresh
**Root Cause**: Multiple potential issues:

- Habits not being saved to Supabase correctly
- Habits not being loaded from Supabase on app start
- Data sync issues between localStorage and Supabase

### 2. Team Invitation Notifications Not Working ❌

**Symptom**: Users don't receive notifications when invited to teams
**Root Cause Chain**:

- Notifications may not be created in Supabase (RLS policy issue was fixed)
- Notifications may not be loaded on app start
- Notifications may not be displayed in UI
- Real-time subscription may not be working

### 3. Screen Flickering ❌

**Symptom**: Continuous screen flickering for some users
**Root Cause**: Likely infinite re-render loops from:

- Unstable function references in useEffect dependencies
- Failed Supabase operations retrying continuously
- CORS errors on realtime subscriptions

### 4. localStorage Quota Exceeded ❌

**Symptom**: App crashes with QuotaExceededError
**Root Cause**: localStorage fills up (5-10MB limit)

---

## IMMEDIATE ACTION PLAN

### Priority 1: Verify Database State

Before fixing code, we need to know what's in the database:

**Check these tables in Supabase:**

1. `habits` - Are habits being saved?
2. `notifications` - Are notifications being created?
3. `users` - What are the user IDs?

**How to check:**

1. Go to: <https://supabase.com/dashboard/project/xcunrqfrxbfgdcqzfecv/editor>
2. Click each table and view the data
3. Take screenshots or note down what you see

### Priority 2: Fix Habits Persistence

**Issue**: The habit toggle function updates Supabase, but there might be issues:

1. The habit might not exist in Supabase yet (never created)
2. The update might be failing silently
3. The load might not be pulling from Supabase

**Fix Steps:**

1. Verify habits are created in Supabase when first added
2. Add error logging to see if updates are failing
3. Verify habits are loaded from Supabase on app start

### Priority 3: Fix Notifications

**Issue Chain to Debug:**

1. Are notifications created in Supabase when you invite someone?
2. Are notifications loaded from Supabase on app start?
3. Are notifications displayed in the UI?
4. Is the realtime subscription working?

**Fix Steps:**

1. Add console logging to track notification creation
2. Add console logging to track notification loading
3. Verify notification UI is rendering correctly
4. Check realtime subscription setup

### Priority 4: Fix Screen Flickering

**Likely Causes:**

1. `addNotification` function recreated on every render (FIXED with useCallback)
2. Other functions in useEffect dependencies
3. Failed operations retrying

**Fix Steps:**

1. Wrap all handler functions in useCallback
2. Add error boundaries to prevent crash loops
3. Debounce Supabase operations

---

## DEBUGGING CHECKLIST

### For Habits

- [ ] Check if habits exist in Supabase `habits` table
- [ ] Check browser console for errors when toggling habit
- [ ] Check if `db.habits.update()` is being called
- [ ] Check if `db.habits.update()` is succeeding or failing
- [ ] Check if habits are loaded from Supabase on app start

### For Notifications

- [ ] Check if notifications exist in Supabase `notifications` table
- [ ] Check if notification is created when you invite someone
- [ ] Check browser console for errors during invite
- [ ] Check if `dbNotifications.create()` is being called
- [ ] Check if `dbNotifications.create()` is succeeding or failing
- [ ] Check if notifications are loaded from Supabase on app start
- [ ] Check if notifications appear in the UI after loading

### For Flickering

- [ ] Check browser console for continuous errors
- [ ] Check Network tab for continuous failed requests
- [ ] Check if any useEffect is running continuously

---

## NEXT STEPS

1. **User Action Required:**
   - Go to Supabase dashboard
   - Check `habits` table - screenshot or tell me what you see
   - Check `notifications` table - screenshot or tell me what you see
   - Check `users` table - find your friend's email and tell me their ID

2. **Developer Action (Me):**
   - Based on what you find, I'll:
     - Fix the specific broken part of the chain
     - Add comprehensive error logging
     - Add data validation
     - Deploy fixes

3. **Testing:**
   - Clear browser cache
   - Test each feature systematically
   - Report results

---

## TEMPORARY WORKAROUND

If you need the app to work NOW while we debug:

1. **For Habits**: Use localStorage only (guest mode)
2. **For Teams**: Use localStorage team system (already works)
3. **For Notifications**: They won't work cross-device but will work in localStorage

To force localStorage mode:

- Log in as guest instead of with your account
- This bypasses all Supabase issues

---

## ROOT CAUSE HYPOTHESIS

The core issue seems to be that **Supabase integration is partially broken**:

- Some operations work (login, tasks, projects)
- Some operations fail (habits, notifications)
- This suggests:
  - Missing database functions
  - RLS policy issues
  - Schema mismatches
  - Network/CORS issues

We need to systematically verify each Supabase operation.
