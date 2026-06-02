This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

Copy `.env.example` to `.env.local` and fill in values.

### Password reset (NextAuth + SMTP)

1. Set `AUTH_SECRET`. For local dev use `AUTH_URL=http://localhost:3000`. On Vercel/production set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your live site URL (not localhost).
2. Configure SMTP (see `.env.example`). For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your normal login password.
3. Forgot password: `/forgot-password` → email link → `/reset-password?token=...` → sign in at `/login` with NextAuth credentials.

In development, if `SMTP_PASS` is missing, reset links are printed in the server console instead of being emailed.

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
