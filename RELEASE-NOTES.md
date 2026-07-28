# Release Notes — Public Contact Form Update 1.1.0

## Purpose

Replace the pre-public discussion-request placeholder with a live organizational contact form and align the demonstration site with its active Azure custom-domain deployment.

## Changed

- Replaced the discussion-request button with a responsive contact form.
- Added server-side `POST /api/contact` handling.
- Added Azure Communication Services Email delivery to `claimcompass@kneco.com`.
- Added reply-to routing to the submitting contact.
- Added required-field validation, field-length limits, a honeypot, and basic IP rate limiting.
- Added direct-email fallback when delivery is unavailable.
- Removed pre-public contact-routing language.
- Replaced `noindex` and the blocking `robots.txt` rule with public indexing settings.
- Added canonical metadata and `sitemap.xml` for the live custom domain.
- Updated the footer and site banner to reflect the live organizational demonstration.
- Updated documentation and automated validation.

## Data boundary

- The public form is for organizational business contact only.
- It must not be used to submit veteran names, Social Security numbers, claim numbers, medical information, or other sensitive personal information.
- The application sends submissions by email and does not include a contact database.
- The public demonstration still does not accept claim-file uploads.

## Required Azure settings

- `CONTACT_EMAIL_CONNECTION_STRING`
- `CONTACT_EMAIL_SENDER`
- `CONTACT_EMAIL_RECIPIENT=claimcompass@kneco.com`

See `CONTACT-FORM-AZURE-SETUP.md`.

## Validation

- HTML parsing and duplicate-ID validation
- Internal asset-reference validation
- Public search-indexing checks
- Contact-form and `/api/contact` contract checks
- JavaScript syntax checks for `script.js` and `server.js`
- Required fictional demo dataset checks
