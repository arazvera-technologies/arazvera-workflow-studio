# ARAZVERA Workflow Studio

**Interactive specialist routing · Transparent decisions · Human review**

A public, responsive browser-based reference product by **ARAZVERA TECHNOLOGIES**.

## Working features
- Create requests for architecture, defensive security and documentation specialists.
- Route each request using an explicit capability policy (allow, review, deny).
- Approve or reject high-impact intents before they can be simulated.
- Execute **only local simulations** of permitted requests.
- Explore a searchable request queue and auditable event timeline.
- Export JSON records of local requests/events, or reset sample data.
- Use on desktop or mobile. Demo state stays in this browser's local storage.

This is a **working interactive interface and deterministic policy demo** — **not** a live AI agent, production security tool, backend service, or connected deployment. No external action, model call, payment, Windows change, or customer interaction is executed. Initial sample data is synthetic. Do not enter credentials or confidential data.

## Run locally

Requires a modern browser and Python 3 for local static hosting:

~~~bash
python -m http.server 8080
~~~

Open http://localhost:8080 and explore the Workbench. Node 22+ for tests and static build:

~~~bash
node --test
node scripts/build.mjs
~~~

Build output appears in the dist/ folder. No npm dependencies or package installation are necessary. Ctrl+K opens the New Request dialog.

## Technology

Vanilla HTML/CSS/JavaScript ES modules, Node's built-in test runner, GitHub Actions and GitHub Pages. No bundler, runtime backend, tracking SDK, API token, or third-party script is required. A compact ARAZVERA brand asset is provided locally.

## Safety design

- Fail closed for unknown domains and operations.
- High-impact tasks require explicit human decision.
- No route invokes a real tool; the engine only returns decisions.
- Inputs are validated and dynamic text uses textContent rather than HTML insertion.
- Data stays in the browser and can be cleared or exported.
- Do not rely on this demonstration for real authorization or incident response.

## Organization

[ARAZVERA TECHNOLOGIES](https://github.com/arazvera-technologies) · [Agentic AI Architecture Notes](https://github.com/arazvera-technologies/agentic-ai-architecture-notes) · [Secure Automation Patterns](https://github.com/arazvera-technologies/secure-automation-patterns)

*Independent technology brand in development. No claim of legal incorporation, customer delivery, or production deployment.*