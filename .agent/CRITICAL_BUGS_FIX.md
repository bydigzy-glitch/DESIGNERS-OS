# Critical Bugs Fix Summary

## Issues Identified

1. **QuotaExceededError** - localStorage is full, causing app crashes
2. **Notifications not working** - Not loading from Supabase
3. **Data not persisting** - Habits and chat disappearing after refresh
4. **System crashes** - When clicking tasks

## Root Causes

1. localStorage quota exceeded (5-10MB limit)
2. Notifications only loaded from localStorage, not Supabase
3. No error handling for storage failures
4. Missing Supabase notification subscription

## Fixes Required

### 1. Immediate Fix - Add Notification Loading from Supabase

Location: `App.tsx` in `loadData()` function

Add after loading other data:

```typescript
// Load notifications from Supabase
try {
    const { data: notifications } = await dbNotifications.getByUser(user.id);
    if (notifications) {
        setNotifications(notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            timestamp: new Date(n.created_at),
            read: n.read,
            actionData: n.action_type ? {
                type: n.action_type,
                teamId: n.team_id,
                teamName: n.team_name,
                taskId: n.task_id,
                taskTitle: n.task_title
            } : undefined
        })));
    }
} catch (e) {
    console.error('[Supabase] Notifications load failed:', e);
}
```

### 2. Add Real-time Notification Subscription

Location: `App.tsx` in `useEffect` after `loadData()`

```typescript
// Subscribe to notifications
if (!user.isGuest) {
    const unsubNotifications = subscribeToNotifications(user.id, (payload) => {
        if (payload.eventType === 'INSERT') {
            const newNotif = payload.new;
            addNotification({
                id: newNotif.id,
                title: newNotif.title,
                message: newNotif.message,
                type: newNotif.type,
                timestamp: new Date(newNotif.created_at),
                read: newNotif.read,
                actionData: newNotif.action_type ? {
                    type: newNotif.action_type,
                    teamId: newNotif.team_id,
                    teamName: newNotif.team_name
                } : undefined
            });
        }
    });
    
    return () => {
        unsubNotifications();
    };
}
```

### 3. Fix localStorage Quota Issues

- Replace all `localStorage.setItem` with `safeStorage.setItem`
- Add try-catch blocks around all storage operations
- Clear old/unused data automatically

### 4. Update Notification Actions

Location: `App.tsx` - `handleMarkNotificationRead` and `handleClearNotifications`

Add Supabase updates:

```typescript
const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    if (!user?.isGuest) {
        try {
            await dbNotifications.markAsRead(id);
        } catch (e) {
            console.error('[Supabase] Mark notification read failed:', e);
        }
    }
};

const handleClearNotifications = async () => {
    setNotifications([]);
    
    if (!user?.isGuest) {
        try {
            await dbNotifications.clearAll(user.id);
        } catch (e) {
            console.error('[Supabase] Clear notifications failed:', e);
        }
    }
};
```

### 5. Fix Team Invite Response

Update `handleTeamInviteResponse` to delete notification from Supabase:

```typescript
const handleTeamInviteResponse = async (teamId: string, accept: boolean, notificationId: string) => {
    if (!user) return;

    const result = Backend.teams.respondToInvite(teamId, user.id, accept);

    if (result.success) {
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Delete from Supabase
        if (!user.isGuest) {
            try {
                await dbNotifications.delete(notificationId);
            } catch (e) {
                console.error('[Supabase] Delete notification failed:', e);
            }
        }

        if (accept) {
            // Update user state with new teamId
            const updatedUser = storageService.getUser(user.id);
            if (updatedUser) setUser(updatedUser);

            addNotification({
                id: `team-accepted-${Date.now()}`,
                title: 'Team Joined',
                message: result.message,
                type: 'SUCCESS',
                timestamp: new Date(),
                read: false
            });
        }
    } else {
        alert(result.message);
    }
};
```

## Testing Steps

1. Clear browser localStorage completely
2. Log in fresh
3. Invite a friend to team
4. Friend should see notification immediately (via realtime)
5. Verify habits and chat persist after refresh

## Priority

1. HIGH - Add notification loading from Supabase
2. HIGH - Add notification realtime subscription  
3. MEDIUM - Fix localStorage quota handling
4. LOW - Optimize storage usage
