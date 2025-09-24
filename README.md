# Leave Request System Frontend

## About This Project

This is a Next.js web application for managing employee leave requests. Employees can submit leave requests, track their status, and view their leave history. Administrators get tools to review and manage all requests across the organization.

Built with Next.js 15, TypeScript, and Tailwind CSS. The backend API is included in this repo (in the API folder), so you can run everything locally without external dependencies.

### What's included
- Employee dashboard for submitting and tracking leave requests
- Admin interface for reviewing and managing requests
- Responsive design that works on mobile and desktop
- JWT-based authentication
- Complete test suite with Jest and React Testing Library
- Mock API setup for development and testing

### Tech stack
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Jest + React Testing Library for testing
- MSW (Mock Service Worker) for API mocking
- ESLint and Prettier for code quality

This was built for our university Agile Software Development course.

## Backend API

The backend is included in the `DONT EDIT ANYTHING IN HERE (API)` folder. It's a Node.js/Express API with these main endpoints:

- `POST /login` - Authentication
- `GET /leave` - Get leave requests
- `POST /leave` - Create leave request
- `PUT /leave/:id` - Update leave request
- `DELETE /leave/:id` - Delete leave request

API documentation is in the Postman collection at `DONT EDIT ANYTHING IN HERE (API)/postman/Leave Management System.postman_collection.json`.

**Note To Self**: Don't edit anything in the API folder - it represents the production backend.

## Getting Started

### What you need

- Node.js 18+ ([download here](https://nodejs.org/))
- npm (comes with Node.js)
- Git

### Setup

1. Clone and install:
```bash
git clone <repository-url>
cd leave-request-system
npm install
```

2. Environment setup:

### Frontend configuration (.env.local)

Create `.env.local` in the project root with these variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000

# Development Settings
NEXT_PUBLIC_DEV_MODE=true
```

**Important notes:**
- The `NEXT_PUBLIC_` prefix makes variables available to the browser
- `API_BASE_URL` must match your backend server address
- `API_TIMEOUT` sets request timeout in milliseconds
- This file is git-ignored for security

### Backend configuration

The backend API configuration is already set up in `DONT EDIT ANYTHING IN HERE (API)/.env`. If you need to modify it:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=leave_management

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=info
```

**Security reminder:** Use a strong, unique JWT secret in production.

### Connecting to the backend API

The frontend automatically connects to the backend using the environment variables:

1. **API calls** use `NEXT_PUBLIC_API_BASE_URL` as the base URL
2. **Authentication** is handled via JWT tokens stored in browser storage
3. **CORS** is configured on the backend to allow frontend requests
4. **Error handling** includes timeout and network error management

If the connection fails, check:
- Backend is running on the correct port (default: 3000)
- Frontend `.env.local` has the correct API URL
- No firewall blocking the connection

3. Start the backend:
```bash
cd "DONT EDIT ANYTHING IN HERE (API)"
npm install
npm run dev
```

4. Start the frontend (in a new terminal):
```bash
npm run dev
```

The backend runs on http://localhost:3000 and the frontend on http://localhost:3001.

### Testing it works

Open http://localhost:3001 and try logging in with these test accounts:
- Admin: `john.smith@company.com` / `password123`
- Manager: `sarah.johnson@company.com` / `password123`
- Employee: `emma.davis@company.com` / `password123`

You can also test the API directly:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

If something's not working:

- **Can't connect to API**: Check both servers are running and your `.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`
- **Login fails**: Make sure the backend `.env` has a JWT_SECRET set
- **Database errors**: Check PostgreSQL is running and your database credentials are correct

For the full API docs, check the Postman collection in `DONT EDIT ANYTHING IN HERE (API)/postman/`.

## Project structure

```
leave-request-system/
├── .env.local                  # Frontend config (create this)
├── components/                 # React components
├── pages/                      # Next.js pages
├── styles/                     # CSS files
├── DONT EDIT ANYTHING IN HERE (API)/
│   ├── .env                   # Backend config (create this)
│   ├── src/                   # API source code
│   └── postman/               # API documentation
└── package.json               # Dependencies
```

## Testing

Run tests with:
```bash
npm test
```

## Development

Useful commands:
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code style
npm test             # Run tests
```

This project uses Next.js 15 with TypeScript and Tailwind CSS. The backend API is in the `DONT EDIT ANYTHING IN HERE (API)` folder - don't modify it.

## Contributing

### Git workflow

Use feature branches for all new work:
```bash
# Create a new feature branch
git checkout -b feature/LRS-123-short-description
```

### Commits

Include the Jira key in all commit messages:
```bash
git commit -m "[LRS-123] Add user authentication"
git commit -m "[LRS-456] Fix date picker validation"
```

This links your commits to Jira tickets for better tracking.
