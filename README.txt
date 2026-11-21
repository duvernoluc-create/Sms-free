MOVIARA Message Studio - Unlimited Messaging

This project is a Vercel static site with a serverless API route.

Deployment:
1. Upload this folder to GitHub and deploy it on Vercel.
2. In Vercel Project Settings > Environment Variables, add:
   UM_API_KEY = your Unlimited Messaging API key
   Environment: Production (and Preview if desired)
3. Redeploy after adding or changing environment variables.
4. Connect the WhatsApp and email accounts in Unlimited Messaging:
   https://app.unlimitedmessaging.app/accounts
5. Create an API key at:
   https://app.unlimitedmessaging.app/api

Security:
- Keep UM_API_KEY server-side only.
- Never put the key in index.html or a public repository.
- If the key leaks, revoke it in the Unlimited Messaging dashboard.

Channels:
- SMS, WhatsApp, and Email are selectable in the site.
- Email requires a customer email and subject.
- SMS/WhatsApp require an international phone number.
- The app shows a success animation when the API accepts the request,
  but API acceptance is not the same as confirmed delivery. Verify delivery
  in the Unlimited Messaging dashboard.
- Free-plan messages may include the UnlimitedMessaging.app footer.
