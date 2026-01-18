# Database Setup Script for RiderApp
# This script helps you set up PostgreSQL database and run migrations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RiderApp - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check PostgreSQL connection
Write-Host "Step 1: Checking PostgreSQL connection..." -ForegroundColor Green

$dbUser = Read-Host "PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Database name (default: codexpress)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "codexpress"
}

$dbHost = Read-Host "Database host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "Database port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5432"
}

Write-Host ""
Write-Host "Step 2: Finding PostgreSQL installation..." -ForegroundColor Green

# Try to find PostgreSQL installation
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "✅ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    # Try to find psql in PATH
    $psqlInPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlInPath) {
        $psqlPath = $psqlInPath.Source
        Write-Host "✅ Found PostgreSQL in PATH: $psqlPath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL psql not found in common locations." -ForegroundColor Yellow
        Write-Host "   Please create the database manually using pgAdmin." -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue with .env file creation anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

# Step 3: Create Database (if psql is available)
if ($psqlPath) {
    Write-Host ""
    Write-Host "Step 3: Creating database '$dbName'..." -ForegroundColor Green
    
    $env:PGPASSWORD = $dbPasswordPlain
    
    # Check if database exists
    $checkDbQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
    $dbExists = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -tAc $checkDbQuery 2>&1
    
    if ($dbExists -eq "1") {
        Write-Host "✅ Database '$dbName' already exists!" -ForegroundColor Yellow
    } else {
        Write-Host "Creating database '$dbName'..." -ForegroundColor White
        $createResult = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database '$dbName' created successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Error creating database:" -ForegroundColor Red
            Write-Host $createResult -ForegroundColor Red
            Write-Host ""
            Write-Host "Please create the database manually using:" -ForegroundColor Yellow
            Write-Host "  CREATE DATABASE $dbName;" -ForegroundColor White
        }
    }
    
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD
} else {
    Write-Host ""
    Write-Host "Step 3: Skipping database creation (psql not found)" -ForegroundColor Yellow
    Write-Host "   Please create the database manually:" -ForegroundColor Yellow
    Write-Host "   CREATE DATABASE $dbName;" -ForegroundColor White
}

# Step 4: Create/Update .env file
Write-Host ""
Write-Host "Step 4: Creating/Updating .env file..." -ForegroundColor Green

# Generate secure JWT secrets if not exists
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$refreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# URL encode password for DATABASE_URL
# Simple encoding for common special characters
$encodedPassword = $dbPasswordPlain -replace ':', '%3A' -replace '@', '%40' -replace '/', '%2F' -replace '\?', '%3F' -replace '#', '%23' -replace '\[', '%5B' -replace '\]', '%5D' -replace ' ', '%20' -replace '&', '%26' -replace '=', '%3D'

$envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:19006

# Database
DATABASE_URL=postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}?schema=public

# JWT Authentication
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=${refreshSecret}

# Payment Gateways (Optional - Add later)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Firebase (Optional - For Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Email (Optional - Add later)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@codexpress.com

# SMS (Optional - Twilio or local gateway)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (Optional - For file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=codexpress-uploads
AWS_REGION=us-east-1

# Google Maps API (Optional - For distance calculation)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
"@

if (Test-Path .env) {
    $overwrite = Read-Host ".env file exists. Overwrite? (y/n)"
    if ($overwrite -eq "y") {
        $envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
        Write-Host "✅ .env file updated!" -ForegroundColor Green
    } else {
        Write-Host "Keeping existing .env file." -ForegroundColor Yellow
        Write-Host "⚠️  Make sure DATABASE_URL is correct in .env file!" -ForegroundColor Yellow
    }
} else {
    $envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
    Write-Host "✅ .env file created!" -ForegroundColor Green
}

# Step 5: Generate Prisma Client
Write-Host ""
Write-Host "Step 5: Generating Prisma Client..." -ForegroundColor Green
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generating Prisma Client!" -ForegroundColor Red
    Write-Host "   Make sure your DATABASE_URL in .env is correct." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Prisma Client generated!" -ForegroundColor Green

# Step 6: Run migrations
Write-Host ""
Write-Host "Step 6: Running database migrations..." -ForegroundColor Green
Write-Host "   This will create all database tables..." -ForegroundColor White
Write-Host ""

# Try to apply existing migrations
Write-Host "Applying migrations..." -ForegroundColor White
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error running migrations!" -ForegroundColor Red
    Write-Host "   Please check your database connection and try again." -ForegroundColor Yellow
    Write-Host "   Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Database '$dbName' exists" -ForegroundColor White
    Write-Host "   2. DATABASE_URL in .env is correct" -ForegroundColor White
    Write-Host "   3. PostgreSQL service is running" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. View your database: npm run prisma:studio" -ForegroundColor White
Write-Host "2. Start the server: npm run dev" -ForegroundColor White
Write-Host "3. Test API: curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""
