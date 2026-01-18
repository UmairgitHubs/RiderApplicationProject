# PowerShell script to set up environment variables for mobile app development
# Run this script as Administrator

$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "Setting up environment variables..." -ForegroundColor Green

# Set JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, [System.EnvironmentVariableTarget]::Machine)
Write-Host "JAVA_HOME set to: $javaHome" -ForegroundColor Green

# Add Java to PATH if not already there
$target = [System.EnvironmentVariableTarget]::Machine
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", $target)
$javaBin = "$javaHome\bin"

if ($currentPath -notlike "*$javaBin*") {
    $newPath = $currentPath + ";" + $javaBin
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, $target)
    Write-Host "Added Java to PATH" -ForegroundColor Green
} else {
    Write-Host "Java already in PATH" -ForegroundColor Yellow
}

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, $target)
Write-Host "ANDROID_HOME set to: $androidSdkPath" -ForegroundColor Green

# Add Android SDK tools to PATH
$androidPlatformTools = "$androidSdkPath\platform-tools"
$androidTools = "$androidSdkPath\tools"
$androidToolsBin = "$androidSdkPath\tools\bin"

# Refresh current path logic to ensure we append cumulatively if needed
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", $target)

if ($currentPath -notlike "*$androidPlatformTools*") {
    $newPath = $currentPath + ";" + $androidPlatformTools
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, $target)
    Write-Host "Added Android platform-tools to PATH" -ForegroundColor Green
    # Update local variable for next check
    $currentPath = $newPath
}

if ($currentPath -notlike "*$androidToolsBin*") {
    $newPath = $currentPath + ";" + $androidToolsBin
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, $target)
    Write-Host "Added Android tools to PATH" -ForegroundColor Green
}

Write-Host "`r`nEnvironment variables set successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
