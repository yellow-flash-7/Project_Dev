# CertiTrust — simple setup guide (Windows + VS Code)

Follow these steps in order. Run every command in the VS Code terminal opened inside the `CertiTrust` project folder.

## Step 1 — Extract and open
1. Extract `CertiTrust.zip`.
2. Open VS Code → **File → Open Folder** → select the extracted `CertiTrust` folder.
3. In VS Code choose **Terminal → New Terminal**.
4. Confirm the terminal path ends with `\CertiTrust`.

## Step 2 — Create your private environment file
1. Copy `.env.example` in the VS Code Explorer.
2. Paste the copy in the same folder and rename it to `.env`.
3. Open `.env` and replace `YOUR_PASSWORD` with your PostgreSQL password.
4. Save with **Ctrl + S**.
5. Keep `.env` private. Never send it in screenshots or upload it to GitHub.

The connection line format is:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/certitrust
```

If your PostgreSQL port or username is different, use your own values. The database name in this example is `certitrust`.

## Step 3 — Make sure PostgreSQL is running
1. Open pgAdmin 4.
2. Connect to your PostgreSQL server.
3. Keep pgAdmin open while setting up the project.

## Step 4 — Install project packages
In the VS Code terminal:

```powershell
npm install
```

Wait until installation finishes.

## Step 5 — Create the database

```powershell
npm run db:create
```

If it says the database already exists, that is okay. Continue to Step 6.

## Step 6 — Create the tables

```powershell
npm run db:setup
```

Wait for the message that the PostgreSQL schema is ready.

## Step 7 — Test the database connection

```powershell
npm run db:check
```

It should print `PostgreSQL connected` and show `certitrust` as the database name.

## Step 8 — Create demo accounts

```powershell
npm run db:seed
```

Demo login details:
- Admin email: `admin@certitrust.com`
- Admin password: `admin@360`
- Institution email: `institution@abcuniversity.edu.in`
- Institution password: `Inst@123`

These are demo credentials. Change them before using the project for real records.

## Step 9 — Start the website

```powershell
npm run dev
```

Open Chrome or Edge and visit:

`http://localhost:5000`

You should see the CertiTrust introduction video and the **Start CertiTrust** button. Click the button to open the original website.

## Step 10 — Test each section
1. On the main website, test public certificate verification.
2. Open **Institution / Admin Login**.
3. Sign in as admin and test the admin dashboard.
4. Sign in as the demo institution and test the institution dashboard.
5. Upload a test PDF certificate and verify it with its generated certificate ID/QR.

## If something fails
- Database does not exist → check `.env` and run `npm run db:create`.
- Password authentication failed → correct the PostgreSQL password in `.env`.
- Connection refused → start the PostgreSQL Windows service and check port `5432`.
- Table/relation missing → run `npm run db:setup`.
- Website does not open → check that `npm run dev` is still running and use port `5000`.
- Port already in use → change `PORT=5001` in `.env` and open `http://localhost:5001`.

Stop the server with **Ctrl + C** in the terminal.
