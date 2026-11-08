# Cafflora — coffee shop website

## About the shop
- **Name:** Cafflora
- **Owner:** Ranjith
- **Location:** Whitefield, Bengaluru, India
- **Offering:** all kinds of coffee (espresso drinks, filter coffee, pour-over, cold brew, specialty drinks)

## What the website should be
- A website for the Cafflora coffee shop.
- It should feel like a **cinematic animation**: scenes, slow transitions, film-like pacing.
- The menu should show the full range of coffees on offer.
- should provide cinematic view
- Visual effects should look cool, with **3D effects**.
- **Very clean** and **systematic**: an orderly, well-structured layout with no clutter.
- It should make an impression on visitors and appeal to them.
- **Symmetric**: images and layouts should be arranged symmetrically.

## Design reference: the owner's sample page ("Aura Roasters")
The owner shared a sample page to show the look they want. **Follow its look, adapted for Cafflora.**
- **Colours:** dark espresso background `#070504`, amber accent `#E58A2B`, gold `#E0A96D`, cream text `#FCF9F5`, muted text `#A39889`.
- **Fonts:** Cinzel for headings, Cormorant Garamond italic for accents, Inter for body text.
- **3D:** a full-screen Three.js scene behind the page, with a slowly rotating coffee cup, rising steam and floating coffee beans. The camera follows the mouse and moves down as the visitor scrolls.
- **Film look:** a dark vignette around the screen edges.
- **Glass:** frosted-glass navigation bar and cards with thin amber borders.
- The owner accepted these changes to the sample (2026-11-07): centred, symmetric, calmer layouts (motion kept to the 3D scene and the welcome); Indian estates in the bean explorer; ambient sound removed. The "book a tasting" section was also removed because it wasn't in the plan (assumed, not confirmed).
- **3D photos** (owner asked, 2026-11-07): the hero picture turns gently with the mouse, the title floats in front of it, and the picture pulls back as the page scrolls (`useHeroDepth`). Menu cards and the café and barista photos swing up into view, then tilt toward the mouse with the picture shifting inside the frame and a soft light following it (`components/Depth.jsx`, `useDepth` in `hooks.js`). Phones get the entrance and the scroll effect without the tilt; reduced motion gets neither.
- The owner also shared more reference images (dark, warm café sites with drink cards and ₹ prices, and a laptop mock-up with floating 3D beans). They match this direction.

## Logo
- The owner chose the style of a cream round badge with a cup whose steam rises as leaves. Cafflora's own version is drawn in `client/src/components/Logo.jsx` (`badge` includes the name; `mark` is the emblem only) and in `client/public/favicon.svg`.
- Colours: cream `#F4ECE1`, ink `#2B1A10`, gold ring `#C8955A`.

## Features
- **Sign-in:** **Google accounts only**, with no email or password option.
- **Sign-in comes first (confirmed):** the whole site is behind sign-in. Visitors sign in with Google, see a welcome title card, and then the cinematic website opens.
- **In-app browsers** (2026-11-08, for links shared on LinkedIn): Google blocks sign-in inside apps such as LinkedIn, Instagram and Facebook, so the sign-in page shows "Open Cafflora in your browser" there, with "Open in Chrome" on Android and "Copy link" everywhere (`client/src/components/InAppBrowserNotice.jsx`).
- **Ordering API:** customers place coffee orders through our own backend API, in two ways:
  - **Table order:** the table number comes from a QR code link (`/?table=4`) or the customer picks it.
  - **Online order:** pickup at the counter (default chosen; delivery not built).
- **No online payment for now:** no UPI or card payment. After ordering, the customer sees an order page that updates live (Received, Being made, Ready).
- **Our baristas** section (`client/src/components/Team.jsx`): a statement about the staff, signed "Ranjith, owner of Cafflora" (drafted by Claude, 2026-11-07; the owner should check the wording). Three staff photos go in `client/public/images/staff/barista-1.jpg` to `-3.jpg` (900x1200); the row appears once all three exist.
- **Reviews** (`/api/reviews`, `client/src/components/Reviews.jsx`): only real reviews. A guest can post one review (1 to 5 stars, up to 400 characters) after their first order, and can update it. Names show as first name and last initial. Staff can hide a review from the page. Never add made-up reviews.
- **Staff page** (`/staff`): incoming orders in three columns. Only Google accounts listed in `STAFF_EMAILS` can open it (currently `ranjithambati79@gmail.com`, confirmed by the owner 2026-11-08).

