# Vercel Environment Variables

Add these in Vercel: Project → Settings → Environment Variables.

Required:
- SECRET_KEY: long random string
- DEBUG: False
- DB_NAME
- DB_USER
- DB_PASSWORD
- DB_HOST
- DB_PORT
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Optional:
- ALLOWED_HOSTS: comma-separated domains (e.g. example.com,.vercel.app)

Notes:
- .env is only used for local development.
- After adding variables, redeploy the project.
