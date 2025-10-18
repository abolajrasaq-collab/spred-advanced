@echo off
echo.
echo ================================================
echo        Creating SPRED Release Keystore
echo ================================================
echo.

REM Change to the app directory
cd /d "E:\AI\VERSIONS\Spredbolarv1\spred-android1\android\app"

echo Creating release keystore for SPRED application...
echo.

REM Generate the release keystore
keytool -genkey -v -keystore release.keystore -alias spredReleaseKey -keyalg RSA -keysize 2048 -validity 10000 -storepass SpredRelease2024! -keypass SpredRelease2024! -dname "CN=Spred, OU=Development, O=SPRED, L=Lagos, ST=Lagos, C=NG" -noprompt

echo.
echo ================================================
echo    Release Keystore Created Successfully
echo ================================================
echo.

echo The release keystore has been created in the android\app directory.
echo Your app can now be built in release mode.
echo.
echo Keystore credentials:
echo - Keystore file: release.keystore
echo - Keystore password: SpredRelease2024!
echo - Key alias: spredReleaseKey
echo - Key password: SpredRelease2024!
echo.

pause