# Deployment Checklist

## Repository

- [ ] Create a new repository named `claim-compass-org-demo` or similar.
- [ ] Copy every file and the `assets` folder into the repository root.
- [ ] Confirm the repository is private while the site is under review.
- [ ] Push the initial commit.

## Content review

- [ ] Confirm KNECO naming and contact information.
- [ ] Confirm that no production URL appears in the copy.
- [ ] Confirm all case and source data are fictional.
- [ ] Confirm capability statements accurately describe a concept or planned feature.
- [ ] Obtain legal/privacy review before accepting any real user data.

## Azure Static Web Apps

- [ ] Create the Static Web App from the new repository.
- [ ] Use app location `/` and no build output directory.
- [ ] Verify the site loads from the generated Azure hostname.
- [ ] Add `claimcompass-demo.kneco.com` as a custom domain.
- [ ] Add the requested DNS CNAME record.
- [ ] Verify TLS and HTTPS.
- [ ] Confirm `staticwebapp.config.json` security headers are active.

## Browser checks

- [ ] Desktop Chrome or Edge.
- [ ] Mobile viewport.
- [ ] Keyboard navigation.
- [ ] Condition tabs update the mock timeline.
- [ ] Mock source dialog opens and closes.
- [ ] Copy-discussion-request button works on HTTPS.
- [ ] No forms or controls accept veteran records.

## Brochure

- [ ] Use `claimcompass-demo.kneco.com`.
- [ ] Add a QR code after the custom domain is live.
- [ ] State that the demonstration uses fictional data and does not accept veteran records.
