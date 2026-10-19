# Security policy

## Supported code

Security fixes are welcome for the current version on the `main` branch. The site is a static client with an optional Supabase backend; configuration and frontend code are public by design.

## Reporting a vulnerability

Please do not publish working exploit details, exposed credentials, private user data, or a database bypass in a public issue.

Use GitHub's private vulnerability reporting for this repository if it is enabled. Otherwise, contact the repository maintainer through their GitHub profile and provide a concise report with reproduction steps and impact. Avoid testing against other people's accounts or data.

## Security boundaries and sensitive configuration

- Treat `index.html`, `config.js`, and every downloaded frontend asset as publicly readable.
- Only use a Supabase publishable/anon key in `config.js`. Never place a service-role key, Supabase secret key, personal access token, or admin passphrase in frontend code.
- Store `SUPABASE_ACCESS_TOKEN`, when needed by the keep-alive workflow, as a GitHub Actions repository secret.
- The admin passphrase should be strong, unique, and set before the first execution of `setup.sql`. The SQL inserts its hash only if the secret table is empty; rerunning the script does not rotate it.
- Preserve row-level security and least privilege when changing tables, policies, or RPC functions.
- Account listing rows are private user data. Tests and schema changes must not expose one user's row to another.
- Shared CPU/GPU entries and shared reference settings are intentionally readable. Consider validation and abuse resistance when changing how shared writes are allowed.

## Data privacy notes

Without an account, listing information is stored in the current browser's local storage. With an account, listings can be transmitted to the configured Supabase project for sync. Do not store sensitive information in listing names or exported backups. JSON backup files may contain all saved listings and should be treated as private.

## Disclosure expectations

When reporting a suspected issue, include the affected component, impact, reproduction steps, and any safe evidence that supports the finding. Please allow time for investigation and a fix before sharing details publicly. Do not include real credentials or personal data in the report.
