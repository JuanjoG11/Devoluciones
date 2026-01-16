# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup

#### Create Indexes in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database-indexes.sql` from your project
4. Copy and paste the entire content
5. Click **Run** to execute all index creation statements
6. Verify indexes were created:
   ```sql
   SELECT tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public'
   ORDER BY tablename, indexname;
   ```

**Expected indexes:**
- `idx_routes_date` - Critical for dashboard performance
- `idx_routes_username` - For TYM auxiliaries
- `idx_return_items_route_id` - For fetching returns by route
- `idx_return_items_created_at` - For recent returns
- `idx_return_items_duplicate_check` - Prevents duplicate entries
- And more (see `database-indexes.sql`)

#### Enable Row Level Security (RLS) - RECOMMENDED

For production security, enable RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their organization's data
-- Adjust based on your security requirements
CREATE POLICY "Users see own organization" ON users
  FOR SELECT USING (organization = current_setting('app.current_org', true));
```

### 2. Environment Configuration

The application uses the Supabase configuration in `js/supabase.js`. For production:

1. **Verify Supabase credentials** are correct in `js/supabase.js`
2. **Optional**: Create a `.env` file (if using a build system):
   - Copy `.env.example` to `.env`
   - Fill in your production values

### 3. Code Verification

✅ **Verify these files exist:**
- `js/config.js` - Performance configuration
- `js/utils/imageCompression.js` - Image optimization
- `database-indexes.sql` - Database indexes
- `.env.example` - Environment template

✅ **Check service worker version:**
- Open `sw.js`
- Verify `CACHE_NAME = 'devoluciones-v18'` or higher

### 4. Security Review

⚠️ **IMPORTANT**: The application currently has hardcoded credentials in `js/data.js`:

```javascript
{ username: 'admin', password: '123', role: 'admin' }
```

**For production, you have 3 options:**

**Option 1 (Recommended)**: Manage users directly in Supabase
- Remove seed data from code
- Create users manually in Supabase dashboard
- Use strong passwords

**Option 2**: Use environment variables
- Move credentials to environment variables
- Never commit `.env` to git

**Option 3**: Implement password hashing (future improvement)
- Use bcrypt or similar
- Requires backend changes

## Deployment Steps

### Option A: Deploy to Netlify (Recommended)

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Initialize Netlify** in your project:
   ```bash
   netlify init
   ```

3. **Configure build settings**:
   - Build command: (leave empty - static site)
   - Publish directory: `./`
   - Functions directory: (leave empty)

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

5. **Configure custom domain** (optional):
   - Go to Netlify dashboard
   - Domain settings → Add custom domain

### Option B: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure** in `vercel.json` (create if needed):
   ```json
   {
     "version": 2,
     "routes": [
       { "src": "/sw.js", "dest": "/sw.js", "headers": { "Service-Worker-Allowed": "/" } },
       { "src": "/(.*)", "dest": "/$1" }
     ]
   }
   ```

### Option C: Deploy to GitHub Pages

1. **Create `gh-pages` branch**:
   ```bash
   git checkout -b gh-pages
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Pages → Source → `gh-pages` branch
   - Save

3. **Access your app** at:
   `https://[username].github.io/[repository-name]/`

### Option D: Traditional Web Hosting

1. **Upload files** via FTP/SFTP to your web server
2. **Ensure all files** are in the web root or subdirectory
3. **Configure HTTPS** (required for PWA and service workers)
4. **Set proper MIME types**:
   - `.js` → `application/javascript`
   - `.json` → `application/json`
   - `.webmanifest` → `application/manifest+json`

## Post-Deployment Verification

### 1. Test PWA Installation

1. Open your deployed app in Chrome/Edge
2. Check for install prompt
3. Install the app
4. Verify icon appears correctly
5. Test offline functionality

### 2. Test Core Functionality

✅ **Admin Dashboard:**
- [ ] Login works
- [ ] Dashboard loads within 2 seconds
- [ ] Recent returns display correctly
- [ ] Active routes show up
- [ ] Date filtering works
- [ ] Export to Excel works
- [ ] Print reports work

✅ **Auxiliary View:**
- [ ] Login works
- [ ] Can start route
- [ ] Can register returns
- [ ] Offline mode works
- [ ] Sync works when back online
- [ ] Photos upload correctly

✅ **Performance:**
- [ ] Dashboard loads in < 3 seconds
- [ ] No console errors
- [ ] Images are compressed
- [ ] Sync completes in reasonable time

### 3. Monitor Performance

Use browser DevTools to verify:

1. **Network tab:**
   - Check initial load time
   - Verify service worker is active
   - Check for failed requests

2. **Application tab:**
   - Service Worker: Status should be "activated"
   - Cache Storage: Should show `devoluciones-v18`
   - IndexedDB: Should show `AppDevolucionesOffline`

3. **Console:**
   - No critical errors
   - Sync messages appear when offline items sync

## Performance Optimizations Applied

✅ **Database:**
- Indexes on critical columns (date, route_id, created_at)
- Date-filtered queries (default 7 days)
- Batch operations for bulk inserts

✅ **Frontend:**
- Reduced initial data load (20 returns instead of 200)
- Image compression before storage
- Batch sync (10 items at a time)
- Optimized cache management

✅ **Expected Performance:**
- Dashboard load: 1-2 seconds (down from 3-5s)
- Sync 20 items: 2-3 seconds (down from 10-15s)
- Memory usage: 50-80MB (down from 150-200MB)

## Monitoring & Maintenance

### Daily Checks
- Monitor Supabase dashboard for errors
- Check storage usage
- Review error logs

### Weekly Maintenance
- Review slow queries in Supabase
- Check for failed syncs
- Verify backup systems

### Monthly Tasks
- Review and optimize database indexes
- Clean up old test data
- Update dependencies if needed

## Rollback Procedure

If issues occur after deployment:

1. **Revert to previous version:**
   ```bash
   git revert HEAD
   git push origin main
   netlify deploy --prod  # or your deployment command
   ```

2. **Clear service worker cache:**
   - Users may need to clear browser cache
   - Or increment `CACHE_NAME` in `sw.js` to force update

3. **Database rollback:**
   - Supabase keeps automatic backups
   - Go to Database → Backups to restore

## Troubleshooting

### Issue: Dashboard loads slowly
**Solution:**
- Check database indexes are created
- Verify date filtering is working
- Check network tab for slow queries

### Issue: Offline sync fails
**Solution:**
- Check browser console for errors
- Verify Supabase connection
- Check IndexedDB storage quota

### Issue: PWA won't install
**Solution:**
- Ensure HTTPS is enabled
- Check `manifest.json` is accessible
- Verify service worker is registered
- Check browser console for errors

### Issue: Images too large
**Solution:**
- Verify `imageCompression.js` is imported
- Check `CONFIG.FEATURES.ENABLE_IMAGE_COMPRESSION = true`
- Test image compression in browser console

## Security Recommendations

🔒 **Immediate:**
1. Change all default passwords
2. Enable RLS in Supabase
3. Use HTTPS only
4. Implement rate limiting in Supabase

🔒 **Future Improvements:**
1. Implement proper authentication (Supabase Auth)
2. Add password hashing
3. Implement session management
4. Add audit logging

## Support & Contact

For issues or questions:
1. Check Supabase logs
2. Review browser console
3. Check network requests
4. Review this documentation

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Production URL:** _________________  
**Supabase Project:** _________________
