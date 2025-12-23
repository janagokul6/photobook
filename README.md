# Photo Selection Platform

A web platform where visitors can browse and select photos from multiple media sources (Google Photos, Google Drive, Gumlet, Filestack), and admins can view submissions and download selected photos.

## Features

### Visitor Features
- Browse photos from multiple sources (Google Photos, Google Drive, Gumlet, Filestack) in an infinite scroll gallery
- Select multiple photos with checkboxes
- Select all / Deselect all functionality
- Submit selections without login
- Thank you confirmation page

### Admin Features
- Password-based login or Google OAuth login
- View all submissions with filtering (by date, submission ID)
- View selected photos for each submission
- Download individual photos or all photos as ZIP
- Automatic Google Photos OAuth token refresh

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **MongoDB** with Mongoose for data storage
- **NextAuth.js** for authentication
- **Google Photos API** for photo fetching
- **Google Drive API** for folder-based photo browsing
- **Gumlet API** for DAM (Digital Asset Management) integration
- **Filestack API** for file storage and management
- **Tailwind CSS** for styling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_SECRET` - Secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
  - **Important:** NextAuth automatically uses `{NEXTAUTH_URL}/api/auth/callback/google` as the redirect URI
- `ADMIN_USERNAME` - Admin username for password login
- `ADMIN_PASSWORD` - Admin password for password login

Optional environment variables for additional integrations:

- `GUMLET_API_KEY` - Gumlet API key (for Gumlet integration)
- `GUMLET_BASE_URL` - Gumlet API base URL (default: `https://api.gumlet.com`)
- `FILESTACK_API_KEY` - Filestack API key (for Filestack integration)
- `FILESTACK_BASE_URL` - Filestack API base URL (default: `https://www.filestackapi.com/api`)

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Photos Library API**
4. Go to **APIs & Services > Credentials**
5. Create OAuth 2.0 Client ID credentials
6. **Add authorized redirect URI:** `http://localhost:3000/api/auth/callback/google`
   - This must match exactly: `{NEXTAUTH_URL}/api/auth/callback/google`
   - For production, add: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to `.env.local`

**⚠️ Important:** If you get a "redirect_uri_mismatch" error, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed instructions.

### 4. MongoDB Setup

Set up a MongoDB database (local or cloud like MongoDB Atlas) and add the connection string to `MONGODB_URI`.

### 5. Gumlet Setup (Optional)

1. Sign up for a [Gumlet account](https://www.gumlet.com/)
2. Get your API key from the Gumlet dashboard
3. Add `GUMLET_API_KEY` to `.env.local`
4. Optionally set `GUMLET_BASE_URL` if using a custom endpoint

### 6. Filestack Setup (Optional)

1. Sign up for a [Filestack account](https://www.filestack.com/)
2. Get your API key from the Filestack dashboard
3. Add `FILESTACK_API_KEY` to `.env.local`
4. Optionally set `FILESTACK_BASE_URL` if using a custom endpoint

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First-Time Admin Setup

1. Navigate to `/admin/login`
2. Sign in with Google OAuth (this will store the refresh token for Google Photos API)
3. Alternatively, use the password login with credentials from `.env.local`

**Important:** The first Google OAuth login is required to store the refresh token that allows the backend to access Google Photos programmatically.

## Project Structure

```
photobook/
├── app/
│   ├── (visitor)/          # Public visitor pages
│   │   ├── page.tsx        # Google Photos gallery page
│   │   ├── google-drive/   # Google Drive gallery pages
│   │   ├── gumlet/         # Gumlet gallery pages
│   │   ├── filestack/      # Filestack gallery pages
│   │   └── thank-you/      # Thank you page
│   ├── (admin)/            # Admin pages (protected)
│   │   ├── login/          # Admin login
│   │   ├── dashboard/      # Submissions list
│   │   └── submission/     # Submission details
│   └── api/                # API routes
│       ├── google-drive/   # Google Drive API routes
│       ├── gumlet/         # Gumlet API routes
│       └── filestack/      # Filestack API routes
├── components/
│   ├── visitor/            # Visitor UI components
│   └── admin/              # Admin UI components
├── lib/
│   ├── models/             # Mongoose models
│   ├── google-photos.ts    # Google Photos API client
│   ├── google-drive.ts     # Google Drive API client
│   ├── gumlet.ts           # Gumlet API client
│   ├── filestack.ts        # Filestack API client
│   ├── auth.ts             # NextAuth configuration
│   └── db.ts               # MongoDB connection
└── types/                  # TypeScript types
```

## API Endpoints

### Public Endpoints

- `GET /api/photos?pageToken=&pageSize=` - Get paginated Google Photos
- `GET /api/google-drive/photos?folderId=&pageToken=&pageSize=` - Get paginated Google Drive photos (folderId required)
- `GET /api/gumlet/photos?folderId=&pageToken=&pageSize=` - Get paginated Gumlet photos (folderId optional)
- `GET /api/filestack/photos?folderId=&pageToken=&pageSize=` - Get paginated Filestack photos (folderId optional)
- `POST /api/selection/submit` - Submit photo selection

### Admin Endpoints (Protected)

- `GET /api/admin/submissions?dateFrom=&dateTo=&submissionId=` - Get submissions
- `GET /api/admin/download?photoIds=...` or `?submissionId=...` - Download photos
- `GET /api/admin/photos?photoIds=...` - Get photo thumbnails

## Security Features

- Admin routes protected with NextAuth middleware
- Thumbnail URLs proxied to prevent direct Google URL exposure
- Download prevention in visitor UI (right-click disabled, drag disabled)
- OAuth tokens stored securely in database
- Automatic token refresh handled in backend

## Integrated Media Services

The platform supports multiple media sources:

- **Google Photos** - OAuth-based integration for accessing Google Photos library
- **Google Drive** - Folder-based photo browsing from Google Drive
- **Gumlet** - DAM (Digital Asset Management) integration with API key authentication
  - Storage: 10 GB / 30 GB tiers
  - Features: Good DAM, supports bulk/batch upload
  - Access: Library-wide or folder-based browsing
- **Filestack** - File storage and management with API key authentication
  - Storage: 5 GB tier
  - Features: Excellent uploader, supports batch processing
  - Access: Library-wide or folder-based browsing

**Note:** Gumlet and Filestack integrations require API keys. The actual API endpoints and response formats may need adjustment based on the official documentation of these services.

## License

MIT
