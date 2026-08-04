# Legacy PHP app (archived)

This is the original PHP 7/8 + MySQL implementation of TalkTable, kept here for
reference during the rewrite to TypeScript/Next.js (see the repo root).

**Do not deploy this.** It is not maintained going forward, and it contains
credentials that were committed to git history and must be rotated regardless
of the rewrite:

- `db.php` — a live MySQL password.
- `handlers/mailer.php` — a live Gmail app password.
- `handlers/autocomplete_handler.php` — a getaddress.io API key.

Rotate all three at their respective providers. Removing them from this file
does not remove them from git history.
