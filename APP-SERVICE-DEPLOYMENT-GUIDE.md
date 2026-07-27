# Claim Compass Demo: GitHub, Azure App Service, and DNS Deployment Guide

This guide publishes the repository as a Node.js 24 LTS application on Linux Azure App Service and maps `claimcompass-demo.kneco.com` to it.

## Planned resource names

- GitHub repository: `claim-compass-org-demo`
- Azure resource group: `rg-claim-compass-demo`
- App Service plan: `asp-claim-compass-demo`
- Azure web app: `kneco-claim-compass-demo`
- Custom hostname: `claimcompass-demo.kneco.com`

Azure web-app names are globally unique. If `kneco-claim-compass-demo` is unavailable, add a short suffix and use the exact resulting Azure hostname in the DNS record.

## 1. Prepare the files

1. Download and extract the repository package.
2. Open the extracted `claim-compass-org-demo` folder.
3. Confirm that `index.html`, `package.json`, `server.js`, `styles.css`, `script.js`, `.github`, and `assets` are directly inside this folder.
4. Do not upload the outer ZIP or an extra parent folder into the GitHub repository.

## 2. Create the GitHub repository

1. Sign in to GitHub.
2. Select the plus icon in the upper-right corner.
3. Select **New repository**.
4. Choose the appropriate owner, such as `KNECOSWD`.
5. Enter `claim-compass-org-demo` for the repository name.
6. Enter a description such as `Claim Compass concept site for accredited veterans organizations.`
7. Select **Private** for early pilot outreach.
8. Do not initialize the repository with a README, `.gitignore`, or license because these files are already included.
9. Select **Create repository**.

## 3. Upload the code using GitHub Desktop

1. Install and open GitHub Desktop.
2. Sign in to the GitHub account that can access the repository.
3. Select **File > Clone repository**.
4. Select the `claim-compass-org-demo` repository.
5. Choose a local path and select **Clone**.
6. Open the cloned folder in File Explorer.
7. Copy the contents of the extracted `claim-compass-org-demo` package into the cloned folder.
8. Confirm that `index.html` is at the repository root, not inside a second nested folder.
9. Return to GitHub Desktop.
10. In **Summary**, enter `Initial Claim Compass organization demo`.
11. Select **Commit to main**.
12. Select **Push origin**.
13. Open the repository on GitHub and confirm that all files are visible.
14. Open **Actions** and confirm that the static validation workflow passes.

## 4. Create the Azure App Service

1. Sign in to the Azure portal using the KNECO tenant and subscription.
2. In the search box, enter `App Services`.
3. Open **App Services**.
4. Select **Create > Web App**.
5. On **Basics**, select the correct subscription.
6. For **Resource Group**, select **Create new**, enter `rg-claim-compass-demo`, and select **OK**.
7. For **Name**, enter `kneco-claim-compass-demo`. If unavailable, add a short suffix.
8. For **Publish**, select **Code**.
9. For **Runtime stack**, select **Node 24 LTS**.
10. For **Operating System**, select **Linux**.
11. For **Region**, select the region appropriate for KNECO, such as **Central US** or the same region used by related Claim Compass resources.
12. Under **Linux Plan**, select **Create new**.
13. Enter `asp-claim-compass-demo`.
14. Select **Change size**.
15. Select **Basic B1** or higher. A paid plan is required for the intended custom-domain configuration, and Basic or higher supports the App Service managed certificate path.
16. Select **Apply**.
17. Open the **Deployment** tab.
18. Set **Continuous deployment** to **Enable**.
19. For source, select **GitHub**.
20. Authorize Azure to access GitHub when prompted.
21. Select the GitHub organization, repository `claim-compass-org-demo`, and branch `main`.
22. Leave GitHub Actions selected as the deployment provider.
23. Use the recommended OpenID Connect or user-assigned identity authentication option when shown.
24. Open **Monitoring** and leave Application Insights off for this simple static demonstration unless you intentionally want telemetry.
25. Select **Review + create**.
26. Review the settings and select **Create**.
27. When deployment finishes, select **Go to resource**.

## 5. Confirm the GitHub Actions deployment

