# HeartMend PWA

HeartMend is a privacy-first, offline-capable breakup coping companion. It is designed for the raw early stage after a breakup, especially when you are dealing with guilt, loneliness, the urge to contact your ex, and the need to keep functioning at work.

## What it includes

- **Today dashboard** with mood check-ins, daily anchors, and fast coping cards.
- **Calm Now** with breathing, 5-4-3-2-1 grounding, and a Let Them / Let Me reset.
- **No Contact** with streak tracking, urge logging, a 20-minute delay timer, and unsent messages.
- **Work Mode** for remote-working days with a 25/5 timer, meeting shield, task triage, and a soft-landing plan.
- **Journal** with prompts and a thought-challenge tool.
- **Progress** with streaks and mood trends.
- **Safety** with UK crisis links and personal support contacts.
- **Settings** with export/import and reset.

## Privacy

There is no backend, account, analytics, or tracking. All personal data is stored in the browser via `localStorage`. Export your JSON regularly if you want a backup.

## Run locally

Because service workers need a web origin, do not just double-click `index.html` if you want the PWA/offline behaviour. From this folder, run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy

Upload the folder contents to any static host, such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, or an ordinary web server.

## Install

Once served from `localhost` or HTTPS, open it in Chrome, Edge, Safari, or a mobile browser and choose **Install**, **Add to Home Screen**, or the equivalent browser option.

## Important note

HeartMend is not a crisis service or a replacement for therapy. If you are in immediate danger or may hurt yourself or someone else, call emergency services now.
