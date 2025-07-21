# Admin Panel Credentials

## Test Credentials for Development

### Admin Account
- **Email:** admin@trade.im
- **Password:** admin123
- **Role:** admin
- **Access:** Full admin panel access

### Regular User Account
- **Email:** test@trade.im  
- **Password:** test123
- **Role:** user
- **Access:** Standard user dashboard

## Admin Panel Features Working

✅ **User Management:**
- View all users with pagination
- Edit user details
- Toggle user status (active/suspended)
- Delete users
- Balance adjustments

✅ **Dashboard Stats:**
- Total users count
- Active/suspended user counts
- Portfolio values and statistics
- Transaction analytics

✅ **API Endpoints Fixed:**
- Proper pagination (offset-based)
- Standardized response formats
- Enhanced error handling
- Authentication verification

## Usage Instructions

1. **Start Backend Server:**
   ```bash
   cd server && npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Access Admin Panel:**
   - Login with admin credentials
   - Navigate to `/admin` or use automatic redirect
   - All admin functions should now work properly

## Recent Fixes Applied

- Fixed pagination parameter mismatch (page → offset)
- Standardized API response formats
- Added comprehensive error handling and logging
- Enhanced authentication error messages
- Improved CORS configuration for development

The admin panel should now be fully functional with all user management features working as expected.