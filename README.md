# Cafflora

The website for Cafflora, a coffee house in Whitefield, Bengaluru. Customers sign in with Google, explore the menu in a cinematic 3D scene, and order to their table or for pickup. Staff see orders arrive on a live board.

## Run it on this computer

You need Node.js 22 and MongoDB running (the MongoDB Windows service is enough).

```powershell
npm install
npm run dev
```

Open http://localhost:5173. Until Google sign-in is set up, use **Preview without Google**.

To run it the way it will run live:

```powershell
npm run build
npm start
```

Then open http://localhost:4000.

## Turn on Google sign-in

1. Go to Google Cloud Console, then **APIs & Services**, then **Credentials**.
2. Choose **Create credentials**, then **OAuth client ID**, with application type **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:5173` and `http://localhost:4000`. Add your real domain later.
4. Copy the client ID into `server/.env` as `GOOGLE_CLIENT_ID=...`.
5. Restart the server.

Staff access: put the Google accounts that should see `/staff` in `STAFF_EMAILS`, separated by commas.

## Put it online (Render and MongoDB Atlas)

The site runs on [Render](https://render.com) as one Node service, set up by `render.yaml`. The database is on [MongoDB Atlas](https://www.mongodb.com/atlas).

1. **Database.** In Atlas, create a free cluster in the Mumbai region and a database user. Under **Network Access**, allow access from anywhere (Render has no fixed address). Copy the connection string and put `/cafflora` at the end.
2. **Code.** Push this folder to a private GitHub repository. `server/.env` stays on this computer.
3. **Service.** In Render choose **New**, then **Blueprint**, and pick the repository. Fill in:
   - `MONGODB_URI`: the Atlas connection string
   - `GOOGLE_CLIENT_ID`: the same client ID as in `server/.env`
   - `STAFF_EMAILS`: the Google accounts that can open `/staff`

   Render makes a new `SESSION_SECRET` and sets `NODE_ENV=production`, which turns off **Preview without Google**.
4. **Domain.** In the service's **Settings**, add your domain under **Custom Domains** and set the DNS records Render shows. HTTPS is set up for you.
5. **Google sign-in.** In Google Cloud Console, add `https://your-domain` and the `onrender.com` address to **Authorized JavaScript origins**. On the **OAuth consent screen**, set the publishing status to **In production**, or only listed test users can sign in.

After that, every push to GitHub updates the site.

To copy the local data across (optional): `mongodump --db cafflora`, then `mongorestore --uri "<Atlas connection string>" dump/`.

## Table QR codes

Each table's QR code should link to the site with its number, for example `https://your-domain/?table=4`. The order form then fills in the table automatically.

## Photos

| What | Where | Shape |
| --- | --- | --- |
| Menu photo for each drink | `client/public/images/menu/<id>.jpg`, with ids from `server/src/menu.js` (for example `cappuccino.jpg`) | 4:3 landscape |
| Café interior, three photos | `client/public/images/cafe/interior-1.jpg`, `interior-2.jpg`, `interior-3.jpg` | 3:4 portrait |

Not sure which name goes where? Drop the files in `photos-inbox/` and ask Claude to sort them.

## Change the menu

Edit `server/src/menu.js` and restart the server. Prices are in rupees and are always checked on the server.

## Change the 3D cup

The cup is modelled in Blender by `blender/make_cup.py`:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python blender/make_cup.py -- client/public/models/cafflora-cup.glb
```
