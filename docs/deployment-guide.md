# MessMate Production Deployment Guide
**Baramati Messwala – Smart Mess & Tiffin Management System**
*Architected & Developed by Devidas Pund*

---

## 1. Architecture Overview
MessMate consists of three core components:
1. **Frontend**: React + Vite SPA (optimized for Vercel / Netlify / Cloudflare Pages)
2. **Backend**: Node.js + Express REST API (optimized for Render / Railway / AWS EC2)
3. **Database**: PostgreSQL with Prisma ORM (Neon, Supabase, Railway, AWS RDS, or Render Postgres)

---

## 2. Database Setup (PostgreSQL)
1. Create a managed PostgreSQL database on Neon, Supabase, or Railway.
2. Obtain your connection string:
   ```
   postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require
   ```
3. Run migrations and seed data:
   ```bash
   cd backend
   npx prisma db push
   node prisma/seed.js
   ```

---

## 3. Backend Deployment (Render or Railway)
### Environment Variables
Configure the following in your hosting provider's dashboard:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require"
JWT_SECRET="generate_a_64_char_secure_random_hex_string"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="https://your-messmate-frontend.vercel.app"

# WhatsApp Business Cloud API (Optional - uses Mock Provider if blank)
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN="your_meta_system_user_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_meta_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_meta_waba_id"
WHATSAPP_API_VERSION="v21.0"
```

### Build & Start Commands
- **Build Command**: `cd backend && npm install && npx prisma generate`
- **Start Command**: `cd backend && node src/server.js`

---

## 4. Frontend Deployment (Vercel)
1. Connect your repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure **Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add Rewrites in `vercel.json` (or Vite proxy configuration) so API calls route to your backend URL:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-backend-api.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://your-backend-api.onrender.com/uploads/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 5. Persistent File Storage in Production
For production deployment, replace the local Multer disk storage in `backend/src/middleware/upload.js` with AWS S3, Cloudinary, or Supabase Storage bucket for permanent storage of uploaded customer profile photos and UPI payment screenshots.
