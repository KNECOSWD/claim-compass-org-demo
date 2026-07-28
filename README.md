# Claim Compass Accredited Organization Demo

A live organizational demonstration site for VA-recognized veterans organizations, accredited VSO representatives, accredited attorneys, claims agents, and other authorized veteran-service stakeholders.

## Public address

`https://claimcompass-demo.kneco.com`

The site is hosted on Azure App Service and deployed from GitHub Actions.

## What this repository includes

- Responsive single-page public site
- Interactive fictional condition lifecycle
- Fictional source-page preview
- Organization-focused pilot and workflow language
- Live organizational contact form with affirmative Terms of Use and Privacy Notice consent
- Server-side input validation, honeypot protection, and basic per-IP rate limiting
- Azure Communication Services Email delivery to `claimcompass@kneco.com`
- Public `terms.html` and `privacy.html` pages
- Concise no-advice, no-VA-affiliation, fictional-data, and no-contract notices
- Direct-email fallback
- No veteran-record upload control
- Azure App Service Node.js host with security headers and `/healthz`
- Public indexing through `robots.txt`, canonical metadata, and `sitemap.xml`
- Static validation and GitHub Actions checks

## Repository structure

```text
.
├── .github/workflows/
├── assets/
├── tools/
├── APP-SERVICE-DEPLOYMENT-GUIDE.md
├── CONTACT-FORM-AZURE-SETUP.md
├── CNAME
├── index.html
├── privacy.html
├── package.json
├── README.md
├── robots.txt
├── script.js
├── server.js
├── sitemap.xml
├── staticwebapp.config.json
├── terms.html
└── styles.css
```

## Run locally

Install dependencies and start the Node host:

```powershell
npm install
npm start
```

Open `http://localhost:8080`.

The public pages and `/healthz` work locally. Contact-form delivery requires the environment variables listed below.

## Contact-form configuration

The App Service must have these application settings:

| Setting | Purpose |
|---|---|
| `CONTACT_EMAIL_CONNECTION_STRING` | Connection string from the Azure Communication Services resource |
| `CONTACT_EMAIL_SENDER` | Sender address from the connected Azure Communication Services Email domain |
| `CONTACT_EMAIL_RECIPIENT` | Destination mailbox; use `claimcompass@kneco.com` |

See `CONTACT-FORM-AZURE-SETUP.md` for the click-by-click Azure setup.

If email delivery is temporarily unavailable, the form displays an error and directs the visitor to email `claimcompass@kneco.com` directly.

## Contact-form data handling

The form accepts business-contact information only. Submissions are sent by email to `claimcompass@kneco.com`; this repository does not include a contact database. The form explicitly instructs visitors not to submit veteran names, Social Security numbers, claim numbers, medical information, or other sensitive personal information.

The current implementation includes:

- Required-field and email-format validation
- Field-length limits
- A hidden honeypot field
- A five-submissions-per-hour in-memory IP limit
- No message-body logging
- Reply-to routing to the submitting contact
- Azure Communication Services user-engagement tracking disabled for each message

The in-memory rate limit is appropriate for the current single-instance demonstration. Replace it with a shared store or gateway-level protection before scaling to multiple instances.

## Deploy to Azure App Service

Recommended configuration:

- Publish: Code
- Runtime: Node 24 LTS
- Operating system: Linux
- App Service plan: Basic B1 or higher
- Deployment: GitHub Actions from `main`
- HTTPS Only: On
- Custom domain: `claimcompass-demo.kneco.com`

See `APP-SERVICE-DEPLOYMENT-GUIDE.md` for the deployment workflow.

## Validation

Run:

```powershell
npm test
npm run check
```

The validation checks confirm that the public contact form, contact API, search-engine settings, fictional demo datasets, referenced assets, and JavaScript syntax remain present.

## Public-site operating notes

- Keep all demonstration case data fictional.
- Do not add a real claim-file upload control to this public site.
- Keep public claims about features aligned with the currently demonstrable product.
- Review privacy, accessibility, security, and legal language when the form, collected fields, service providers, analytics, or product capabilities change.
- Do not represent illustrative functionality as a contractual commitment; pilots and licensing require a separately signed agreement.
- Confirm that `claimcompass@kneco.com` remains the public routing mailbox.

## Mock data

All case identifiers, dates, events, diagnoses, source pages, and findings are fictional. They exist only to demonstrate Claim Compass interface and workflow concepts.

## Brand assets

The website uses the supplied canonical Claim Compass logo family. Use `assets/claim-compass-logo-mark.svg` on light backgrounds and `assets/claim-compass-logo-mark-header.svg` on dark backgrounds. Browser icons are stored at the repository root.

## Contact form validation

The browser provides field-level validation and the `/api/contact` endpoint repeats all material checks server-side. The server whitelists the interest selection, validates optional organization URLs, blocks likely Social Security-number patterns in the message, requires both acknowledgments, rate-limits submissions, and silently accepts the hidden bot-trap field.
