# COD Express API Test Script
# Run this script to test the API endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COD Express API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$token = $null

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "✅ Health Check: OK" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Environment: $($health.environment)" -ForegroundColor White
} catch {
    Write-Host "❌ Health Check Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Make sure the server is running: npm run dev" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Test 2: Register Merchant
Write-Host "2. Testing Merchant Registration..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "merchant@test.com"
        password = "password123"
        fullName = "Test Merchant"
        phone = "+923001234567"
        role = "merchant"
        businessName = "Test Business"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $token = $registerResponse.data.token
    Write-Host "✅ Merchant Registered" -ForegroundColor Green
    Write-Host "   Email: $($registerResponse.data.user.email)" -ForegroundColor White
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Merchant already exists, trying login..." -ForegroundColor Yellow
        
        # Try login instead
        $loginBody = @{
            email = "merchant@test.com"
            password = "password123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        $token = $loginResponse.data.token
        Write-Host "✅ Login Successful" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor White
    } else {
        Write-Host "❌ Registration Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Get Profile
if ($token) {
    Write-Host "3. Testing Get Profile..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $profile = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $headers
        Write-Host "✅ Profile Retrieved" -ForegroundColor Green
        Write-Host "   Name: $($profile.data.profile.fullName)" -ForegroundColor White
        Write-Host "   Role: $($profile.data.profile.role)" -ForegroundColor White
    } catch {
        Write-Host "❌ Get Profile Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Create Shipment
if ($token) {
    Write-Host "4. Testing Create Shipment..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $shipmentBody = @{
            recipientName = "John Doe"
            recipientPhone = "+923001234567"
            pickupAddress = "123 Main St, Karachi"
            deliveryAddress = "456 Park Ave, Karachi"
            packageWeight = 2.5
            codAmount = 5000
            paymentMethod = "wallet"
        } | ConvertTo-Json

        $shipment = Invoke-RestMethod -Uri "$baseUrl/shipments" -Method Post -Body $shipmentBody -ContentType "application/json" -Headers $headers
        Write-Host "✅ Shipment Created" -ForegroundColor Green
        Write-Host "   Tracking Number: $($shipment.data.shipment.trackingNumber)" -ForegroundColor White
        Write-Host "   Delivery Fee: PKR $($shipment.data.shipment.deliveryFee)" -ForegroundColor White
    } catch {
        Write-Host "❌ Create Shipment Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Get Shipments
if ($token) {
    Write-Host "5. Testing Get Shipments..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $shipments = Invoke-RestMethod -Uri "$baseUrl/shipments" -Method Get -Headers $headers
        Write-Host "✅ Shipments Retrieved" -ForegroundColor Green
        Write-Host "   Total: $($shipments.data.pagination.total)" -ForegroundColor White
        if ($shipments.data.shipments.Count -gt 0) {
            Write-Host "   First Shipment: $($shipments.data.shipments[0].trackingNumber)" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ Get Shipments Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 6: Get Wallet
if ($token) {
    Write-Host "6. Testing Get Wallet..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $wallet = Invoke-RestMethod -Uri "$baseUrl/wallet" -Method Get -Headers $headers
        Write-Host "✅ Wallet Retrieved" -ForegroundColor Green
        Write-Host "   Balance: PKR $($wallet.data.walletBalance)" -ForegroundColor White
        Write-Host "   Transactions: $($wallet.data.pagination.total)" -ForegroundColor White
    } catch {
        Write-Host "❌ Get Wallet Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test from Postman using the API_ENDPOINTS.md guide" -ForegroundColor White
Write-Host "2. Connect your mobile app using the base URL:" -ForegroundColor White
Write-Host "   http://localhost:3000/api/v1" -ForegroundColor Cyan
Write-Host "3. For physical device, use your computer's IP address" -ForegroundColor White
Write-Host ""

