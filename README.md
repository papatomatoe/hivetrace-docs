## Develop

### Install dependencies:

```bash
cd hivetrace-docs
pnpm install
```

### Local Development

```bash
cd hivetrace-docs
pnpm dev
```

### Building for Production

Generate static files for production:

```bash
cd hivetrace-docs
pnpm build
```

The build artifacts will be stored in the `dist/` directory.

### Testing the Build Locally

To test the production build locally:

```bash
cd hivetrace-docs
pnpm preview
```

## Adding Content

Content is stored in `hivetrace-docs/src/content/docs`.

1. Create a Russian page:
   - example: `hivetrace-docs/src/content/docs/guides/my-topic.md`
2. Add an English version in the mirrored path:
   - example: `hivetrace-docs/src/content/docs/en/guides/my-topic.md`
3. Add frontmatter at the top of the file:

```md
---
title: "Page title"
sidebar:
  order: 10
draft: true
---
```

4. Fill in the content using Markdown/MDX.
5. If the folder is connected via `autogenerate` in `hivetrace-docs/astro.config.mjs`, the page will appear in the sidebar automatically.
6. Verify locally:

```bash
cd hivetrace-docs
pnpm dev
```

To publish, remove `draft: true` (or remove the `draft` field).

### Deploy to GitHub Pages

This repo is configured to deploy via **GitHub Actions** to **GitHub Pages**.

1. Ensure the repository in the `hivetrace` org is named **`docs`** (so the URL is `https://hivetrace.github.io/docs/`).
2. In GitHub repo settings: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` — the workflow will build `docs/` and publish automatically.

## Available Scripts

| Script         | Description                         |
| -------------- | ----------------------------------- |
| `pnpm dev`     | Starts the development server       |
| `pnpm build`   | Builds the app for production       |
| `pnpm preview` | Serves the production build locally |
