# Deployment and configuration

This project is a static site. The application does not need a build step, package installation, or application server. GitHub Pages serves the files in the repository; Supabase is optional and provides shared data and account sync.

## 1. Deploy the static site

1. Push the project files to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Confirm that Pages is configured to publish from the repository's `main` branch and repository root (the `/(root)` folder), unless the repository has deliberately been switched to a different publishing source.
4. Wait for the Pages deployment to finish, then open [the live site](https://upsylon3.github.io/scam-or-steal/).

The app is static: the browser loads `index.html` and the referenced JavaScript files directly. Updating those files on the published branch updates what visitors receive after the Pages build completes. Browser caching may briefly preserve an older copy.

## 2. Local/offline mode

Clone the repository and open `index.html` in a modern browser:

```bash
git clone https://github.com/Upsylon3/scam-or-steal.git
cd scam-or-steal
```

For fully local-only use, set both fields in `config.js` to empty strings:

```js
window.PVL_CONFIG = { supabaseUrl: "", supabaseKey: "" };
```

In offline mode, listings and settings stay in that browser's local storage. Shared parts, shared reference settings, and account sync require Supabase.

## 3. Configure Supabase (optional)

The app can use Supabase for shared CPU/GPU part entries, the default reference PC, and optional user accounts. Use a dedicated Supabase project for the app.

1. Create a project at [supabase.com](https://supabase.com/).
2. Open the project's **SQL Editor**.
3. Open the repository's `setup.sql`, replace the literal `YOUR_PASSPHRASE` in the first-run admin-secret insert with a strong, unique admin passphrase, and run the SQL.
4. Open **Project Settings → API** and copy the project URL and the **publishable key** (or legacy anon key) into `config.js`.
5. Keep the URL/key formatting clean. The app normalizes a trailing slash, but the value should be the project URL, not a REST endpoint such as `/rest/v1`.
6. Commit the updated `config.js` and deploy the site.

Example configuration shape (replace the placeholders; do not commit these literal placeholders if you intend to connect Supabase):

```js
window.PVL_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
```

### Admin passphrase and repeatable SQL setup

- Choose the admin passphrase **before the first run** of `setup.sql`. The script hashes and inserts it only when `admin_secret` is empty.
- Running `setup.sql` again re-applies the schema/policies and creates missing objects, but intentionally does not overwrite an existing admin passphrase.
- If the passphrase must be changed later, use a deliberate, reviewed database migration rather than assuming that rerunning the file resets it.
- The admin passphrase is not the Supabase API key and must never be committed to the repository.

### Enable optional accounts

1. In Supabase, open **Authentication → Sign In / Providers → Email**.
2. Turn **Confirm email** off if you want the app's documented no-confirmation flow.
3. In the app, go to **Settings → Account** and create an account using an email address and password.

The app does not send confirmation or password-reset emails. A password-reset flow is not currently implemented, so users should export backups and keep account credentials safe.

### What is public and what is private?

GitHub Pages delivers `config.js` to every visitor, so everything in it must be treated as public. A Supabase publishable/anon key is intended for client use only with appropriate database policies and privileges. Never put a Supabase `service_role` key, secret key, personal access token, or admin passphrase in the frontend.

`setup.sql` enables row-level security on the account listing table and intends to restrict each signed-in user to their own row. Shared part data and the public reference settings are intentionally readable by visitors. Review [SECURITY.md](../SECURITY.md) before changing policies or exposing new database functions.

## 4. GitHub Actions

Open the repository's **Actions** tab to see workflow status and run manual workflows.

### Validate static app

`.github/workflows/validate-static-app.yml` runs on pushes and pull requests targeting `main`. It checks JavaScript syntax from the inline script in `index.html`, validates curated benchmark data, and runs the scoring regression tests.

### Weekly PassMark refresh

`.github/workflows/update-parts.yml` runs every Monday and can also be run manually from Actions. It downloads the CPU/GPU lists, applies safety checks, and updates `builtin-parts.js` only if the result looks plausible. If the workflow stops due to a suspicious change, review the upstream source and workflow logs before using the manual **force** input; that option deliberately bypasses safety checks. It then asks GitHub Pages to rebuild.

This workflow updates the broad built-in PassMark list. It does not refresh the separately curated records in `benchmark-data.js`.

### Supabase keep-alive

`.github/workflows/supabase-keepalive.yml` sends a daily request so the configured Supabase project is less likely to pause from inactivity. It can also be run manually. If the project has been paused and needs restoration, the script can use an access token supplied through a GitHub Actions secret.

Only when restore capability is needed:
1. Generate an access token in Supabase under **Account → Access Tokens**.
2. In GitHub, open **Settings → Secrets and variables → Actions**.
3. Add a repository secret named `SUPABASE_ACCESS_TOKEN`.

Do not put this token in source files. The routine keep-alive request does not need a token in the usual active-project case. Check the workflow logs if the project is unreachable or cannot be restored. GitHub may disable scheduled workflows after prolonged repository inactivity; re-enable them in Actions if needed.

## Troubleshooting

- **App loads but shared parts/accounts do not work:** check `config.js`, the Supabase project status, the browser console/network panel, and whether the current `setup.sql` has been run.
- **Admin says a function is missing:** run the current `setup.sql` again in the project's SQL Editor.
- **New account cannot sign in immediately:** verify Email provider settings and whether email confirmation is still enabled.
- **Pages shows an old version:** confirm the latest commit is on the configured publishing branch, check the Pages/Actions deployment status, and hard-refresh after deployment completes.
- **Weekly refresh did not update the list:** it may have found no changes or intentionally stopped on a validation/safety check. Inspect the workflow log instead of forcing an unreviewed dataset through.
- **Listings disappeared on a device:** check whether the browser profile changed and import a JSON backup if available. Unsigned local data does not automatically transfer between browsers/devices.
