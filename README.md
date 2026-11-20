# Portfolio CMS

This Next.js application uses Firebase Authentication and Cloud Firestore for
the admin dashboard and published portfolio content. Images and the CV PDF
are uploaded directly to Cloudinary using an unsigned upload preset. Vercel
hosts the site; no custom server or Cloud Functions are used.

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

The cloud name and unsigned preset name are not secrets. The app does not use
or require a Cloudinary API secret, service account key, password, or token.

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

Because the preset is unsigned, the client can upload but cannot securely
delete assets from Cloudinary. Replacing or removing a file unlinks it from the
portfolio document; the asset remains in Cloudinary and can be manually
removed from the Cloudinary Media Library.

## Firebase setup

1. In Firebase Console, enable **Authentication → Sign-in method →
   Email/Password** and create the admin account.
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
Environment Variables** for each required environment. Add the Vercel domain
to **Firebase Console → Authentication → Settings → Authorized domains**,
then redeploy Vercel after updating environment variables.

## Firestore rules

The repository includes Firestore rules for the content collections and the
configured admin UID. No rules or hosting deployment is performed by this
setup.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm start
```
