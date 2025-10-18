# How to Start Android Emulator Manually

## Option 1: Using Android Studio (Recommended)
1. Open **Android Studio**
2. Click **Tools** → **AVD Manager**
3. Find your emulator in the list
4. Click the **Play button** (▶️) to start it
5. Wait for the emulator to fully boot up
6. Then run: `npx react-native run-android`

## Option 2: Using Command Line (if PATH is set up)
```bash
# List available emulators
emulator -list-avds

# Start specific emulator (replace "Pixel_7_API_33" with your emulator name)
emulator -avd Pixel_7_API_33
```

## Option 3: Fix Emulator Display Issues
If the emulator shows blank screen:
1. In AVD Manager, click **pencil icon** to edit
2. Click **"Show Advanced Settings"**
3. Set **Graphics** to **"Hardware - GLES 2.0"**
4. Set **RAM** to **4096 MB**
5. Set **Multi-Core CPU** to **4 cores**
6. Click **Finish**
7. **Cold Boot** the emulator

## Option 4: Create New Emulator
1. In AVD Manager, click **"Create Virtual Device"**
2. Choose **Pixel 7** or **Pixel 6**
3. Select **API Level 33** or **34**
4. In Advanced Settings:
   - Graphics: **Hardware - GLES 2.0**
   - RAM: **4096 MB**
   - Multi-Core CPU: **4 cores**
5. Finish and start

## After Emulator is Running
Once the emulator is running and displaying properly, run:
```bash
npx react-native run-android
```

## Check Monitoring Dashboard
1. The app should show the **Spred** splash screen
2. Then navigate to the main app
3. You should see a **floating monitoring dashboard** on the right side
4. The monitoring server should show live metrics in the terminal

## Troubleshooting
- If still blank screen: Try **Software - GLES 2.0** graphics
- If app crashes: Check Metro bundler logs
- If monitoring doesn't work: Check if monitoring server is running on port 8080
