This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Demo mode (no database)

By default the app runs with **mock data** and an **in-memory session store**. You can:

- **Create a new case** (Cases → New Case), **open it**, **edit it**, **move it on the Kanban**, and **add notes** in case detail. All changes persist for the current browser session (until you refresh or close the tab).
- New cases and edits are kept in the session store so the list and detail pages stay in sync.

### Full persistence (SQLite database)

For a demo where data survives refresh and matches production behaviour:

1. Set up the database (one-time):
   ```bash
   echo "DATABASE_URL=file:./dev.db" > .env.local
   echo "NEXT_PUBLIC_USE_DATABASE=true" >> .env.local
   npx prisma migrate dev
   ```
2. Run the app as usual (`npm run dev`). Create, edit, and move cases; they are stored in SQLite and loaded from the API.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
