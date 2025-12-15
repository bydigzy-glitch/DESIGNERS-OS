# FILE STORAGE SUPABASE INTEGRATION

## Current Issue

Files uploaded in the FileManager are only stored in localStorage and don't sync across devices.

## Required Implementation

### 1. Database Schema

Create a `files` table in Supabase:

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  folder_id TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own files"
  ON files FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own folders"
  ON folders FOR ALL
  USING (auth.uid() = user_id);
```

### 2. Supabase Storage Bucket

- Create a storage bucket called `user-files`
- Set up RLS policies for user access
- Configure file size limits and allowed types

### 3. Code Changes Needed

#### A. `services/supabaseClient.ts`

Add file management functions:

```typescript
// File upload to Supabase Storage
async uploadFile(userId: string, file: File, path: string)

// File metadata to database
db.files.create()
db.files.getAll(userId)
db.files.delete(id)

// Folder management
db.folders.create()
db.folders.getAll(userId)
db.folders.delete(id)
```

#### B. `components/FileManager.tsx`

Update to use Supabase:

- Upload files to Supabase Storage
- Save metadata to database
- Load files from Supabase on mount
- Download files from Supabase Storage

#### C. `App.tsx`

- Load files/folders from Supabase in `loadData()`
- Remove files/folders from localStorage save

### 4. Complexity & Time Estimate

- **High Complexity** - Requires Supabase Storage setup
- **Time**: 2-3 hours for full implementation
- **Testing**: Requires upload/download testing

## Temporary Workaround

Files will continue to work locally but won't sync. Users should be aware that files are device-specific until this is implemented.

## Priority

**Medium** - Files work locally, but cross-device sync is important for user experience.

## Next Steps

1. Create Supabase tables (SQL above)
2. Set up Supabase Storage bucket
3. Implement upload/download functions
4. Update FileManager component
5. Test thoroughly
