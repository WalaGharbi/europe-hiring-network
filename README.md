# Europe Hiring Network — Google and email portal

Standalone Next.js migration target for Netlify + Supabase. The currently deployed Sites app is unchanged. This application is deployed through Netlify and contains no credentials or candidate records.

## Activation

1. Create/select a Supabase project. In Netlify, import this GitHub repository and leave the base directory empty (repository root). Choose the Free plan. Do not purchase a paid plan without the owner's approval.
2. Apply `supabase/migrations/202610240001_portal.sql` to the NEW database. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project. No service-role secret belongs in the app or browser. After the recruiter has signed in with a verified email, use trusted Supabase SQL administration to insert that email into `private.recruiters`; this migration intentionally grants no recruiter role by default.
3. Set `APP_ORIGIN` to the exact Netlify production origin (no trailing slash). Enable email authentication and account creation. Set the Supabase Site URL to that origin and allow `/auth/callback` and `/auth/confirm` under that exact origin.
4. Enable Google in Supabase. Create Google OAuth web credentials, add the production website origin and the exact Supabase callback URL shown in the provider settings. Configure the client ID/secret in Supabase, not the client source. Publish the Google consent app or add approved test users until production verification is ready.
5. Configure a production SMTP provider and verified sender in Supabase. The default Supabase sender is restricted to project-team addresses and is unsuitable for arbitrary client email logins.
6. Configure the Magic Link email template with `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}">Sign in to Europe Hiring Network</a>`. The application always supplies `/auth/confirm?next=...` as RedirectTo; all redirects must be allowlisted. This confirmation page requires an explicit click before consuming the link, to avoid scanners consuming it automatically.
7. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`. Deploy and test both Google and email logins with two separate clients and the recruiter account.

## Security and data

- Session identity is verified server-side using Supabase `getUser(token)`. Requests never trust identity headers from the old Sites host.
- PostgreSQL row-level security isolates enquiries, messages and shared candidate profiles. Recruiter access is held in a private table, never editable user metadata.
- Clients may change candidate feedback only through the narrowly scoped database function, not candidate profile fields.
- Candidate sharing remains an explicit recruiter action; drafts stay private.
- Existing Sites user IDs are NOT Supabase auth IDs. Do not import them as if they were. Preserve the old app and export its records through an authorized owner workflow; create verified Supabase users, review an explicit old-to-new user mapping, then import enquiries/messages/candidates preserving request IDs and timestamps. Do not transfer ownership based on a contact email field alone.
- Keep the existing live website operating until auth, data mapping, and two-client isolation tests pass. Only then switch the custom domain. The existing Sites address remains separate from the Netlify deployment.

## Required acceptance checks

- Anonymous API reads are denied; a signed-in client cannot read another client's position by changing its ID.
- Draft candidates are hidden. Sharing/unsharing takes effect for the intended client only.
- Client A cannot send messages or feedback on client B's request; clients cannot grant themselves recruiter roles.
- Google login and new/existing email login links land in the intended workspace. Invalid/expired links and cancelled Google consent show retry screens.
- Sign-out removes the session, and a subsequent API call is denied. Logout/sign-in as a second user never reuses the first user's records.
- Real client accounts receive login emails through the configured SMTP provider. Email login creates a portal account, not a marketing subscription.
