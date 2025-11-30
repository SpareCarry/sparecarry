# Secret Hygiene Playbook

This is the single source of truth for removing leaked secrets and preventing new incidents. Follow these steps whenever we discover exposed credentials (Stripe keys, Supabase service role, ngrok tokens, etc.).

## 1. Stop the Leak

- Rotate the secret in its upstream system (Stripe dashboard, Supabase project, ngrok, etc.).
- Immediately revoke the old secret and update the new value in all environments (Vercel, GitHub Actions, local `.env` files).
- If the secret was in a pull request, close/revert the PR until the cleanup is complete.

## 2. Purge the Repository

1. **Identify commits/files**
   - Use `git log --full-history -- <file>` or `git grep "sk_live"` to find all references.
2. **Rewrite history**
   - Use `git filter-repo` (preferred) to remove the file or replace text:
     ```bash
     git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text replacements.txt
     ```
   - Keep a `replacements.txt` file that maps real secrets to placeholders.
3. **Force-push the sanitized history**
   - `git push --force-with-lease origin <branch>`
4. **Invalidate existing clones**
   - Ask contributors to reclone or run `git fetch --all` followed by `git reset --hard origin/<branch>`.

## 3. Double-Check Artifacts

- Validate that secrets are redacted in:
  - GitHub history (`git log --all --full-history -- <file>`).
  - Generated bundles (`.next/`, `dist/`), published packages, and uploaded assets.
- Run `scripts/clean-git-secrets.ps1` (or the bash equivalent) to ensure no lingering references remain.

## 4. Verify Automation

- Make sure GitHub Actions/Vercel projects now use the rotated secrets.
- Re-run the affected pipelines (deploy, lint, etc.) to ensure nothing breaks.

## 5. Communicate

- Post-mortem summary in Slack/Docs (what leaked, when, remediation steps).
- Update this playbook if new edge cases were encountered.

> **Note:** Any legacy instructions that referenced specific files (e.g., `STRIPE_WEBHOOK_SETUP.md`) now point here. Always keep this document updated so we do not fragment guidance across multiple markdown files.
