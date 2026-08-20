# React + Vite

## Vercel storage setup

The API uses local files during local development and switches to Vercel storage in a Vercel runtime.

1. Create a Redis store through the Vercel Marketplace and connect it to this project. It must provide `KV_REST_API_URL` and `KV_REST_API_TOKEN` (Upstash may call these `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
2. Create a Vercel Blob store and add its read/write token as `BLOB_READ_WRITE_TOKEN`.
3. Make both sets of variables available in the Vercel Preview and Production environments.
4. Redeploy after connecting the stores.

Accounts are stored in KV and uploaded files are stored in Blob. Do not rely on `server/users.json` or `server/uploads` in production.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
