# Anand Sangeet Music Test Series

Standalone mock-test platform for **STET Music** and **BPSC Music**, built for Anand Sangeet Mahavidyalaya.

This application does not replace or modify [www.anandsangit.com](https://www.anandsangit.com/). Deploy it on its own host, for example `test.anandsangit.com`.

## Architecture

```text
Next.js (App Router, TypeScript, Tailwind, shadcn/ui)
        │
        ▼
Supabase Auth  ── phone + password, no OTP
        │
        ▼
auth.users.id
        │
        ▼
public.profiles
        ├── test_attempts ── question_attempts
        ├── subscriptions ── payments
        ├── support_tickets ── support_messages
        └── question_reports
```

- The browser uses the Supabase anon key. Row Level Security decides what that key can read or write.
- Passwords stay in `auth.users`. `public.profiles` has no password column.
- A database trigger creates every new profile as `STUDENT`. A student cannot change `role` or `is_active`.
- Scores, free-test limits, premium activation, and question papers are enforced in PostgreSQL functions.
- Students do not have `select` on the `questions` table, so correct answers are not available to the browser until a secure function returns a submitted paper.
- Razorpay secrets and `SUPABASE_SERVICE_ROLE_KEY` are read only on the server.

Next.js 16 refreshes the auth session in `proxy.ts`. That file replaces the older `middleware.ts` convention.

## Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In Authentication → Providers, enable **Phone**.
3. Turn **Confirm phone** off. If it stays on, Supabase will expect an SMS OTP even though this app never calls `signInWithOtp()`.
4. Copy the project URL and anon key into `.env.local`.
5. Keep the service-role key on the server only.

```bash
cp .env.example .env.local
```

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Database migration

From the Supabase SQL editor, run:

1. `supabase/migrations/20260929120000_init.sql`
2. `supabase/seed.sql`

Or, with the Supabase CLI linked to this project:

```bash
npx supabase db push
npx supabase db query --file supabase/seed.sql
```

The migration creates tables, indexes, constraints, the profile trigger, RLS policies, storage buckets, and the functions that start tests, score them, import questions, and activate premium.

`seed.sql` inserts topics, 20 sample questions, two free tests, one premium test, and three premium plans. STET Music is ₹499, BPSC Music is ₹699, and both exams are ₹999. It does not insert people. The price on the website is read from `subscription_plans`, and checkout only accepts the plan that matches the student's target exam.

### Development users

After the migration:

```bash
npm run seed:users
```

This creates fictional accounts. Change or delete them before production.

| Role | Mobile | Password |
| --- | --- | --- |
| Super admin | 9800000001 | DevOnly#1001 |
| Admin | 9800000002 | DevOnly#1002 |
| Student, STET | 9800000003 | DevOnly#1003 |
| Student, BPSC | 9800000004 | DevOnly#1004 |

The script also opens one sample support ticket. It never stores a password in `profiles`.

## Authentication

Registration collects full name, mobile number, password, confirm password, and target exam (`STET`, `BPSC`, or `BOTH`).

The app calls `signUp({ phone, password })` and `signInWithPassword({ phone, password })`. Mobile numbers are stored in E.164 form, such as `+9198XXXXXXXX`.

Forgot password does not send an OTP. An administrator sets a new password from the student page. The old password is never displayed.

## Row Level Security

RLS is enabled on every public application table.

Students can read and update their own profile fields, except `role`, `is_active`, and `mobile_number`. They can read their own attempts, subscriptions, payments, tickets, reports, and notifications. They can read published tests, active topics, and active plans.

They cannot insert attempts, change scores, change payment status, or activate a subscription. Those writes happen inside security-definer functions or through the service role after Razorpay verification.

Admins manage questions, topics, tests, support, and reports. Only a super admin can change roles and platform thresholds.

## Razorpay

The browser calls:

- `POST /api/payments/create-order`
- `POST /api/payments/verify`

Point the Razorpay webhook at:

`https://test.anandsangit.com/api/payments/webhook`

Premium becomes active only after the server checks the Razorpay payment, the amount, and either the checkout signature or the webhook signature. A successful checkout callback by itself does not grant access.

Equivalent Supabase Edge Functions live in `supabase/functions/` if you prefer to host those endpoints on Supabase:

- `create-payment-order`
- `verify-payment`
- `razorpay-webhook`

The Next.js app uses its own server routes so local development does not depend on deployed functions. Deploy the functions with `npx supabase functions deploy` and set the same secrets in the Supabase dashboard if you switch the client over.

## Storage

Private buckets:

- `support-attachments` — a student can upload only under their own user id
- `question-media` — admins write, signed-in users can read published media
- `profile-images` — a student can write only their own folder

## Question import

Admins open **Import**, upload a CSV or XLSX file, preview the counts, then confirm.

Required columns:

`question, option_a, option_b, option_c, option_d, correct_answer, exam, topic, difficulty`

Optional: `subject, subtopic, explanation, source, year`

The database function rejects unknown topics, bad answers, and duplicates. Invalid rows are reported and are not inserted. A template is at `/samples/questions-template.csv`.

## Free tests and weak topics

New students can start two free mock tests. The count includes in-progress and completed free attempts and is checked inside `start_test`, with a transaction lock so two requests cannot both pass the limit.

Practice sets do not consume the free-test quota. Premium removes the limit.

Wrong answers on completed tests are grouped by topic:

| Wrong answers | Band |
| --- | --- |
| 0–1 | Strong |
| 2 | Needs practice |
| 3–4 | Weak |
| 5 or more | Critical |

A super admin can change these thresholds and the free-test limit in Settings.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```

## Production

1. Apply the migration to the production Supabase project.
2. Turn off phone confirmation.
3. Set the environment variables on the host. Do not expose the service-role key or Razorpay secrets as `NEXT_PUBLIC_` variables.
4. Create the first super admin with `npm run seed:users` against production only if you immediately replace the development password, or create that user in the Supabase dashboard and then set `profiles.role` to `SUPER_ADMIN` with the service role.
5. Replace the sample tests with full papers before inviting students.
6. Set `NEXT_PUBLIC_APP_URL` to `https://test.anandsangit.com`.
7. Add the Razorpay webhook URL.

`npm run build && npm start` runs the production server. On Vercel or a similar host, set the same environment variables and deploy this repository as its own project.

## Roles

| Role | Can |
| --- | --- |
| Student | Take tests, practise, view results, report questions, raise queries, buy premium |
| Admin | Manage questions, topics, tests, students, payments, support, and reports |
| Super admin | Everything an admin can do, plus roles, free-test limit, and weak-topic thresholds |

An ordinary student who opens `/admin` sees an access-denied page. The database policies block the same actions even if the page check is bypassed.

## Troubleshooting

**Registration succeeds but there is no session.** Phone confirmation is still enabled. Turn it off in the Supabase Auth settings. This app does not collect an OTP.

**“Supabase is not configured.”** `.env.local` is missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Restart `npm run dev` after changing it.

**Dashboard is empty after login.** Run the migration. The profile trigger must exist before registration, otherwise `auth.users` will not have a matching `profiles` row. If you registered too early, create the profile from the SQL editor with `role = 'STUDENT'`.

**Premium stays inactive after payment.** Check `RAZORPAY_KEY_SECRET`, the webhook secret, and that `SUPABASE_SERVICE_ROLE_KEY` is available to the server. The payments table should move from `CREATED` to `SUCCESS` only after verification.

**A student can see another student’s ticket or attempt.** That is a policy bug. Confirm RLS is enabled and you are not using the service-role key in browser code.

**Import says the topic is unknown.** Create the topic first. Topic names are matched without case sensitivity.
