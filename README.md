# paradiso by Sachin
1. Firebase: create project, enable Firestore + Auth (Google). Paste `firestore.rules` (change the email). Add your Vercel domain under Auth > Authorized domains.
2. Cloudinary: Settings > Upload > add an **unsigned** preset.
3. `cp .env.example .env`, fill it. `npm i && npm run dev`.
4. Push to GitHub, import in Vercel, add the same env vars there.
5. Open `/#admin`, sign in with Google (your email only), start writing.
