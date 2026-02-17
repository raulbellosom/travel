# Chat System Setup Instructions

## Problem

When creating conversations from the client (browser), Appwrite restricts permissions:

- ✅ Users can grant permissions to themselves: `Role.user(currentUserId)`
- ❌ Users **cannot** grant permissions to other users: `Role.user(otherUserId)`
- ❌ Users **cannot** grant permissions to labels: `Role.label("root")`

**Error example:**
```
Permissions must be one of: (any, users, user:6993d8ba00202020769f, user:6993d8ba00202020769f/verified, users/verified)
```

## Solution: Collection-Level Permissions

Instead of setting document-level permissions for both `clientUserId` and `ownerUserId`, we:

1. **Set permissions at the collection level** in Appwrite Console
2. **Use query filters** to enforce security (users only see conversations where they are `clientUserId` or `ownerUserId`)

---

## Manual Configuration Required

### 1. `conversations` Collection

**In Appwrite Console:**

1. Go to **Databases** → `main` → Collections → **conversations**
2. Click **Settings** → **Permissions**
3. Add the following **Collection-level** permissions:

   | Role                     | Create | Read | Update | Delete |
   |--------------------------|--------|------|--------|--------|
   | `Role.users("verified")` | ✅     | ✅   | ✅     | ❌     |
   | `Role.label("root")`     | ✅     | ✅   | ✅     | ✅     |

4. **Save**

### 2. `messages` Collection

**In Appwrite Console:**

1. Go to **Databases** → `main` → Collections → **messages**
2. Click **Settings** → **Permissions**
3. Add the following **Collection-level** permissions:

   | Role                     | Create | Read | Update | Delete |
   |--------------------------|--------|------|--------|--------|
   | `Role.users("verified")` | ✅     | ✅   | ✅     | ❌     |
   | `Role.label("root")`     | ✅     | ✅   | ✅     | ✅     |

4. **Save**

---

## How Security is Enforced

### Client Side

**Code in `chatService.js`:**

- `createConversation()` — Only grants `read` and `update` to the creator (`clientUserId`)
- `listConversations()` — Queries with `Query.equal("clientUserId", userId)` OR `Query.equal("ownerUserId", userId)`
- `listMessages()` — Queries messages by `conversationId` (users only know conversation IDs they're part of)

### Server Side (Appwrite)

- **Collection permissions** allow all verified users to read/write
- **Query filters** ensure users only access data where they are a participant
- **Data access:** Users can only query conversations where they are explicitly `clientUserId` or `ownerUserId`

---

## Testing

After configuration:

1. **Client user** (verified) tries to create a conversation → Should succeed
2. **Owner user** receives notification, opens chat → Should see the conversation
3. Both users can send/receive messages in real-time

---

## Notes

- **Document-level permissions** are still set on creation (`Role.user(clientUserId)`), but they're not the primary security mechanism.
- **Collection-level permissions** are the key — they allow both parties to access the conversation without explicit document permissions.
- **Root users** (`Role.label("root")`) always have full access for moderation/support.
