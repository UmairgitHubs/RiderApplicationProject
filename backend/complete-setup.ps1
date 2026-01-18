# COD Express - Complete Database Setup
# This script creates the database and configures everything

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COD Express - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get PostgreSQL password
Write-Host "Step 1: Database Configuration" -ForegroundColor Green
Write-Host ""

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

$dbHost = "localhost"
$dbPort = "5432"

Write-Host ""
Write-Host "Step 2: Creating database..." -ForegroundColor Green

# Create database using psql
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = $dbPasswordPlain

$createDbQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
$dbExists = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -tAc $createDbQuery 2>&1

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
        exit 1
    }
}

# Step 3: Create .env file
Write-Host ""
Write-Host "Step 3: Creating .env file..." -ForegroundColor Green

# Generate JWT secrets
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$refreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# URL encode password for DATABASE_URL (simple encoding for special chars)
$encodedPassword = $dbPasswordPlain -replace ':', '%3A' -replace '@', '%40' -replace '/', '%2F' -replace '\?', '%3F' -replace '#', '%23' -replace '\[', '%5B' -replace '\]', '%5D' -replace ' ', '%20'

$envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:19006

# Database
DATABASE_URL=postgresql://$dbUser`:$encodedPassword@$dbHost`:$dbPort/$dbName`?schema=public

# JWT Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=$refreshSecret

# Payment Gateways (Add later)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Firebase (For Push Notifications - Add later)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Email (Add later)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@codexpress.com

# SMS (Add later - Twilio or local gateway)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (For file uploads - Add later)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=codexpress-uploads
AWS_REGION=us-east-1

# Google Maps API (For distance calculation - Add later)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
"@

if (Test-Path .env) {
    $overwrite = Read-Host ".env file exists. Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Keeping existing .env file." -ForegroundColor Yellow
    } else {
        $envContent | Out-File -FilePath .env -Encoding utf8
        Write-Host "✅ .env file updated!" -ForegroundColor Green
    }
} else {
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD

# Step 4: Install dependencies (if needed)
Write-Host ""
Write-Host "Step 4: Checking dependencies..." -ForegroundColor Green

if (-not (Test-Path node_modules)) {
    Write-Host "Installing npm packages..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error installing packages!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed!" -ForegroundColor Green
}

# Step 5: Generate Prisma Client
Write-Host ""
Write-Host "Step 5: Generating Prisma Client..." -ForegroundColor Green
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generating Prisma Client!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated!" -ForegroundColor Green

# Step 6: Run migrations
Write-Host ""
Write-Host "Step 6: Running database migrations..." -ForegroundColor Green
Write-Host "When prompted for migration name, type: init" -ForegroundColor Yellow
Write-Host ""

npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error running migrations!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the server: npm run dev" -ForegroundColor White
Write-Host "2. Open Prisma Studio: npm run prisma:studio" -ForegroundColor White
Write-Host "3. Test API: curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""

