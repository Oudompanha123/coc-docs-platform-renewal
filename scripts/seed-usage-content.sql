-- Seed Usage product nav items and content
-- Run: psql -h 192.168.178.41 -U cocdocs -d cocdocs -f scripts/seed-usage-content.sql
SET search_path TO cocdocs_dev;

-- 1. Nav items
INSERT INTO nav_item (product_key, slug, label, sort_order) VALUES
  ('usage', '',             'Overview',    1),
  ('usage', 'setup-guide',  'Setup guide', 2),
  ('usage', 'configuration','Configuration',3)
ON CONFLICT (product_key, slug) DO NOTHING;

-- 2. Overview page (hero layout)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', '', 'hero',
  '{
    "layout": "centered",
    "heading": "Track your team''s Claude Code usage.",
    "tagline": "See who is using Claude Code, how much, and what it costs — in one shared dashboard.",
    "subline": "Daily token counts, cost estimates, per-member budgets, and exportable reports.",
    "ctaLabel": "Set up the reporter",
    "ctaHref": "/docs/usage/setup-guide",
    "eyebrow": "Overview",
    "sectionHeading": "What you get",
    "sectionIntro": "The Usage dashboard gives your team a single place to see Claude Code activity across every developer.",
    "features": [
      {
        "icon": "barChart",
        "title": "Daily token breakdown",
        "description": "Input, output, cache read, and cache creation tokens reported each day per team member."
      },
      {
        "icon": "shield",
        "title": "Budget alerts",
        "description": "Set a team-wide weekly token budget or override it per person. The chart turns amber at 80%, red above 100%."
      },
      {
        "icon": "download",
        "title": "Export reports",
        "description": "Download the full usage table as XLSX or a date-range ZIP. Useful for billing reconciliation or quarterly reviews."
      }
    ],
    "closingNote": "Numbers are estimates at a blended token rate, not a real invoice. See Configuration for details on how cost is calculated."
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

-- 3. Setup guide page (steps)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', 'setup-guide', 'steps',
  '{
    "eyebrow": "Setup guide",
    "heading": "Get the dashboard reporting real numbers.",
    "intro": "Five steps from connecting data to trusting what you see.",
    "calloutTone": "info",
    "calloutText": "Step 1 requires your admin to share the ingest secret with you — if you are waiting on that, you can still complete steps 2, 3, and 4 first and fill in the secret later. Step 5 (inviting teammates) requires admin or super_admin role on this platform.",
    "steps": [
      {
        "title": "Get your two environment variables",
        "body": "You need two values before you can run the reporter script.\n\nCOC_INGEST_URL is the backend API endpoint — replace the host with wherever your platform is deployed:\n\n  https://<your-platform-host>/api/ingest\n\nCOC_INGEST_SECRET is a shared bearer token set by whoever deployed the backend (it lives in the server config, not the UI). Ask your admin for the value. Never commit it to version control.\n\nCannot reach your admin right now? You can still complete steps 2 and 4 while you wait — just leave the secret placeholder and fill it in once you receive it.",
        "command": null,
        "output": null
      },
      {
        "title": "Download the reporter script",
        "body": "Save the script to a folder on your machine. It reads from the Claude Code local usage log and POSTs the day''s token totals to the platform.",
        "command": "curl -o ~/scripts/report-claude-usage.sh https://platform.coc.internal/scripts/report-claude-usage.sh\nchmod +x ~/scripts/report-claude-usage.sh",
        "output": null
      },
      {
        "title": "Configure and run it once",
        "body": "Set the two environment variables from Step 1 and do a manual run to confirm data reaches the dashboard before automating. Replace the values below with the ones your admin gave you.",
        "command": "export COC_INGEST_URL=\"https://<your-platform-host>/api/ingest\"\nexport COC_INGEST_SECRET=\"paste-your-secret-here\"\n~/scripts/report-claude-usage.sh",
        "output": "Reported 2026-09-18: input=148320 output=41200 cache_read=0 cost_usd=0.0891\nOK"
      },
      {
        "title": "Schedule it to run daily",
        "body": "Add a cron job that fires once a day — end of day works best so the numbers are complete. The script is idempotent: running it twice on the same day overwrites, not doubles, the row.",
        "command": "crontab -e\n# Add this line (runs at 23:30 every day):\n30 23 * * * COC_INGEST_URL=\"...\" COC_INGEST_SECRET=\"...\" ~/scripts/report-claude-usage.sh",
        "output": null
      },
      {
        "title": "Invite team members to the dashboard",
        "body": "Go to Claude Usage → Members and click Invite teammate. Enter their email address (must match the one Claude Code uses on their machine). Once invited, their next daily report will flip their status from Invited to Active automatically. You can also set a per-member weekly token budget at invite time, or adjust it later from the Budget overrides panel.",
        "command": null,
        "output": null
      }
    ]
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

-- 4. Configuration page (sections)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', 'configuration', 'sections',
  '{
    "eyebrow": "Configuration",
    "heading": "Manage your team''s usage settings.",
    "intro": "Roles, budgets, the ingest secret, and reporting periods — everything configurable on the Claude Usage dashboard.",
    "sections": [
      {
        "title": "Roles",
        "note": "The Usage dashboard has its own two-level role system, independent of your platform role. Admin can invite and remove members, set budget overrides, view the ingest secret, and export reports. Member can view the usage table and chart for the current period.",
        "command": null
      },
      {
        "title": "Budget overrides",
        "note": "Set a team-wide default weekly token budget in Configuration. Override it per member in the Budget overrides panel — leave blank to revert to the team default. Budgets scale automatically when switching between Day / Week / Month views so the comparison always makes sense.",
        "command": null
      },
      {
        "title": "Ingest secret",
        "note": "The shared bearer token that reporter scripts use to submit daily usage data. If compromised, click Rotate secret — a new secret is generated immediately and the old one stops working with no grace period. Never commit it to version control; pass it as an environment variable or store it in your machine''s keychain.",
        "command": null
      },
      {
        "title": "Reporting period",
        "note": "The period selector (Day / Week / Month) controls which rows are summed for the usage table and chart. Day shows today vs 1/7 of the weekly budget, Week shows this calendar week vs the full weekly budget, Month shows this calendar month vs 4x the weekly budget.",
        "command": null
      }
    ]
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

SELECT 'Done — Usage nav items and content seeded.' AS result;
