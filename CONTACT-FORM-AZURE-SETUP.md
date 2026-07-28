# Configure the Live Claim Compass Contact Form in Azure

The repository sends form submissions through Azure Communication Services Email to `claimcompass@kneco.com`.

## 1. Create an Email Communication Services resource

1. Sign in to the Azure portal.
2. Search for **Email Communication Services**.
3. Select **Create**.
4. Use subscription **Azure subscription 1**.
5. Use resource group `rg-claim-compass-demo`.
6. Enter a name such as `ecs-claim-compass-demo`.
7. Select **United States** as the data location.
8. Select **Review + create**, then **Create**.

## 2. Provision a sender domain

For the fastest initial setup:

1. Open `ecs-claim-compass-demo`.
2. Select **Provision Domains**.
3. Select **Add domain**.
4. Select **Azure domain**.
5. Complete creation of the Azure-managed domain.
6. Open the domain and copy the default sender address. It resembles:

   `DoNotReply@<generated-id>.azurecomm.net`

A custom sender domain can be configured later after completing domain verification, SPF, and DKIM.

## 3. Create the Communication Services resource

1. Search for **Communication Services** in the Azure portal.
2. Select **Create**.
3. Use resource group `rg-claim-compass-demo`.
4. Enter a name such as `acs-claim-compass-demo`.
5. Select **United States** as the data location so it matches the email resource.
6. Select **Review + create**, then **Create**.

## 4. Connect the email domain

1. Open `acs-claim-compass-demo`.
2. In the left navigation under **Email**, select **Domains**.
3. Select **Connect domain**.
4. Select the subscription and resource group.
5. Select `ecs-claim-compass-demo`.
6. Select the Azure-managed domain.
7. Select **Connect**.

## 5. Copy the connection string

1. In `acs-claim-compass-demo`, select **Keys**.
2. Copy the primary connection string.
3. Treat this value as a secret.

## 6. Add App Service environment variables

1. Open App Service `asp-claim-compass-demo`.
2. Select **Settings → Environment variables**.
3. Open **App settings**.
4. Select **Add** and create these settings:

| Name | Value |
|---|---|
| `CONTACT_EMAIL_CONNECTION_STRING` | The ACS primary connection string |
| `CONTACT_EMAIL_SENDER` | The sender address from the connected email domain |
| `CONTACT_EMAIL_RECIPIENT` | `claimcompass@kneco.com` |

5. Select **Apply**.
6. Select **Apply** again on the Environment variables page.
7. Allow App Service to restart.

## 7. Deploy the repository update

1. Replace the changed files in the GitHub repository.
2. Commit the changes to `main`.
3. Push to GitHub.
4. Open **Actions** and confirm the Azure deployment succeeds.

## 8. Test the contact form

1. Open `https://claimcompass-demo.kneco.com/#contact`.
2. Submit a test using a valid external email address.
3. Confirm the success message appears.
4. Confirm the email arrives at `claimcompass@kneco.com`.
5. Reply to the message and confirm the reply is addressed to the form submitter.
6. Confirm no sensitive veteran information was included in the test.

## 9. Troubleshooting

- **Form says email delivery is being configured:** verify all three App Service settings and restart the app.
- **Deployment fails during npm install:** confirm `@azure/communication-email` remains in `package.json`.
- **Email is accepted but not received:** review Azure Communication Services email logs, spam filtering, and sender-domain status.
- **Form returns too many requests:** wait one hour or restart the single-instance demo during controlled testing.
- **Direct email still works:** use `claimcompass@kneco.com` while investigating service delivery.
