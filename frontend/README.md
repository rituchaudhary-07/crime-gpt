# CrimeGPT frontend

## Local development

1. From the repository root, activate the Python virtual environment and run
   `python -m backend.run`. The API health probe will be available at
   `http://127.0.0.1:8000/health`.
2. In `frontend`, copy `.env.example` to `.env.local` if the API is not running
   at the default address, then run `npm run dev`.

For separate deployment, set `VITE_API_URL` in the frontend host to the public
FastAPI URL with `/api` appended, and set the backend's `CORS_ORIGINS` to the
exact frontend origin. Vite exposes `VITE_*` values at build time, so redeploy
the frontend after changing it.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
