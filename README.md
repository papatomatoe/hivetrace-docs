### Install dependencies:

```bash
cd hivetrace-docs
npm install
```

### Local Development

```bash
cd hivetrace-docs
npm start
```

### Building for Production

Generate static files for production:

```bash
cd hivetrace-docs
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Testing the Build Locally

To test the production build locally:

```bash
cd hivetrace-docs
npm run serve
```
or

```bash
cd hivetrace-docs
npm run preview
```

### Deploy to GitHub Pages
This repo is configured to deploy via **GitHub Actions** to **GitHub Pages**.

1) Ensure the repository in the `hivetrace` org is named **`docs`** (so the URL is `https://hivetrace.github.io/docs/`).
2) In GitHub repo settings: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3) Push to `main` — the workflow will build `docs/` and publish automatically.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Starts the development server |
| `npm run build` | Builds the app for production |
| `npm run serve` | Serves the production build locally |
| `npm run deploy` | Deploys to GitHub Pages |
