MOVIARA Message Studio — ClickSend SMS

Backend sends SMS requests through ClickSend.
Required Vercel environment variables:
- CLICKSEND_USERNAME
- CLICKSEND_API_KEY
Optional:
- CLICKSEND_FROM (only if ClickSend supports/approves the sender for your account and destination)

Important: API acceptance is not proof of delivery. Check ClickSend SMS History for final delivery status, especially for Dominican Republic destinations.
Do not place API credentials in frontend files or public repositories.
After updating files/environment variables, redeploy on Vercel.
