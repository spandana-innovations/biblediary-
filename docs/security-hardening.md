# Security — the 666MAILER.php incident

## What was found

`biblediary_in.zip` contained:

```
audiofiles/1/intercessions_reading/666MAILER.php   0 bytes, 2024-01-25
```

A zero-byte PHP file, with a mail-spam-script name, inside a **user-upload
directory**. That is a webshell dropper signature, not an accident. Two
readings, both bad:

- the payload was uploaded, used, and the body wiped — the attacker had code
  execution on the host; or
- the upload failed part-way — the attempt succeeded far enough to write a file
  into a directory that should never accept `.php`.

Either way the upload path accepted an executable file and the web server was
willing to keep it. The date (2024-01-25) is the earliest known marker, not
necessarily the first intrusion.

**This is unrelated to the rebuild.** No PHP has ever existed in this
repository — verified across the full git history, the working tree, and the
deployed build. The exposure is entirely on the legacy cPanel host.

## Is it still there?

Unknown from here — nobody has audited the live host since. Run the scanner:

```bash
# copy to the host, then over SSH:
bash scan-legacy-host.sh /home/bettery1
```

It only reports. It checks for executable files in upload directories, known
webshell filenames, obfuscation patterns (`eval(base64_decode(...))` and
friends), zero-byte PHP, recently-modified PHP, cron persistence, `.htaccess`
files that enable PHP, and the leftover CKEditor sample scripts.

If sections 1–4 return anything, quarantine it — this **moves** files, never
deletes, so you keep evidence:

```bash
bash scan-legacy-host.sh /home/bettery1 --quarantine
```

## If anything is found

1. **Back up first** — files and database — before touching anything.
2. **Rotate every credential**: cPanel, MySQL, FTP/SSH, the app's admin
   account, and any API keys. Assume all were readable.
3. **Read the access logs** around each file's timestamp to find the entry
   point. Without that, you will be re-infected.
4. **Prefer rebuilding the host to cleaning it.** You can never prove you found
   everything. This is the honest professional answer, and it is also the
   cheapest — the rebuild already replaces the front end.

## Fixes for the legacy host, while it is still serving

Applied in order of value:

**1. Refuse to execute anything in upload directories.** Drop this `.htaccess`
into `audiofiles/`, `prayerfiles/`, `category_images/`, `hymns_images/`:

```apache
# No code execution in upload directories.
<FilesMatch "\.(php|php[0-9]|phtml|pht|phar|cgi|pl|py|sh|htaccess)$">
  Require all denied
</FilesMatch>
php_flag engine off
Options -ExecCGI -Indexes
AddHandler cgi-script .php .phtml .pht .cgi .pl .py
```

**2. Delete the CKEditor sample tree.** `asset/ckeditor/samples/` is
web-reachable and `posteddata.php` echoes POST data back:

```bash
rm -rf asset/ckeditor/samples asset/ckeditor4/samples
```

**3. Scope CORS.** `index.php` currently sends
`Access-Control-Allow-Origin: *` unconditionally, on every route including
admin. Restrict it to the app's own origins, and never send it on admin paths.

**4. Validate uploads properly** — check the actual MIME type and extension
allow-list server-side, rename to a generated filename, and store outside the
webroot where possible.

**5. PHP 7.4 is end-of-life** (since Nov 2022) and unpatched. Moving to a
supported PHP is a prerequisite for treating the host as trustworthy at all.

**6. Single shared admin account.** Give each administrator their own account
with a real password, and enable 2FA on cPanel.

## Why the rebuild removes this class of bug

The new stack has no server-side execution at all:

- It compiles to **static files** — HTML, CSS, JS, JSON — served by Cloudflare.
  There is no PHP runtime, no interpreter, and no writable directory in the
  serving path. A `.php` file uploaded to it would be served as an inert
  download, not run.
- There are **no upload endpoints**. Content arrives at build time from the
  repository, not at runtime from a form.
- Media will live in **R2**, a separate object store with no execution.
- Deploys are **reproducible from git** — if anything is ever tampered with,
  redeploying restores a known-good state in about thirty seconds.

The remaining decision is how long the legacy cPanel host stays online beside
it. Every day it serves is a day this exposure is live; the sooner
`biblediary.in` points at the new deployment, the sooner the problem is closed
by construction rather than by cleaning.
