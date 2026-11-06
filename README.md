# CertiTrust — PostgreSQL Edition

CertiTrust is an academic certificate authenticity validator. It includes a welcome intro video, public certificate verification, institution registration and approval, certificate issuance, SHA-256 document checks, QR verification, and admin-controlled change requests.

## Requirements
- Windows 10/11
- Node.js 20 LTS or newer
- PostgreSQL 15+ and pgAdmin 4
- VS Code

## 1. Extract and open the project
1. Extract `CertiTrust.zip` to a folder such as `E:\CertiTrust`.
2. Open VS Code.
3. Select **File → Open Folder** and choose the extracted `CertiTrust` folder.
4. Open **Terminal → New Terminal**.

## 2. Configure PostgreSQL connection
1. In VS Code Explorer, make a copy of `.env.example` and name the copy `.env`.
2. Open `.env`.
3. Replace `YOUR_PASSWORD` with your PostgreSQL password. Do not share `.env` or upload it to GitHub.
4. The default database name is `certitrust`, port is `5432`, and username is `postgres`.
5. If your PostgreSQL username, port, or database name is different, update the same part of `DATABASE_URL`.
6. If your password contains special URL characters such as `@`, encode them. For example, `@` becomes `%40`.

Example format (use your own password):

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/certitrust
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PUBLIC_BASE_URL=http://localhost:5000
MAX_FILE_SIZE=5242880
```

## 3. Install packages
Run in the VS Code terminal from the project folder:

```powershell
npm install
```

## 4. Create the database
Make sure the PostgreSQL service is running, then run:

```powershell
npm run db:create
```

This creates the database named in `DATABASE_URL` if it does not already exist. The PostgreSQL user must have permission to create databases. If you already created `certitrust`, the command safely reports that it exists.

## 5. Create the tables

```powershell
npm run db:setup
```

## 6. Check the database connection

```powershell
npm run db:check
```

Expected output includes `PostgreSQL connected` and the database name.

## 7. Add demo accounts and sample certificate

```powershell
npm run db:seed
```

Demo accounts:
- Admin: `admin@certitrust.com` / `admin@360`
- Institution: `institution@abcuniversity.edu.in` / `Inst@123`

Change demo passwords before using this outside a local demonstration.

## 8. Start CertiTrust

```powershell
npm run dev
```

Open this address in your browser:

`http://localhost:5000`

The welcome page plays the local intro video. Select **Start CertiTrust** to open the existing certificate website. If browser autoplay is disabled, the welcome page still shows its poster and Start button.

## Main workflows

### Public verification
- Open **Verify certificate** on the main website.
- Enter a certificate ID, or scan its QR code.
- To check the original document, upload the same PDF/image that was issued.

### Institution
1. Register from the login page and upload the institution proof document.
2. Wait for admin approval.
3. Log in after approval.
4. Enter student and certificate details and upload the original certificate.
5. CertiTrust saves the SHA-256 fingerprint and creates a QR verification link.

### Admin
1. Log in with the admin demo account.
2. Review institution registrations and open their proof documents.
3. Approve or reject pending institutions.
4. Review student/certificate change requests.

## Useful URLs
- Welcome page: `http://localhost:5000/`
- Main website: `http://localhost:5000/home.html`
- Login: `http://localhost:5000/pages/login.html`
- Database health: `http://localhost:5000/health`

## Troubleshooting

- **`database "certitrust" does not exist`**: Check `DATABASE_URL` in `.env`, then run `npm run db:create`.
- **`password authentication failed`**: Check the PostgreSQL password in `.env`.
- **`ECONNREFUSED 127.0.0.1:5432`**: Start the PostgreSQL service and confirm the port.
- **`relation does not exist`**: Run `npm run db:setup`.
- **Cannot GET /**: Start the app with `npm run dev` and open `http://localhost:5000`.
- **Port 5000 is busy**: Change `PORT=5001` in `.env`, then open `http://localhost:5001`.

## Important notes
- The `.env` file is intentionally not included in the ZIP because it contains your private database password and JWT secret. Create it from `.env.example`.
- The `uploads` folder is created automatically when the server starts. Uploaded certificate/proof files from the source ZIP are not included in this clean project package.
- Localhost works only on this computer. For phone QR testing on the same Wi-Fi, set `PUBLIC_BASE_URL` to your computer's local IPv4 address and allow Node.js through Windows Firewall.
- For real deployment, use HTTPS, a strong JWT secret, a protected PostgreSQL server, and change demo passwords.
