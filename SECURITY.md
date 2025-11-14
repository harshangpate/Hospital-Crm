# 🔒 Security Guidelines

## Important Security Notice

This repository does **NOT** include any seed files or default credentials for security reasons. You must create your own admin accounts and test data.

## First-Time Setup

### 1. Environment Variables

**Never commit `.env` files!** They are already in `.gitignore`.

Copy the example files and fill in your own values:

```bash
# Server
cp server/.env.example server/.env

# Client  
cp client/.env.example client/.env.local
```

### 2. Database Configuration

Edit `server/.env` and set your database credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/hospital_crm"
```

### 3. JWT Secret

Generate a strong JWT secret (minimum 32 characters):

```bash
# Linux/Mac
openssl rand -base64 32

# Or use any strong random string generator
```

Update in `server/.env`:
```env
JWT_SECRET="your-generated-secret-key-here"
```

### 4. Email Configuration (Optional)

If using Gmail:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update in `server/.env`:

```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

### 5. Create Your First Admin User

After running migrations, create an admin account:

**Method 1: Prisma Studio (Easiest)**
```bash
cd server
npx prisma studio
```
Then:
1. Open the `users` table
2. Click "Add record"
3. Fill in:
   - email: `admin@yourdomain.com`
   - username: `admin`
   - password: Use a bcrypt hash (see below)
   - role: `SUPER_ADMIN`
   - firstName: `Your Name`
   - lastName: `Your Last Name`
   - isActive: `true`
   - isEmailVerified: `true`

**Method 2: Direct SQL**

First, generate a bcrypt hash of your password:
```javascript
// Run in Node.js console
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-secure-password', 10);
console.log(hash);
```

Then run this SQL in your PostgreSQL client:
```sql
INSERT INTO users (
  email, username, password, role, 
  "firstName", "lastName", 
  "isActive", "isEmailVerified"
) VALUES (
  'admin@yourdomain.com',
  'admin',
  '$2a$10$...(your-bcrypt-hash-here)...',
  'SUPER_ADMIN',
  'Admin',
  'User',
  true,
  true
);
```

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords
- Change all default configurations
- Enable HTTPS in production
- Use environment variables for sensitive data
- Regularly update dependencies
- Implement rate limiting
- Enable CORS only for trusted domains
- Use prepared statements (Prisma handles this)
- Hash passwords with bcrypt (minimum 10 rounds)
- Validate all user inputs
- Implement proper authentication checks
- Log security events

### ❌ DON'T:
- Commit `.env` files
- Use default/weak passwords
- Expose sensitive data in error messages
- Trust client-side validation alone
- Store passwords in plain text
- Use the same JWT secret across environments
- Allow unrestricted file uploads
- Expose internal API structure in production

## Production Deployment Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS/SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure proper error logging (hide stack traces)
- [ ] Review and minimize exposed API endpoints
- [ ] Set up monitoring and alerts
- [ ] Configure database connection pooling
- [ ] Use secure session management
- [ ] Implement SQL injection protection (Prisma handles this)
- [ ] Set up CSP headers
- [ ] Configure secure cookie settings
- [ ] Enable HSTS headers
- [ ] Implement XSS protection
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Healthcare Compliance

⚠️ **Important**: This is a demonstration project. For production use in healthcare:

- Ensure HIPAA compliance (US)
- Implement GDPR compliance (EU)
- Follow local healthcare data regulations
- Conduct security audit by professionals
- Implement proper data encryption
- Set up audit logging
- Establish data retention policies
- Implement access controls
- Get proper legal review

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly instead of opening a public issue.

## Password Requirements

When creating accounts, enforce:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords (use a password strength library)

## Session Management

- JWT tokens expire after 7 days (configurable)
- Implement token refresh mechanism
- Store tokens securely (httpOnly cookies recommended)
- Implement logout functionality that invalidates tokens

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Guidelines](https://gdpr.eu/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Remember**: Security is not a one-time task but an ongoing process. Stay vigilant and keep learning!
