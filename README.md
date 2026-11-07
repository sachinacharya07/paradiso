# paradiso by Sachin

A personal corner of the internet styled with a vaporwave desktop OS aesthetic on the outside and a clean, spacious editorial layout on the inside.

---

## ✦ Features

- **Desktop OS Metaphor**: Retro window chrome, draggable icons, glitch title animation, taskbar, and live `now.txt` status window.
- **Clean Editorial Interior**: Generous typography and calm single-column reading space inside windows for posts, essays, and poems.
- **Draggable Scrapbook**: Interactive polaroid scrapbook layout with drag-and-drop positions persisted in `localStorage`.
- **Search & Shortcuts**: Instant debounced search across all entries (`/` key to focus, `Escape` to close windows/modals).
- **Dark Mode**: Theme toggle in taskbar (`☾` / `☀`) persisted across sessions and respecting system preferences.
- **Reading Time Estimates**: Automatic calculation for longer form essays and posts.
- **Guestbook**: Moderated visitor messages with honeypot spam protection and approval workflow.
- **Visitor Counter**: Firestore-backed session visitor counter.
- **Admin Panel (`/#admin`)**: Google Authentication-protected editor with draft auto-saving, Markdown live preview, Cloudinary image upload, and status updater.
- **Robust & Secure**: Built-in HTML escaping for Markdown rendering, comprehensive error boundaries and toast notifications, pagination support.

---

## ✦ Setup Instructions

### 1. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Firestore** and **Authentication** (Google Sign-In provider).
3. Copy the contents of `firestore.rules` into **Firestore Database > Rules** (replace `your@gmail.com` with your Google email).
4. Add your deployment domain (e.g. `*.vercel.app` or custom domain) under **Authentication > Settings > Authorized domains**.

### 2. Cloudinary Setup (Image Uploads)
1. In [Cloudinary](https://cloudinary.com/), navigate to **Settings > Upload**.
2. Scroll to **Upload presets** and add an **unsigned** preset.

### 3. Local Development
```bash
cp .env.example .env
# Fill in your Firebase and Cloudinary credentials in .env
npm install
npm run dev
```

### 4. Deployment (e.g., Vercel)
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Configure the environment variables from your `.env` in the Vercel project settings.
4. Deploy!

### 5. Managing Content
- Visit `/#admin` on your deployed site.
- Click **sign in with Google** using your admin email.
- Compose posts, manage entries, edit your `now.txt` status, and moderate guestbook messages.