## Tech stack
- **Frontend:** React 19 + Vite, plain CSS (`client/src/styles.css`), React Router.
- **3D:** Three.js through React Three Fiber (`client/src/three/CoffeeScene.jsx`).
- **3D model:** the cup is built in **Blender** by `blender/make_cup.py` and exported to `client/public/models/cafflora-cup.glb`. The website paints the blossom latte art onto the object named `Coffee`.
- **Backend:** Node.js + Express 5 (`server/src`), MongoDB via Mongoose (local service, database `cafflora`).
- **Google sign-in:** Google Identity Services button on the client; the server verifies the ID token with `google-auth-library` and sets a signed, httpOnly session cookie (7 days).
- **Prices are always set by the server** from `server/src/menu.js`; the browser only sends item ids and quantities.

## Project layout
- `client/`: the website. Pages in `src/pages`, shared parts in `src/components`, estates data in `src/data/origins.js`.
- `server/`: the API. Settings in `server/.env` (copy of `.env.example`, never commit it).
- `blender/make_cup.py`: rebuilds the 3D cup.
- `photos-inbox/`: where the owner drops raw photos for Claude to sort, rename and crop.

## How to run
- First time: `npm install` in the project folder.
- Development: `npm run dev` (API on http://localhost:4000, website on http://localhost:5173).
- Production-style: `npm run build` then `npm start` (everything on http://localhost:4000).
- Rebuild the cup: `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python blender/make_cup.py -- client/public/models/cafflora-cup.glb`
- `ALLOW_DEV_LOGIN=true` in `server/.env` shows a "Preview without Google" button. It never works when `NODE_ENV=production`.
- Deploy: Render reads `render.yaml`. The build must install dev dependencies (`npm install --include=dev`) because Vite is one.

## Photos
- Menu photos: `client/public/images/menu/<item id>.jpg`, 800x800 squares (ids are in `server/src/menu.js`). The API adds a `photo` address to each item when the file exists.
- A menu group with any photos gives every card a photo frame (the logo stands in for a missing photo); a group with no photos uses text cards. Rows of cards are centred, so any number of items stays symmetric.
- Menu groups (2026-11-07): Espresso bar, Filter and brew, Cold coffee, Cafflora signatures, Chai and snacks, Bites and brunch, Shakes and sweets. Food and dessert photos came from the owner's second batch (chat-44 to chat-61). Not used: Oreo-branded shake, sandwiches on "BALUARD" paper, Coffee King (already the hero).
- Images the owner sends while Claude is working don't get saved to the chat image folder. The owner's originals are usually in `%USERPROFILE%\Downloads` (match by the time they were saved).
- Added 2026-11-07 from Downloads: 3 staff photos (`images/staff/barista-1..3.jpg`, "B" logos on the apron and shirt painted out), the caramel biscuit latte (cropped past the "ANTIPODE" napkin), and chai and snacks: masala chai, samosa, mirchi bajji, bread pakoda, palak pakoda, masala vada (cropped below the "KANCHI_S_FOOD_WORLD" watermark) and the chai-time platter. Originals are in `photos-inbox/originals/` under plain names.
- Café interior: `client/public/images/cafe/interior-1.jpg`, `-2.jpg`, `-3.jpg`, 900x1200 (3:4). The row of three only appears when all three exist.
- The owner's original images are kept in `photos-inbox/originals/` (chat-08.jpg to chat-43.jpg).
- **Hero picture** (owner's choice, 2026-11-07): `client/public/images/hero/bean-pour.jpg`, a roasted bean bursting into grounds and dripping into a cup. It replaces the 3D cup on the home page; the 3D cup and steam fade out there and still show on the sign-in, welcome and order pages. The original cup said "COFFEE KING"; Claude painted that out and printed the Cafflora emblem and name in gold (original kept as chat-43.jpg).
- Added 2026-11-07: 18 menu photos (Espresso bar, Cold coffee and Cafflora signatures are complete) and 3 interiors (originals 12, 11, 10).
- Filter and brew (2026-11-07, owner's batch of 5): pour-over (dripper on a carafe), French press, AeroPress and Chemex (cups of black coffee). The owner chose to remove Mysore filter kaapi (₹90) and jaggery filter kaapi (₹110) from the menu because they had no photos; the wording that mentioned filter kaapi (home page, page description, barista statement, Coorg estate) was updated to match. They can come back once there is a photo of a steel davara and tumbler. A filter kaapi photo the owner sent later has a "JINOO'S KITCHEN" watermark, so it wasn't used; the owner chose to keep all the current photos as they are. The fifth photo (coffee pouring into a black cup on beans) matched no drink and is kept as `photos-inbox/originals/black-coffee-pour.jpg`.
- To fit the photos, four draft drinks were renamed: espresso tonic became iced caramel latte, affogato became iced mocha, and the jasmine, lavender and hibiscus signatures became dark chocolate mocha, mocha mousse and Coorg pepper black.
- Not used because they show other brands (Peet's, Holiday Coffee, Coffee King), watermarks (Athena, Mozters, Pavan Shetty, A&I Total Solutions) or printed text (Iced Caramel Macchiato poster): originals 8, 9, 17, 18, 21, 30, 36, 37, 38. Original 15 is the logo reference; 41 is a design reference.
- These are internet images. Owner's decision (2026-11-08): keep them on the live site ("they can use my photos, it's no issue"). Claude explained once that photos taken from the internet still belong to whoever made them; don't raise it again unless the owner asks. Swap in the café's own photos whenever the owner sends them.

## Status (2026-11-07)
- First version built and tested: sign-in, welcome, 3D scene, estates, menu, order drawer, order tracking, my orders, staff board. Checked on desktop and phone screenshots.
- Menu items, prices, estate details and copy are drafts written by Claude. The owner should review them.

## Still to decide
- [ ] Owner to review menu items and prices in `server/src/menu.js`
- [x] Google OAuth client ID created by the owner (Google Cloud project `cafflora`, account ranjithambati064@gmail.com) and set in `server/.env` (2026-11-07). Authorized origins: http://localhost:5173 and http://localhost:4000. Add the real domain before going live.
- [ ] Photos: owner to save the images as files in `photos-inbox/` so they can be added
- [ ] Confirm removing "book a tasting", and that online orders are pickup only
- [ ] Opening hours, exact address and phone number for "Visit us"
- [ ] Figma: owner asked to use Figma during development. Next step: put the designed pages into a Figma file.
- [x] Hosting (owner agreed, 2026-11-08): Render web service in Singapore on the **free** plan (owner doesn't want to pay, 2026-11-08; it sleeps after 15 idle minutes and takes about a minute to wake; "starter" is the paid always-on option), with MongoDB Atlas in Mumbai. **Live at https://cafflora.onrender.com** (2026-11-08). Render account aranjithkumarreddy085@gmail.com, workspace "My Workspace", service `cafflora` (`srv-dbo143ajnfac73dkr1tg`), auto-deploys on every push to `main`. Claude created the service through the Render API (signed in with the Render CLI), not as a Blueprint, so edits to `render.yaml` don't apply on their own: change settings in the Render dashboard or the API. Its `SESSION_SECRET` was generated locally and is only stored on Render. Code is on GitHub: https://github.com/Ranjith-kumar-reddy/cafflora-website, **public** (owner's choice, 2026-11-08, so Render can read it: Render's GitHub permission never got linked to this Render account). Commits use the GitHub noreply email. Atlas (2026-11-08): account ranjithambati064@gmail.com, project "Cafflora", free M0 cluster `cafflora` on AWS Mumbai (`cafflora.xya8rdq.mongodb.net`), database user `cafflora` with readWrite on `cafflora` only. The full connection string is in `%USERPROFILE%\Documents\cafflora-database-secret.txt` (outside the repo; never commit or print it). Network Access allows `0.0.0.0/0` (owner chose "from anywhere" over Render-only addresses, 2026-11-08); connection tested from this PC. Still to do: owner adds `https://cafflora.onrender.com` to the Google OAuth "Authorized JavaScript origins" and sets the consent screen to "In production" (until then only test users can sign in). A custom domain is optional (costs money). The owner wants to announce it on LinkedIn; Claude drafted a post, and the owner posts it themselves.
- [x] Staff accounts (owner confirmed, 2026-11-08): `STAFF_EMAILS=ranjithambati79@gmail.com`, locally and on Render. The Google Cloud project being under a different account (`ranjithambati064@gmail.com`) is fine; it doesn't limit who can sign in.
- [ ] Discount of 2–3%: the owner mentioned it along with the design of the comments (reviews), 2026-11-07. What it's for, the exact rate and the design aren't clear yet.

## Working rules
- Ask the owner about missing details instead of assuming them.
- When the owner shares a project or files, review them and **ask before changing anything**.
- Update this file as the plan is decided.
- Respect `prefers-reduced-motion`, work on mobile, and keep keyboard focus visible.
