ProfileInsight is a Chrome extension (Manifest V3) that lets people leave and read **reviews, ratings, and comments on public LinkedIn profiles**, directly while browsing LinkedIn. It opens as a Chrome side panel, detects whichever LinkedIn profile you're currently viewing, and shows/collects community feedback about that person — with a full LinkedIn-blue themed UI that matches LinkedIn's own look and feel.

---

## What it does (main features)

- **LinkedIn OAuth login/signup** — sign in with your LinkedIn account (`chrome.identity.launchWebAuthFlow`), no separate password/account needed.
- **Automatic profile detection** — a content script runs on every `linkedin.com/in/*` page, scrapes the profile's name, headline, and photo straight out of the LinkedIn DOM, and reacts in real time as you navigate between profiles inside LinkedIn's single-page app (no full reload needed).
- **Reviews & ratings** — write a 1–5 star rating with a written description for the profile you're viewing; optionally post anonymously. Reviews sync back to the panel immediately after submitting, and again the instant you switch to a different LinkedIn profile tab.
- **Comments & likes** — comment on other people's reviews, and like/unlike reviews and comments.
- **Claim Profile** — the profile owner can "claim" their own LinkedIn profile inside the extension via a confirmation-code flow, associating the `Profile` record with their `Contact` account.
- **Follow** — follow profiles you're interested in tracking.
- **My Reviews** — a personal list of every review the logged-in user has written, across all profiles, clickable to jump straight back to that LinkedIn profile tab.
- **Personal Information** — an in-panel editable profile form (first name, last name, email).
- **Profile photo upload** — upload a custom avatar (max 1MB, validated both client- and server-side), shown everywhere the logged-in user's identity appears (header, profile menu, review list).
- **Premium** — placeholder entry point for a paid tier (via `extpay`).

---

## How the system works (architecture)

The project has two independent pieces that talk to each other over HTTP:

```
┌───────────────────────────── Chrome Extension (Manifest V3) ─────────────────────────────┐
│                                                                                            │
│  contentScript.js  ──(chrome.runtime.sendMessage)──▶  Side Panel (React SPA)              │
│  (injected into every                                  sidepanel.html / sidepanel.tsx      │
│   linkedin.com/in/* page,                              │                                  │
│   scrapes name/photo,                                  │ (all screens: Login, Register,   │
│   patches history.pushState/                           │  Reviews, ProfilePage, My Reviews,│
│   replaceState + popstate to                           │  Personal Information, etc.)      │
│   detect SPA navigation)                                ▼                                 │
│                                                    background.js (service worker)          │
│                                                    - brokers chrome.identity.launchWebAuthFlow│
│                                                      for the LinkedIn OAuth popup            │
└──────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                        │  REST calls (axios, JSON / multipart)
                                        ▼
┌───────────────────────────── Backend API (Node / Express) ───────────────────────────────┐
│  server.js  → routers mounted under /admin/api/contacts, /admin/reviews,                  │
│               /admin/reviews/comments (all behind a shared `authtoken` header check)       │
│                                                                                             │
│  - contacts.js   LinkedIn OAuth code exchange, contact CRUD, profile image upload (multer) │
│  - reviews.js    submit/update/delete/like review, claim/cancel/confirm claim, my_reviews   │
│  - comments.js   save/update/delete/like comment                                           │
│                                                                                             │
│  Mongoose models: Contact, Profile, Review, Comment, ClaimRequest                           │
└──────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                        ▼
                                 MongoDB (Atlas)
```

**Key flows:**

1. **Login** — `Register.tsx` builds the LinkedIn authorization URL and asks `background.js` to run `chrome.identity.launchWebAuthFlow`. LinkedIn redirects to a `chromiumapp.org` callback URL with an auth `code`, which is posted to the backend (`POST /admin/api/contacts/data`), which exchanges it for an access token, fetches the LinkedIn profile, and upserts a `Contact`. The extension stores the returned contact/profile in `localStorage`.
2. **Real-time profile detection** — the content script patches `history.pushState`/`replaceState` and listens for `popstate` (LinkedIn is a SPA, so `chrome.tabs.onUpdated`'s "complete" event doesn't fire on in-app navigation), re-scrapes the DOM, and messages the side panel (`linkedinUrlChanged`) so the reviews shown update instantly when you move to a different profile.
3. **Reviews** — the side panel posts new reviews to `POST /admin/reviews/submit_review` and immediately refetches that profile's reviews, so ratings reflect on-screen without a manual refresh.
4. **Claim Profile** — the logged-in user requests a claim code for the profile they're viewing (`POST /admin/reviews/claim_profile`), confirms it (`confirm_claim_request`), and the `Profile.claimed_by` is set to their `Contact`.
5. **Profile photo** — uploaded via multipart form data to `POST /admin/api/contacts/upload_profile_image` (max 1MB, enforced by both the React form and a `multer` file-size limit on the backend), stored on disk under `backend/uploads/profile/`, and served statically at `/uploads/profile/<filename>`.

