# React + Vite

## API configuration

API requests use the current site by default, so deployments with the included Vercel routes do not need an API URL. During local Vite development, `/api` is proxied to `http://localhost:4000` by default. To use a separate API deployment, set `VITE_API_BASE_URL` to its base URL, without a trailing slash:

```text
VITE_API_BASE_URL=https://your-api.example.com
```

The API uses Supabase Storage for uploaded files and account data when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_STORAGE_BUCKET` are configured. Cloudinary is used for account data only when Supabase Storage is not configured. The API base URL and storage provider are independent settings, so you can host the API wherever you prefer and change storage providers without changing frontend code.

## Supabase Storage setup

Create a public Storage bucket named `uploads`, then add these variables to Vercel in both Preview and Production before redeploying:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_STORAGE_BUCKET=uploads
```

The server sends validated multipart uploads to Supabase Storage and accepts files up to 50 MB. The frontend validates supported file types and the 50 MB maximum before uploading. Configure Storage policies that allow uploads with the anon key, and make the bucket public if shared links should open directly.

## Cloudinary storage setup

The API uses local files during local development when Cloudinary is not configured. In Vercel, configure these Cloudinary variables in Preview and Production:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

You can use `CLOUDINARY_URL` instead of the three separate variables. Uploaded files are stored as Cloudinary assets, and account records are stored as a private raw JSON asset. Redeploy after adding or changing the variables. Do not rely on `server/users.json` or `server/uploads` in production.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
