# Portfolio CMS

This Next.js application uses Firebase Authentication and Cloud Firestore for
the admin dashboard and published portfolio content. Images and the CV PDF
are uploaded directly to Cloudinary using an unsigned upload preset. A
server-only API route securely removes queued Cloudinary assets when they are
no longer referenced by saved or published content. Vercel hosts the site;
no Cloud Functions are used.

The admin dashboard at `/admin` manages Home, About, Contact, Experience,
Projects, and Training & Certificates. Published Firestore documents update
the public pages live. The CV import button works only when the CMS collections
are empty; it publishes CV text, work history, projects, and training records.
It does not upload the original CV or any photos.

## Environment variables

Set the Firebase Web App values and admin UID in `.env.local` for local
development and in Vercel Environment Variables for deployment:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_ADMIN_UID
```

Set these two public Cloudinary values for unsigned uploads:

```text
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

The cloud name and unsigned preset name are not secrets. Cloudinary API
credentials and the Firebase service-account JSON are server-only secrets;
never expose them as `NEXT_PUBLIC_*`, commit them, or send them in chat.

## Cloudinary setup

1. In Cloudinary Console, open **Settings → Upload → Upload presets** and
   create an upload preset with **Signing Mode: Unsigned**.
2. Set its allowed formats to JPG, PNG, WEBP, and PDF. The app accepts images
   and PDFs up to 5 MB each and checks both the MIME type and file size before
   upload. The preset name is not a secret, so restrict the preset to only the
   formats and upload options this portfolio needs.
3. In Cloudinary security settings, enable **Allow delivery of PDF and ZIP
   files** so the public CV link can be opened.
4. Copy the Cloudinary cloud name and unsigned preset name into the two
   environment variables above, both locally and in Vercel.

Images use Cloudinary's image upload endpoint; CV PDFs use its raw file upload
endpoint. Each related Firestore content document stores the secure URL and
Cloudinary public ID. The profile supports one image; each project or
certificate supports up to four images.

The unsigned preset cannot delete assets. Instead, the admin dashboard queues
removed, replaced, or deleted files in Firestore. A server-only API verifies
the Firebase admin session, checks all draft and published content, and uses
the Cloudinary API secret to delete a file only after no content references
it. Save, publish, unpublish, or delete content to retry queued deletions.
Files still used by a saved or published version stay in Cloudinary until that
reference is removed. Assets removed before this cleanup feature was set up
are not in its queue and must be reviewed manually in the Cloudinary Media
Library.

For server-side deletion, set these additional variables in `.env.local` and
in Vercel. Get the Cloudinary API key and secret from Cloudinary Console →
Settings → API Keys. In Firebase, create a dedicated service account with
Firestore read/write access, download its JSON key, and store the complete
JSON as a single-line value:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The route uses `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` for the Cloudinary cloud
name, so no additional cloud-name variable is required. Never paste the
service-account JSON or Cloudinary API secret into client code or chat. After
setting the variables in Vercel, redeploy the site.

## Firebase setup

1. In Firebase Console, enable **Authentication → Sign-in method →
   Email/Password** and **Anonymous**, then create the admin account.
2. Create the Firestore database in Production mode if it does not exist.
3. Keep `NEXT_PUBLIC_FIREBASE_ADMIN_UID` and the UID in `firestore.rules`
   consistent with the Firebase Authentication admin account.

The CV import includes the public email and Manila location, not the phone
number or full street address. Upload only a public-safe CV PDF.

## Local development

```bash
npm install
npm run dev
```

Sign in at `/admin`. If the CMS collections are empty, choose
**Import and publish CV** to create the published Firestore documents.

## Vercel deployment

Add all six `NEXT_PUBLIC_FIREBASE_*` variables and both
`NEXT_PUBLIC_CLOUDINARY_*` variables to **Vercel → Project → Settings →
Environment Variables** for each required environment. Also add the three
server-only deletion variables above. Add the Vercel domain to **Firebase
Console → Authentication → Settings → Authorized domains**, then redeploy
Vercel after updating environment variables.

## Firestore rules

The repository includes Firestore rules for the content collections and the
configured admin UID. The public feedback form can only create bounded,
pending submissions in `feedbackInbox`; only the admin can read or moderate
them. Visitors can read `publicFeedback`, but only the admin can publish to it.
Likes are stored once per Firebase anonymous user under each published
feedback item. Enable the Anonymous sign-in provider in Firebase Authentication;
visitors do not need a visible login screen. Clearing browser data or switching
devices can create a new anonymous identity.
In Firebase Console, open **Firestore Database → Rules**, publish the contents
of `firestore.rules`, and confirm the selected Firebase project matches
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`. The feedback form will be blocked until the
rules are published to the project used by the site. The same rules grant the
portfolio admin access to `cloudinaryDeletionQueue`. No rules or hosting
deployment is performed by this setup.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm start
```