---

## Tech stack

**Extension / frontend**
- React 18 + TypeScript
- Chrome Extension Manifest V3 (side panel, content script, background service worker)
- React Router (in-panel routing)
- Formik + Yup (forms & validation)
- Axios (HTTP client)
- Tailwind CSS (custom LinkedIn-blue theme)
- react-hot-toast (notifications)
- Webpack 5 (build/bundling)

**Backend**
- Node.js + Express
- MongoDB + Mongoose (MongoDB Atlas)
- Multer (profile image uploads)
- CORS, dotenv

---

## Project structure

```
.
├── src/
│   ├── background.js              # service worker: brokers the LinkedIn OAuth popup
│   ├── config.js                  # API base URL, LinkedIn OAuth config, shared auth token
│   ├── contentScript/
│   │   └── ContentScript.tsx      # scrapes LinkedIn profile DOM, detects SPA navigation
│   ├── sidepanel/
│   │   └── sidepanel.tsx          # top-level routed SPA (all screens live under here)
│   ├── components/
│   │   ├── Auth/                  # Login, SignUp, Register (LinkedIn OAuth), VerifyEmail
│   │   ├── Reviews/                # ReviewPage, ReviewForm, ReviewsList, AddComment
│   │   ├── Loader/                # Loading states
│   │   ├── Header.tsx, Footer.tsx, GetStartedPage.tsx
│   │   ├── ProfilePage.tsx         # profile menu + avatar upload
│   │   ├── MyReviews.tsx           # reviews written by the logged-in user
│   │   └── PersonalInformation.tsx # editable profile form
│   └── static/manifest.json        # Chrome extension manifest
├── backend/
│   ├── server.js                  # Express app entry point, multer/upload config
│   └── src/
│       ├── db.js                  # MongoDB connection
│       ├── middleware/authToken.js
│       ├── models/                # Contact, Profile, Review, Comment, ClaimRequest
│       ├── routes/                # contacts.js, reviews.js, comments.js, dev.js
│       └── utils/                 # linkedin.js (OAuth), dto.js, extras.js
├── webpack.config.js / webpack.prod.js / webpack.dev.js
└── tailwind.config.js
```

---

## Getting started

### Prerequisites
- Node.js (v16+) and npm
- A MongoDB connection string (MongoDB Atlas or local)
- A LinkedIn OAuth app (Client ID/Secret) with the redirect URI matching your extension's `chromiumapp.org` callback

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=<your MongoDB connection string>
STATIC_AUTH_TOKEN=<shared token the extension sends in the `authtoken` header>
LINKEDIN_CLIENT_ID=<LinkedIn app client id>
LINKEDIN_CLIENT_SECRET=<LinkedIn app client secret>
LINKEDIN_REDIRECT_URI=https://<your-extension-id>.chromiumapp.org/linkedin-callback
```

```bash
npm run dev   # nodemon, restarts on change
# or
npm start
```

### 2. Extension (frontend)

From the project root:

```bash
npm install
```

Create a root `.env`:

```
REACT_APP_LINKEDIN_APP_ID=<same LinkedIn client id>
REACT_APP_LINKEDIN_APP_SECRET=<same LinkedIn client secret>
REACT_APP_API_BASE_URL=http://localhost:5000
```

Build:

```bash
npm run build     # one-off production build → dist/
npm run watch     # rebuild on file changes, for active development
```

### 3. Load it in Chrome

1. Go to `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select the `dist/` folder.
3. Note the generated extension ID — it must match the `chromiumapp.org` redirect URI registered on your LinkedIn OAuth app and in `backend/.env`.
4. Click the extension icon to open the side panel, then log in with LinkedIn and navigate to any `linkedin.com/in/...` profile.

---



## License

MIT


Visuals 

<img width="470" height="893" alt="mainpage" src="https://github.com/user-attachments/assets/afc49e9f-edcd-4629-a99b-86f0415f728a" />

<img width="470" height="893" alt="signup" src="https://github.com/user-attachments/assets/6c37ab70-50ba-42c6-bc7f-4fa54832b631" />

<img width="1851" height="983" alt="main-page-with-full" src="https://github.com/user-attachments/assets/2d10fbe4-ba08-4593-a66a-3f78ed55dc66" />

<img width="470" height="893" alt="main-linkedin-page" src="https://github.com/user-attachments/assets/b00d4070-9f79-4b32-a839-1e50cfc0e5a5" />

<img width="470" height="893" alt="profile" src="https://github.com/user-attachments/assets/8e6aad54-0d02-499f-a139-16021c3b8747" />

<img width="470" height="893" alt="all-reviewed" src="https://github.com/user-attachments/assets/3ce58b6e-b802-433a-9755-b70f58cd2198" />

<img width="470" height="893" alt="not-on-linkedinpage" src="https://github.com/user-attachments/assets/a612f7a9-f348-4602-983d-186bc3e08830" />

