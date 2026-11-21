MOVIARA Message Studio — Unlimited Messaging SMS

This Vercel API sends SMS through Unlimited Messaging.

Required Vercel environment variable:
- UM_API_KEY (create at https://app.unlimitedmessaging.app/api)

Do not put the API key in frontend files or public repositories.
Set UM_API_KEY in Vercel Project Settings > Environment Variables, then redeploy.

Endpoint: POST /api/send-sms
Body: { "to": "+15551234567", "message": "Your message" }

The payment method's mark in the website preview is visual only. Standard SMS cannot display logos.
On the Free Unlimited Messaging plan, text messages include the “Sent with UnlimitedMessaging.app” footer.
API acceptance is not proof of delivery; check the Unlimited Messaging dashboard for message status.
