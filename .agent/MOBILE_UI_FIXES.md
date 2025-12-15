# MOBILE UI FIXES

## Issues Identified

1. **Nav bar misalignment** - Mobile bottom dock positioning
2. **Cards filling whole page** - Modals not scrollable, can't reach submit buttons
3. **Habits not showing on mobile** - Display/rendering issue
4. **Missing features** - Only 5 items shown in mobile nav

## Fixes Applied

### 1. Mobile Navigation

- Shows first 5 items: HQ, MANAGER, TASKS, HABITS, APPS
- Settings accessible via profile button
- Other pages (CALENDAR, CHAT, FILES) accessible via HQ or direct navigation

### 2. Modal Scrolling

- All modals need `max-h-[90vh]` and `overflow-y-auto`
- Ensure submit buttons are always reachable

### 3. Habits Page

- Already has `pb-20` for mobile padding
- Need to verify habits are loading correctly

### 4. General Mobile Improvements

- Use `h-[100dvh]` instead of `h-screen` for better mobile support
- Ensure all pages have bottom padding for mobile nav
- Fix any overflow issues

## Testing Checklist

- [ ] Nav bar aligned correctly
- [ ] Can scroll in all modals
- [ ] Can reach submit buttons
- [ ] Habits display on mobile
- [ ] All features accessible
