# Ball House - EAS Build & App Store Submission Guide

## Prerequisites

Before building, ensure you have:

1. **EAS CLI installed globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Expo account created and logged in:**
   ```bash
   eas login
   ```

3. **Apple Developer Account:**
   - Active Apple Developer Program membership ($99/year)
   - Apple ID: choona.tech@gmail.com
   - Team ID: 9DVMM7U798
   - App Store Connect App ID: 6755755781

4. **Xcode installed** (for iOS builds on Mac)

## Configuration Files

### ✅ app.json
Already configured with:
- Bundle identifier: `com.ballhouse.app`
- App name: "Ball House"
- Version: 1.0.0
- Build number: 1
- All necessary permissions (location, camera, photo library)
- Background location enabled

### ✅ eas.json
Already configured with:
- Project directory: `frontend` (for monorepo structure)
- Apple credentials (Team ID, ASC App ID)
- Build profiles: development, preview, production

## Build Commands

### 1. Development Build (for testing on device/simulator)
```bash
cd /app/frontend
eas build --profile development --platform ios
```

This creates a development client you can install on your device for testing.

### 2. Preview Build (internal distribution via TestFlight)
```bash
cd /app/frontend
eas build --profile preview --platform ios
```

This creates an Ad Hoc build for internal testing.

### 3. Production Build (App Store submission)
```bash
cd /app/frontend
eas build --profile production --platform ios
```

This creates a production-ready build with:
- Automatic build number increment
- Release configuration
- Optimizations enabled

## Submission to App Store

### Option 1: Automatic Submission (Recommended)
```bash
cd /app/frontend
eas submit --platform ios --latest
```

This will:
1. Use the latest production build
2. Automatically upload to App Store Connect
3. Submit for review

### Option 2: Manual Submission
1. Download the `.ipa` file from EAS build dashboard
2. Open Xcode
3. Go to Window → Organizer
4. Drag the `.ipa` file into Organizer
5. Click "Distribute App"
6. Follow the wizard to submit to App Store Connect

## Pre-Submission Checklist

### App Store Connect Setup

1. **Log in to App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Use Apple ID: choona.tech@gmail.com

2. **Create App Store Listing (if not already done):**
   - App Name: Ball House
   - Bundle ID: com.ballhouse.app
   - SKU: ball-house-1
   - Primary Language: English (U.S.)

3. **Prepare App Store Assets:**
   - App icon (1024x1024 px)
   - Screenshots (iPhone 6.5", 6.7" displays - at least 3)
   - App description (up to 4000 characters)
   - Keywords (up to 100 characters)
   - Support URL
   - Privacy Policy URL

4. **App Store Information:**
   ```
   Category: Social Networking or Health & Fitness
   Content Rights: (Your info)
   Age Rating: 4+ (suitable for all ages)
   ```

### Required Screenshots Sizes (iOS)
- **6.7" Display (iPhone 14 Pro Max, 15 Pro Max):** 1290 x 2796 px
- **6.5" Display (iPhone 11 Pro Max, XS Max):** 1242 x 2688 px

Minimum 3 screenshots, maximum 10.

### App Privacy Information
You'll need to declare:
- **Location:** Used for showing nearby courts and automatic check-ins
- **User Data Collected:** Username, email, profile picture
- **Third-Party Services:** YouTube API (for video content)

## Build Process Timeline

1. **Build Creation:** 10-20 minutes (EAS cloud build)
2. **App Store Processing:** 1-2 hours (after submission)
3. **Review Process:** 24-48 hours (average)
4. **If Approved:** App goes live immediately or scheduled release

## Common Issues & Solutions

### Issue 1: Provisioning Profile Errors
```bash
eas credentials -p ios
```
Use this to manage certificates and provisioning profiles.

### Issue 2: Build Fails Due to Dependencies
```bash
cd /app/frontend
yarn install
eas build --clear-cache --profile production --platform ios
```

### Issue 3: Background Location Permission Rejection
If Apple rejects due to background location:
- Ensure your App Store description clearly explains automatic check-in feature
- Provide a demo video showing the feature in action
- Emphasize user privacy and control (toggle in settings)

### Issue 4: Missing Permissions Descriptions
All permission descriptions are already in `app.json`:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`

## Testing Before Submission

### 1. Test via Expo Go (Quick test)
```bash
cd /app/frontend
yarn start
```
Scan QR code with Expo Go app.
**Note:** Background location won't work in Expo Go.

### 2. Test via Development Build (Full feature test)
```bash
eas build --profile development --platform ios
# Install on device via URL provided
```
This allows testing background location and all native features.

### 3. Test via TestFlight (Beta testing)
```bash
eas build --profile preview --platform ios
eas submit --platform ios --latest
```
Invite beta testers via App Store Connect.

## Post-Submission

After submission:
1. Monitor App Store Connect for review updates
2. Respond to any review messages within 24 hours
3. If rejected, address issues and resubmit

## Version Updates

For future updates:
1. Increment version in `app.json`:
   ```json
   "version": "1.0.1"
   ```
2. Build number auto-increments (configured in eas.json)
3. Run production build and submit

## Android Build (Future)

When ready for Android:
```bash
eas build --profile production --platform android
eas submit --platform android --latest
```

Android submission to Google Play Store is typically faster (1-2 hours review).

## Support Resources

- **EAS Build Documentation:** https://docs.expo.dev/build/introduction/
- **EAS Submit Documentation:** https://docs.expo.dev/submit/introduction/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **TestFlight:** https://developer.apple.com/testflight/

## Environment Variables for Production

Ensure these are set in EAS secrets (not in code):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-production-api.com"
eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_API_KEY --value "your_key"
eas secret:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value "your_key"
```

---

## Quick Reference Commands

```bash
# Login to EAS
eas login

# Build for production
cd /app/frontend && eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios --latest

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Manage credentials
eas credentials -p ios
```

---

**Note:** All Apple credentials are already configured in `eas.json`. The build process should be straightforward once you have an active Apple Developer account.
