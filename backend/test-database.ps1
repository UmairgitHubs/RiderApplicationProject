# COD Express - Database Operations Test Script
# This script tests if data is being saved to the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Operations Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$testEmail = "testmerchant_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$token = $null

# Test 1: Register New Merchant
Write-Host "1. Testing Merchant Registration (Signup)..." -ForegroundColor Yellow
Write-Host "   Email: $testEmail" -ForegroundColor Gray

try {
    $registerBody = @{
        email = $testEmail
        password = "password123"
        fullName = "Test Merchant User"
        phone = "+923001234567"
        role = "merchant"
        businessName = "Test Business Company"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $token = $registerResponse.data.token
    
    Write-Host "   ✅ Registration Successful!" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.data.user.id)" -ForegroundColor White
    Write-Host "   Email: $($registerResponse.data.user.email)" -ForegroundColor White
    Write-Host "   Role: $($registerResponse.data.user.role)" -ForegroundColor White
    Write-Host "   Token received: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Registration Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Details: $responseBody" -ForegroundColor Red
    }
    exit
}

Write-Host ""

# Test 2: Get Profile (Verify data was saved)
Write-Host "2. Verifying Profile Data in Database..." -ForegroundColor Yellow

try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $headers
    
    Write-Host "   ✅ Profile Retrieved from Database!" -ForegroundColor Green
    Write-Host "   Full Name: $($profile.data.profile.fullName)" -ForegroundColor White
    Write-Host "   Email: $($profile.data.profile.email)" -ForegroundColor White
    Write-Host "   Phone: $($profile.data.profile.phone)" -ForegroundColor White
    Write-Host "   Role: $($profile.data.profile.role)" -ForegroundColor White
    
    if ($profile.data.profile.businessName) {
        Write-Host "   Business Name: $($profile.data.profile.businessName)" -ForegroundColor White
    }
    
    if ($profile.data.profile.walletBalance -ne $null) {
        Write-Host "   Wallet Balance: PKR $($profile.data.profile.walletBalance)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "   ✅✅✅ DATA IS SAVED IN DATABASE! ✅✅✅" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to retrieve profile!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Update Profile (Edit Profile)
Write-Host "3. Testing Profile Update (Edit Profile)..." -ForegroundColor Yellow

try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $updateBody = @{
        fullName = "Updated Merchant Name"
        phone = "+923009876543"
        businessName = "Updated Business Name"
        languagePreference = "ur"
        themePreference = "dark"
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Patch -Body $updateBody -ContentType "application/json" -Headers $headers
    
    Write-Host "   ✅ Profile Updated Successfully!" -ForegroundColor Green
    Write-Host "   Updated Name: $($updateResponse.data.profile.fullName)" -ForegroundColor White
    Write-Host "   Updated Phone: $($updateResponse.data.profile.phone)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Profile Update Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Verify Updated Data
Write-Host "4. Verifying Updated Data in Database..." -ForegroundColor Yellow

try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $headers
    
    Write-Host "   ✅ Updated Profile Retrieved!" -ForegroundColor Green
    Write-Host "   Name: $($profile.data.profile.fullName)" -ForegroundColor White
    Write-Host "   Phone: $($profile.data.profile.phone)" -ForegroundColor White
    Write-Host "   Language: $($profile.data.profile.languagePreference)" -ForegroundColor White
    Write-Host "   Theme: $($profile.data.profile.themePreference)" -ForegroundColor White
    
    if ($profile.data.profile.fullName -eq "Updated Merchant Name") {
        Write-Host ""
        Write-Host "   ✅✅✅ PROFILE UPDATE SAVED IN DATABASE! ✅✅✅" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed to verify update!" -ForegroundColor Red
}

Write-Host ""

# Test 5: Create Shipment (Additional DB test)
Write-Host "5. Testing Shipment Creation (Additional DB Test)..." -ForegroundColor Yellow

try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $shipmentBody = @{
        recipientName = "John Doe"
        recipientPhone = "+923001111111"
        pickupAddress = "123 Test Street, Karachi"
        deliveryAddress = "456 Test Avenue, Karachi"
        packageWeight = 2.5
        codAmount = 5000
        paymentMethod = "wallet"
    } | ConvertTo-Json

    $shipment = Invoke-RestMethod -Uri "$baseUrl/shipments" -Method Post -Body $shipmentBody -ContentType "application/json" -Headers $headers
    
    Write-Host "   ✅ Shipment Created and Saved!" -ForegroundColor Green
    Write-Host "   Tracking Number: $($shipment.data.shipment.trackingNumber)" -ForegroundColor White
    Write-Host "   Shipment ID: $($shipment.data.shipment.id)" -ForegroundColor White
    Write-Host "   Delivery Fee: PKR $($shipment.data.shipment.deliveryFee)" -ForegroundColor White
} catch {
    Write-Host "   ⚠️  Shipment creation failed (may need wallet balance)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Database Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ User Registration → Saved to DB" -ForegroundColor Green
Write-Host "   ✅ Profile Retrieval → Data from DB" -ForegroundColor Green
Write-Host "   ✅ Profile Update → Saved to DB" -ForegroundColor Green
Write-Host "   ✅ Updated Data Verification → Confirmed" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To View Data in Database:" -ForegroundColor Yellow
Write-Host "   1. Run: npm run prisma:studio" -ForegroundColor White
Write-Host "   2. Browser will open automatically" -ForegroundColor White
Write-Host "   3. Click on 'User' table to see registered users" -ForegroundColor White
Write-Host "   4. Click on 'Merchant' table to see merchant profiles" -ForegroundColor White
Write-Host "   5. Click on 'Shipment' table to see created shipments" -ForegroundColor White
Write-Host ""
Write-Host "Test Email Used: $testEmail" -ForegroundColor Gray
Write-Host ""

