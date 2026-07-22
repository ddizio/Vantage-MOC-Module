# Vantage MOC — static click-through demo

`index.html` is a **self-contained front-end prototype** of the MOC application.
It is a single file with the logo embedded and sample data baked in, and it
runs entirely in the browser — no server, no database, no install.

## How to use it

- **Open it locally:** double-click `index.html`, or
- **Host it:** upload `index.html` to any static web host (GitHub Pages,
  Netlify drop, S3 static website, SharePoint, an internal file share, or a
  "demo web app environment" that serves HTML). It works as the site's
  `index.html` with no build step.

Once open:

1. Use the **Acting as** picker (top right) to switch between people — an
   employee (Jamie Chen) and one holder of each approval role.
2. As **Jamie Chen**, click **+ New MOC**, choose a form type, and for an
   equipment change answer the hazard matrix to watch it compute the level.
3. Submit the draft for approval, then switch to the assigned approver and use
   **Review & Sign** — the workflow stepper advances as signatures come in.
4. The dashboard flags overdue temporary changes and active bypasses, just like
   the real app.

Data is saved in your browser's `localStorage`. Use **Reset demo data** in the
top bar to start fresh.

## What this is NOT

This prototype has **no real authentication, no real database, and no legally
binding signatures**. It exists to demonstrate the workflow and look-and-feel
to stakeholders in environments that can only serve static files.

The production application — with sign-in, a real database, true electronic
signatures, multi-site support, attachments, and email notifications — is the
rest of this repository and must be deployed to a host that runs Node.js
(see the top-level `README.md`, or `docker compose up -d --build`).
