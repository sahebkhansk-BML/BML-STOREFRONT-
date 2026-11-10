# BML Backend Starter (Vercel + Neon PostgreSQL)

यह **starter backend** है, audited/fully production-ready commerce system नहीं। इसमें:
- Vercel Node.js Functions
- Neon PostgreSQL database
- Customer registration/login/logout (`HttpOnly`, `Secure`, `SameSite=Lax` cookie)
- Public product listing
- Admin-only product creation
- Signed-in customer order creation and order history
- Server-side price lookup and stock checks

## 1. Database बनाएँ
1. Vercel Dashboard में अपना `BML-STOREFRONT` project खोलें।
2. Storage / Marketplace से Neon Postgres integration जोड़ें, या Neon में नया project बनाएँ।
3. Neon SQL Editor में `database/schema.sql` की पूरी सामग्री चलाएँ।
4. Neon का pooled connection string कॉपी करें। उसे किसी से साझा न करें।

Neon integration: https://vercel.com/integrations/neon

## 2. Vercel Environment Variables
Project → Settings → Environment Variables में Production (और Preview यदि चाहिए) के लिए:
- `DATABASE_URL` = Neon connection string
- `JWT_SECRET` = कम-से-कम 32 अक्षरों का random secret
- `APP_ORIGIN` = `https://bmlstorefront.vercel.app`

Secrets को GitHub, frontend JavaScript या ChatGPT में कभी न डालें। `.env` फाइल commit न करें।

## 3. GitHub में जोड़ें
इस ZIP की फाइलें अपने मौजूदा `bml-storefront` repository में उसी root पर upload करें। `public/index.html` और `vercel.json` को न हटाएँ। नई `api/`, `database/`, `package.json` और `.gitignore` फाइलें जोड़ें। Commit करने पर Vercel redeploy करेगा।

## 4. Deploy और test
Deployment के बाद:
- `https://bmlstorefront.vercel.app/api/health` → database connected दिखना चाहिए।
- `GET /api/products` → product list.
- `POST /api/auth/register` body: `{"name":"Demo User","email":"demo@example.com","password":"Use-A-Long-Unique-Password"}`.
- `POST /api/auth/login` body: `{"email":"demo@example.com","password":"same password"}`.
Requests browser same-origin से करें; POST requests में Origin header होना चाहिए.

## 5. Admin account
पहले website/API से अपना customer account register करें। फिर Neon SQL Editor में नीचे query चलाएँ, email बदलकर:
`UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';`
यह केवल trusted account के लिए करें। Admin route: `POST /api/admin/products`.

## API routes
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/products`
- `POST /api/admin/products` (admin)
- `GET /api/orders` (signed in)
- `POST /api/orders` (signed in)

## Important before real customers/payments
- यह शुरुआती API है। Production launch से पहले independent security review, robust rate limiting, email verification, password reset, privacy/terms, shipping/tax rules, backups/monitoring, admin UI, cancellation/refund workflow, and automated tests जोड़ें।
- Payment processing अभी शामिल नहीं है। Payment provider secret keys कभी browser में न रखें; payment success को केवल verified server-side webhook से confirm करें।
- Order creation records a pending order; it does not charge a customer.
- For production, test with a separate database before changing live data.
