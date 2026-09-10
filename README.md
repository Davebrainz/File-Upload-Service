# React + Vite

## API configuration

API requests use the current site by default, so deployments with the included Vercel routes do not need an API URL. During local Vite development, `/api` is proxied to `http://localhost:4000` by default. To use a separate API deployment, set `VITE_API_BASE_URL` to its base URL, without a trailing slash:

```text
VITE_API_BASE_URL=https://your-api.example.com
```

The API uses Render PostgreSQL for account data and Supabase Storage for uploaded files. The frontend can stay on Vercel while the backend runs on Render; Vercel proxies API requests to the Render service and does not need Supabase credentials.

## Render PostgreSQL setup

Create a PostgreSQL database in Render and add its internal `DATABASE_URL` to the Render Web Service. The server creates the `users` table automatically on its first request. No manual SQL migration is required.

```text
DATABASE_URL=postgresql://...
```

Do not put `DATABASE_URL` in Vercel. It is a backend-only secret.

If existing accounts must be preserved, run this once from the repository root after setting `DATABASE_URL` locally:

```text
npm run migrate:users
```

The migration copies the password hashes and usernames from `server/users.json`; it does not print passwords.

## Supabase Storage setup

Create a public Storage bucket named `uploads`, then add these variables to the Render Web Service:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=uploads
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and should be configured only on Render. The server falls back to the anon key when the service-role key is not present, in which case Supabase Storage policies must allow uploads. Make the bucket public so shared links open directly. The server accepts files up to 50 MB, and the frontend validates supported file types and the same size limit.

## Cloudinary

Cloudinary is no longer used by the application. You can delete these variables from both Vercel and Render if they exist:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

They are not needed for PostgreSQL or Supabase Storage. If another future backend feature uses Cloudinary, put those variables on that backend service only, never in the frontend Vercel project.

## Render deployment

Deploy the API as a Render Web Service from the repository root:

```text
Build command: npm install
Start command: npm start
```

The production start command does not load `.env.local`. Add deployment variables in Render's Environment settings instead. Configure these on the Web Service:

```text
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=uploads
```

Deploy the Vite frontend to Vercel using the included `vercel.json`. It proxies `/api/*` and `/uploads/*` to `https://file-upload-service-ydue.onrender.com`, so Supabase and PostgreSQL variables belong only on the Render Web Service.

Deploying the Vite frontend as a separate Render Static Site is also supported:

```text
Build command: npm install && npm run build
Publish directory: dist
```

If the frontend is deployed to Render instead, set this frontend variable on the Render Static Site to the Render Web Service URL, without a trailing slash:

```text
VITE_API_BASE_URL=https://your-api-service.onrender.com
```

Redeploy both services after changing environment variables.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
