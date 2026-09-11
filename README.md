# React + Vite

## API configuration

API requests use the current site by default, so deployments with the included Vercel routes do not need an API URL. During local Vite development, `/api` is proxied to `http://localhost:4000` by default. To use a separate API deployment, set `VITE_API_BASE_URL` to its base URL, without a trailing slash:

```text
VITE_API_BASE_URL=https://your-api.example.com
```

The API runs as a Vercel Node function. It uses PostgreSQL for account data and Supabase Storage for uploaded files.

## PostgreSQL setup

Create a PostgreSQL database and add its `DATABASE_URL` to the Vercel project. The server creates the `users` table automatically on its first request. No manual SQL migration is required.

```text
DATABASE_URL=postgresql://...
```

`DATABASE_URL` is a backend-only secret. Keep it out of frontend-exposed variables.

If existing accounts must be preserved, run this once from the repository root after setting `DATABASE_URL` locally:

```text
npm run migrate:users
```

The migration copies the password hashes and usernames from `server/users.json`; it does not print passwords.

## Supabase Storage setup

Create a public Storage bucket named `uploads`, then add these variables to the Vercel project:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=uploads
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and should be configured only in Vercel's server environment. Make the bucket public so shared links open directly. The server accepts files up to 50 MB, and the frontend validates supported file types and the same size limit.

## Cloudinary

Cloudinary is no longer used by the application. You can delete these variables from both Vercel and Render if they exist:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

They are not needed for PostgreSQL or Supabase Storage. If another future backend feature uses Cloudinary, put those variables on that backend service only, never in the frontend Vercel project.

## Vercel deployment

Deploy the repository to Vercel from the repository root:

```text
Build command: npm run build
Output directory: dist
```

Add these deployment variables in Vercel's Project Settings > Environment Variables:

```text
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=uploads
```

Do not set `VITE_API_BASE_URL` for this deployment. The frontend calls the Vercel `/api/*` function on the same domain. Redeploy after changing environment variables.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