1. In the App Service menu, open **Deployment Center**.
2. Confirm the source shows the GitHub repository and `main` branch.
3. Select the link to the GitHub Actions workflow or open the repository's **Actions** tab.
4. Open the newest deployment run.
5. Confirm every step finishes successfully.
6. Return to the App Service **Overview** page.
7. Select **Default domain**.
8. Confirm the Claim Compass demo appears at the Azure `azurewebsites.net` address.
9. Test `/healthz` by appending `/healthz` to the Azure hostname. It should return `{"status":"ok"}`.

## 6. Troubleshoot startup before configuring DNS

1. In the App Service menu, open **Configuration > General settings**.
2. Confirm **Stack** is Node and the major version is 24 LTS.
3. Leave **Startup Command** blank because `npm start` is defined in `package.json`.
4. Select **Save** only if you changed a setting.
5. Open **Log stream** if the site does not load.
6. Confirm the log contains `Claim Compass organization demo listening on port`.
7. In **Deployment Center > Logs**, confirm the deployment copied `package.json`, `server.js`, and `index.html` to the app.

## 7. Add the custom domain in Azure

1. In the App Service menu, open **Settings > Custom domains**.
2. Select **Add custom domain**.
3. For **Domain provider**, select **All other domain services** unless `kneco.com` is actively hosted in Azure DNS.
4. For **TLS/SSL certificate**, select **App Service Managed Certificate**.
5. For the domain, enter `claimcompass-demo.kneco.com`.
6. Do not select **Validate** yet.
7. Keep this Azure dialog open. It displays the exact CNAME target and domain-verification ID required for DNS.

## 8. Create the DNS records

For the `claimcompass-demo` subdomain, create both records Azure displays:

1. A **CNAME** record:
   - Host or name: `claimcompass-demo`
   - Target or value: the app's exact default hostname, such as `kneco-claim-compass-demo.azurewebsites.net`
   - TTL: use the provider default or 3600 seconds
2. A **TXT** verification record:
   - Host or name: `asuid.claimcompass-demo`
   - Value: the exact Custom Domain Verification ID shown by Azure
   - TTL: use the provider default or 3600 seconds

Create these records at the authoritative DNS host for `kneco.com`, not merely at the registrar. If the `kneco.com` nameservers now point to Azure DNS, add them in the Azure DNS zone. If the nameservers still point to Microsoft-hosted DNS or another provider, add them there.

### Azure DNS click path

1. In the Azure portal, search for **DNS zones**.
2. Open the `kneco.com` zone.
3. Select **+ Record set**.
4. Enter `claimcompass-demo` as the name.
5. Select **CNAME** as the type.
6. Enter the exact `azurewebsites.net` hostname as the alias.
7. Select **OK**.
8. Select **+ Record set** again.
9. Enter `asuid.claimcompass-demo` as the name.
10. Select **TXT** as the type.
11. Paste the Custom Domain Verification ID from Azure App Service.
12. Select **OK**.

## 9. Validate and secure the custom hostname

1. Return to the still-open **Add custom domain** dialog in App Service.
2. Select **Validate**.
3. Confirm both DNS checks show green status.
4. Select **Add**.
5. Return to the **Custom domains** list.
6. Wait for the hostname to show **Secured** with the App Service managed certificate.
7. Open `https://claimcompass-demo.kneco.com` in a private browser window.
8. Confirm the browser shows HTTPS without a certificate warning.

## 10. Enforce HTTPS and complete validation

1. In App Service, open **Configuration > General settings**.
2. Turn **HTTPS Only** on.
3. Select **Save**.
4. Open the custom URL again.
5. Test the navigation, interactive mock timeline, source preview, mobile layout, and discussion-request copy button.
6. Confirm no form accepts real veteran records.
7. Keep the included `noindex` directive until KNECO is ready for search-engine discovery.

## 11. Future updates

1. Edit the code locally in the cloned repository.
2. Review the changed files in GitHub Desktop.
3. Enter a commit summary.
4. Select **Commit to main**.
5. Select **Push origin**.
6. GitHub Actions automatically deploys the new version to App Service.
7. Confirm the workflow succeeds and test both the Azure default hostname and custom hostname.
