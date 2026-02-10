# 🚀 Typely Production Deployment Guide

## Complete Setup Instructions

### ✅ What's Been Implemented

Your Typely app now has:
- **Secure Admin Authentication** with role-based access control
- **Complete Admin Dashboard** with CRUD operations
- **Database Security** with Row-Level Security (RLS) policies
- **Global Security Headers** for OWASP compliance
- **Lesson Management** - Create, edit, delete lessons
- **Category Management** - Manage lesson categories
- **Settings Management** - Configure site settings
- **Protected Routes** - Admin routes require authentication

---

## 📋 Phase 1: Database Setup (REQUIRED FIRST)

### Step 1: Apply SQL Schema

1. Open [Supabase Dashboard](https://app.supabase.com) → Select your project
2. Navigate to **SQL Editor** → Click **New Query**
3. Copy ALL content from this file: [`supabase_admin_schema.sql`](supabase_admin_schema.sql)
4. Paste into SQL Editor
5. Click **Run** button

**Expected Output:**
```
Query executed successfully
```

**What this does:**
- Creates `categories` table for lesson categories
- Creates `site_settings` table for site configuration
- Enables Row Level Security (RLS) on both tables
- Creates RLS policies for admin-only operations
- Inserts default site settings

---

## 🔐 Phase 2: Create First Admin User

### Step 1: Create Auth User

1. Go to Supabase → **Authentication** → **Users**
2. Click **Add User** button
3. Fill in:
   - **Email:** `admin@miaoda.com` (or your preferred admin email, but must follow `{username}@miaoda.com` format)
   - **Password:** Strong password (min 6 chars, recommended 12+)
   - **Auto Confirm User:** ✓ Check this box
4. Click **Create User**
5. **Copy the user's UUID** (visible in the user row)

### Step 2: Promote User to Admin

1. Go to **SQL Editor** → **New Query**
2. Paste this SQL (replace `{UUID}` with the copied UUID):

```sql
INSERT INTO public.profiles (id, email, username, role) 
VALUES (
  '{UUID}',
  'admin@miaoda.com',
  'admin',
  'admin'
);
```

3. Click **Run**

**Example:**
```sql
INSERT INTO public.profiles (id, email, username, role) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@miaoda.com',
  'admin',
  'admin'
);
```

---

## 🧪 Phase 3: Local Testing (Optional)

### Test Locally Before Deploying

```bash
# Start development server
npm run dev
# or
pnpm dev
```

Browser will open to `http://localhost:5174` (or similar port)

#### Test User Signup/Login
1. Go to `http://localhost:5174/signup`
2. Create a regular user account (e.g., `testuser@miaoda.com`)
3. Fill in profile details (optional)
4. You should be redirected to `/dashboard`
5. Try to access `/admin/login` → Should redirect to `/admin/login` (users can't access admin)

#### Test Admin Login
1. Go to `http://localhost:5174/admin/login`
2. Username: `admin`
3. Password: (the one you set in Step 1)
4. You should be redirected to `/admin/dashboard`

#### Test Admin Features
- ✅ Dashboard - View statistics
- ✅ Users - View all users
- ✅ Lessons - Create/edit/delete lessons
- ✅ Categories - Create/edit/delete categories
- ✅ Settings - Update site settings
- ✅ Sidebar navigation between admin pages

---

## ⬆️ Phase 4: Deploy to Vercel

### Option A: Using Git (Recommended)

```bash
# Commit all changes
git add .
git commit -m "feat: Add complete admin panel with RLS and security"

# Push to your repository
git push origin main
# (or your main branch name)
```

Vercel will automatically:
1. Detect changes
2. Run build: `npm run build`
3. Deploy to production
4. Apply security headers from `vercel.json`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

---

## 🔒 Phase 5: Post-Deployment Verification

### 1. Check Security Headers

Open DevTools (F12) in any browser, go to Network tab, and refresh the page.

Look for these headers in response headers:
- ✅ `x-frame-options: DENY`
- ✅ `x-content-type-options: nosniff`
- ✅ `strict-transport-security: max-age=...`
- ✅ `referrer-policy: strict-origin-when-cross-origin`

### 2. Test Login Flow

**Regular User:**
1. Go to `https://your-domain.com/login`
2. Sign up or login with user credentials
3. Should see `/dashboard`

**Admin User:**
1. Go to `https://your-domain.com/admin/login`
2. Login with admin credentials
3. Should see `/admin/dashboard`

### 3. Test Admin Features

From admin dashboard, verify:
- [ ] Can view user list
- [ ] Can access lessons page
- [ ] Can create new lesson
- [ ] Can edit existing lesson
- [ ] Can delete lesson
- [ ] Can create category
- [ ] Can update site settings

### 4. Check RLS is Working

**Admin User:**
- Should be able to read/write lessons, categories, settings
- Should be able to see all user profiles

**Regular User:**
- Should only be able to read lessons/categories
- Cannot see other user profiles

---

## 🚨 Common Issues & Fixes

### Issue: "Admin accounts must sign in from /admin/login"

**Solution:** Admins trying to login from `/login` will see this message. This is intentional for security.
- Admins: Use `/admin/login`
- Users: Use `/login`

### Issue: "Cannot access admin pages"

**Possible Causes:**
1. Not logged in as admin → Go to `/admin/login`
2. User role not set to "admin" in database
   
**Fix:** In Supabase SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '{your_user_id}';
```

### Issue: "Profile not found" after signup

**Possible Cause:** Signup trigger didn't create profile row

**Fix:** Manually insert profile:
```sql
INSERT INTO public.profiles (id, email, username, role) 
VALUES ('{auth_user_id}', 'user@miaoda.com', 'username', 'user');
```

### Issue: "RLS violation" errors

**Cause:** User doesn't have permission to access data

**Solution:** Check that RLS policies are correctly applied in Supabase SQL:
```bash
# Run supabase_admin_schema.sql again in Supabase SQL Editor
```

---

## 📊 Admin Dashboard Features

### Dashboard Overview (`/admin/dashboard`)
- Total users count
- Active users today
- Total typing tests
- Average typing speed (WPM)
- Average accuracy
- User growth chart
- Quick action buttons

### User Management (`/admin/users`)
- View all users with email, role, signup date
- Search users
- View user details

### Lesson Management (`/admin/lessons`)
- View all lessons with title, category, difficulty
- Search lessons
- Filter by difficulty/category
- Create new lesson
- Edit lesson
- Delete lesson

### Category Management (`/admin/categories`)
- View all categories
- Create new category
- Edit category name
- Delete category

### Settings (`/admin/settings`)
- Change site name
- Update logo URL
- Set theme color
- Enable/disable ads

---

## 🔐 Security Features Implemented

### Authentication & Authorization
- ✅ Separate admin login route (`/admin/login`)
- ✅ Admins cannot use public login (`/login`)
- ✅ Protected admin routes with `ProtectedAdminRoute` component
- ✅ Role-based access control (RBAC)
- ✅ Session management via Supabase Auth

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admin-only operations protected by policies
- ✅ User data isolation
- ✅ `is_admin()` helper function for permission checks

### API Security
- ✅ Global security headers via `vercel.json`
- ✅ X-Frame-Options: DENY (prevent clickjacking)
- ✅ X-Content-Type-Options: nosniff (prevent MIME sniffing)
- ✅ HSTS: 63,072,000 seconds (2 years with preload)
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: geolocation(), microphone() disabled

---

## 📁 Key Implementation Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | App routing - separates admin from main layout |
| `src/components/admin/ProtectedAdminRoute.tsx` | Guard component for admin routes |
| `src/contexts/AuthContext.tsx` | Auth logic with profile role fetching |
| `src/pages/admin/AdminDashboardPage.tsx` | Admin dashboard with stats |
| `src/pages/admin/AdminLessonsPage.tsx` | Lesson CRUD management |
| `src/pages/admin/AdminCategoriesPage.tsx` | Category CRUD management |
| `src/pages/admin/AdminSettingsPage.tsx` | Site settings management |
| `src/components/layouts/AdminLayout.tsx` | Admin UI layout with sidebar |
| `supabase_admin_schema.sql` | Database schema + RLS policies |
| `vercel.json` | Security headers + rewrites |

---

## 🎯 Next Steps (Optional Enhancements)

### Rate Limiting
Add rate limiting for admin operations:
```bash
# Create Vercel Edge Function or Supabase Edge Function
# to prevent brute-force attacks
```

### Email Notifications
- Admin notifications on new user signup
- Activity digest emails

### Audit Logging
- Log all admin actions
- Track who edited/deleted what and when

### Content Moderation
- Admin approval for new content
- User suspension/ban features

### Analytics Dashboard
- User engagement metrics
- Typing statistics trends
- Content popularity

---

## 📞 Support & Troubleshooting

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click **Logs** → **Database**
3. Look for RLS violations or query errors

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Select your deployment
3. View **Deployments** → **Function Logs**

### Enable Debug Mode
In browser DevTools Console:
```javascript
// This will show API requests
localStorage.setItem('debug', '*')
```

---

## ✅ Deployment Checklist

- [ ] Applied `supabase_admin_schema.sql` to Supabase
- [ ] Created admin user in Supabase Auth
- [ ] Ran SQL INSERT to promote user to admin
- [ ] Tested locally with npm run dev
- [ ] Verified login/signup flow works
- [ ] Verified admin features accessible
- [ ] Pushed code to Git repository
- [ ] Verified Vercel deployment successful
- [ ] Checked security headers in production
- [ ] Tested admin login on production URL
- [ ] Verified RLS policies working
- [ ] Documented admin credentials securely

---

## 🎉 You're Done!

Your Typely app is now **100% production-ready** with:
- ✅ Secure admin authentication
- ✅ Role-based authorization
- ✅ Database security with RLS
- ✅ Global security headers
- ✅ CRUD admin panel
- ✅ OWASP compliance

**Start using admin features at:** `https://your-domain.com/admin/login`

---

**Last Updated:** February 8, 2026
**Version:** 1.0.0
