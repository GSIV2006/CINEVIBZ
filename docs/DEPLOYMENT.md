# Push CineVibz and deploy

Repository: [GSIV2006/CINEVIBZ](https://github.com/GSIV2006/CINEVIBZ)

## Push from VS Code

Open the `Documents/cinevibz` folder in VS Code. The local repository uses `main` and has `origin` set to the repository above. The initial commit is prepared locally; the upload is left for you.

In the VS Code terminal:

```bash
git status
git remote -v
git push -u origin main
```

Sign in to GitHub as `GSIV2006` if prompted. Alternatively, use VS Code's Source Control view to publish/push the branch to the existing `origin`. If Git reports that the remote already has newer commits, fetch and review them before merging; do not force-push over someone else's work.

`.env.local`, `node_modules`, `.next`, logs and scratch work are excluded from Git. The tracked `.env.example` contains only the variable name. Keep `package-lock.json` in the repository.

## Import into Vercel

1. Import `GSIV2006/CINEVIBZ` into your Vercel account.
2. Use the **Next.js** framework and the repository root (the folder with `package.json`). Node.js **24.x** is specified in `package.json`.
3. Add **TMDB_READ_ACCESS_TOKEN** as an environment variable for **Production**, and **Preview** if you want the catalogue to work in preview deployments. Copy its value from your local `.env.local`; do not include the variable name, quotes, or `Bearer ` prefix. Do not prefix it with `NEXT_PUBLIC_`.
4. Deploy. `vercel.json` specifies `npm ci` and `npm run build`; leave the output directory on the Next.js default.
5. After changing an environment variable, redeploy for the change to take effect.
6. Update the application URL in your TMDB API settings to the deployed domain.

Normal Next.js hosting is required because catalogue requests use server API routes. GitHub stores the source; Vercel runs the app. A static GitHub Pages deployment cannot provide these API routes.

## Verify the hosted app

Open the deployed website and check:

- The home page loads real daily/weekly picks and posters.
- `Indian` search returns Indian productions; `Ram Charan` resolves his credits; `Peddi` opens the correct title.
- A mood request such as `crazy movies` returns catalogue results.
- Quiz progress and a saved watchlist title survive a page refresh.
- The contact email and social links have the correct destinations.

To run the existing live catalogue and engagement checks against your deployment, replace the example URL:

```bash
CINEVIBZ_TEST_URL=https://YOUR-PROJECT.vercel.app npm run test:live
```

These checks make real provider requests and save reports in `docs/`. Vercel preview protection must allow the requests. Provider records can change, so investigate a failing assertion before interpreting it as an application regression.

## Storage and daily updates

No database migrations or Supabase setup are required by the current implementation. Watchlists, quiz progress, preferences and history use browser storage. Data does not automatically transfer from localhost to the hosted domain or between devices. Daily picks rotate at midnight in Asia/Kolkata; weekly picks rotate on Monday. No separate cron job is required.

## Reproduce the checks

With Node.js 24:

```bash
npm ci
npm run format:check
npm run verify
```

These checks and the build run without a TMDB token. A running deployment needs the token for live catalogue features. GitHub Actions runs these same offline checks after a push; that does not replace checking the deployed website.

## Official references

- [Vercel Next.js deployments](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [GitHub setup-node action](https://github.com/actions/setup-node)
