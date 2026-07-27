# Claim Compass Accredited Organization Demo

A standalone trial site that explains the Claim Compass concept to VA-recognized veterans organizations, accredited VSO representatives, accredited attorneys, claims agents, and other authorized veteran-service stakeholders.

## Intended public address

`https://claimcompass-demo.kneco.com`

The included `CNAME` file supports GitHub Pages. The same hostname can also be mapped to Azure App Service or Azure Static Web Apps.

## What this repository includes

- Responsive single-page marketing site
- Interactive mock condition lifecycle
- Fictional source-page preview
- Accredited-organization-focused language
- No upload control, authentication, analytics, cookies, or data collection
- Explicit concept-preview and non-affiliation notices
- Azure App Service Node.js host with security headers and a health endpoint
- Azure Static Web Apps security configuration
- GitHub Pages custom-domain file
- Brochure-ready URL and revised call-to-action copy

## Repository structure

```text
.
├── assets/
│   ├── claim-compass-mark.svg
│   ├── favicon.svg
│   └── social-preview.svg
├── .gitignore
├── CNAME
├── APP-SERVICE-DEPLOYMENT-GUIDE.md
├── LICENSE
├── README.md
├── brochure-copy.md
├── index.html
├── package.json
├── robots.txt
├── script.js
├── server.js
├── staticwebapp.config.json
└── styles.css
```

## Run locally

No build step is required.

### Python

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

### Node

```powershell
npm start
```

Open `http://localhost:8080`.


## Deploy to Azure App Service

This repository includes `package.json` and `server.js` so it can run directly on a Linux Azure App Service using Node.js 24 LTS. The server uses the `PORT` environment variable supplied by App Service and exposes `/healthz` for a basic health check.

Recommended configuration:

- Publish: Code
- Runtime stack: Node 24 LTS
- Operating system: Linux
- Pricing plan: Basic B1 or higher when using a custom domain and App Service managed certificate
- Deployment: GitHub Actions through App Service Deployment Center

See `APP-SERVICE-DEPLOYMENT-GUIDE.md` for the complete click-by-click process.

## Deploy to Azure Static Web Apps

1. Create a new GitHub repository, such as `claim-compass-org-demo`.
2. Copy all repository files into the repository root and push to the default branch.
3. In Azure, create a new **Static Web App** linked to that GitHub repository.
4. Choose **Custom** as the build preset.
5. Set the app location to `/`.
6. Leave the API location blank.
7. Leave the output location blank.
8. After deployment, add `claimcompass-demo.kneco.com` under **Custom domains**.
9. Create the DNS record Azure requests. For a subdomain, this is normally a CNAME to the Azure Static Web Apps hostname.
10. Confirm the custom-domain validation and managed TLS certificate.

## Deploy to GitHub Pages

1. Create a repository and push these files to the default branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the default branch and `/ (root)`.
5. Save.
6. Configure the DNS CNAME record for `claimcompass-demo.kneco.com` to point to the GitHub Pages hostname shown in repository settings.
7. Keep the included `CNAME` file in the repository root.
8. Enable **Enforce HTTPS** after the certificate is ready.

## Before making the site publicly discoverable

- Replace the trial banner and `noindex` setting only when the concept is ready for broader publication.
- Connect the discussion call to action to an approved KNECO email address or contact workflow.
- Review privacy, security, accessibility, and legal language.
- Decide whether a public privacy statement and terms page are required.
- Confirm that all claims about planned capabilities match the currently demonstrable product.
- Do not add real veteran records to this static site.

## Contact-button behavior

The **Copy discussion request** button copies a draft outreach message. It does not transmit or store data. This prevents the trial site from collecting contact information before a production contact workflow is approved.

## Mock data

All case identifiers, dates, events, diagnoses, source pages, and findings are fictional. They are provided only to demonstrate interface concepts.
