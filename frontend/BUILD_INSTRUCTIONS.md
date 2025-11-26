# Ball House - iOS Build Instructions

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
   - Complete enrollment process (may take 24-48 hours)

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**
   ```bash
   eas login
   ```

---

## Configuration Files Created

### 1. `eas.json` - Build Profiles
- ✅ **development**: For testing with development client
- ✅ **preview**: For internal testing before App Store
- ✅ **production**: For App Store submission

### 2. `app.json` - Updated with:
- ✅ App name: "Ball House"
- ✅ Bundle ID: `com.ballhouse.app`
- ✅ Version: 1.0.0
- ✅ iOS permissions (Location, Camera, Photos)
- ✅ Privacy descriptions

---

## Build Steps

### Step 1: Configure Project
```bash
cd /app/frontend
eas build:configure
```

### Step 2: Update eas.json with Your Apple Details

Edit `eas.json` and replace:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",  // Your Apple ID email
      "ascAppId": "1234567890",                 // Get from App Store Connect
      "appleTeamId": "ABCDE12345"               // Get from Apple Developer Portal
    }
  }
}
```

**Where to find these:**
- **Apple ID**: Your developer account email
- **ASC App ID**: App Store Connect → Your App → App Information → Apple ID
- **Team ID**: developer.apple.com → Account → Membership

---

## Build Commands

### Development Build (Test on Device)
```bash
eas build --profile development --platform ios
```
**Use when**: Testing features that don't work in Expo Go

### Preview Build (Internal Testing)
```bash
eas build --profile preview --platform ios
```
**Use when**: Ready for team/friends to test

### Production Build (App Store)
```bash
eas build --profile production --platform ios
```
**Use when**: Ready to submit to App Store

---

## TestFlight Beta Testing

### 1. Create Production Build
```bash
eas build --profile production --platform ios
```

### 2. Submit to TestFlight
```bash
eas submit --platform ios
```

Or manually:
1. Download .ipa file from EAS build page
2. Upload to App Store Connect via Transporter app
3. Add beta testers in TestFlight section

### 3. Invite Testers
- Go to App Store Connect → TestFlight
- Add internal testers (up to 100)
- Add external testers (up to 10,000 with Apple review)

---

## App Store Submission

### 1. Prepare Assets

**Required App Icons** (create from Ball House logo):
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 120x120 (iPhone)
- 167x167 (iPad Pro)
- 152x152 (iPad)

**Screenshots Required**:
- 6.5" iPhone (1284 x 2778) - at least 3
- 5.5" iPhone (1242 x 2208) - at least 3

**Screenshot Ideas**:
1. Courts map with player counts
2. Court details with directions
3. Media feed with videos
4. Profile with network
5. Networking connections

### 2. App Store Connect Setup

1. Go to: https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Name**: Ball House
   - **Bundle ID**: com.ballhouse.app
   - **SKU**: ballhouse-001
   - **Primary Language**: English (U.S.)

### 3. App Information

**Category**: Sports
**Age Rating**: 4+

**App Description**:
```
Ball House connects basketball players to courts and each other in Houston.

FIND COURTS
• 20+ basketball courts across Houston
• Real-time player counts
• Color-coded activity levels (Light, Moderate, Busy)
• Interactive map view
• Get directions to any court

CONNECT WITH PLAYERS
• Automatic check-in when near courts
• Network with other players
• Message court-goers
• See recent players at courts

STAY UPDATED
• Watch NBA highlights
• Follow college basketball
• Share videos with friends
• Like and discover trending content

Whether you're looking for pickup games or want to see where the action is, Ball House makes it easy to find your game.
```

**Keywords**: 
```
basketball, courts, pickup games, Houston, sports, players, maps, hoops, streetball, recreation
```

**Support URL**: https://yourwebsite.com/support
**Marketing URL**: https://yourwebsite.com

### 4. Privacy Policy (Required)

Create at: https://privacypolicygenerator.info

Must include:
- Location data usage
- User account data
- Profile pictures
- Messages
- YouTube video integration

Upload to your website and provide URL.

### 5. Build & Submit

```bash
# Final production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### 6. Submit for Review

1. Complete all App Store Connect fields
2. Upload screenshots
3. Set price to FREE
4. Choose availability regions
5. Click "Submit for Review"

**Review Timeline**: Usually 24-48 hours

---

## Important Configuration Notes

### Update Before Building:

1. **Bundle Identifier** (if different):
   - Edit `app.json` → `ios.bundleIdentifier`
   - Must match your App Store Connect app

2. **Google Maps API Key**:
   - Get key from: console.cloud.google.com
   - Enable Maps SDK for iOS
   - Update `app.json` → `ios.config.googleMapsApiKey`

3. **Version Updates**:
   ```json
   "version": "1.0.0",          // Increment for each release
   "ios": {
     "buildNumber": "1"         // Auto-increments in production builds
   }
   ```

---

## Build Process Flow

```
Development Testing (Expo Go)
    ↓
Development Build (eas build --profile development)
    ↓
Preview Build (eas build --profile preview)
    ↓
Internal Testing (share .ipa with team)
    ↓
Production Build (eas build --profile production)
    ↓
TestFlight Beta (eas submit → invite testers)
    ↓
App Store Submission (complete metadata → submit)
    ↓
Apple Review (24-48 hours)
    ↓
App Store Live! 🎉
```

---

## Troubleshooting

### "Bundle Identifier Already Exists"
- Create a unique bundle ID in app.json
- Format: `com.yourcompany.ballhouse`

### "Missing Push Notification Capability"
- Add in `app.json`:
  ```json
  "ios": {
    "usesApnsEntitlement": false
  }
  ```

### "Build Failed"
- Check EAS build logs
- Ensure all dependencies are installed
- Verify app.json syntax

### "Invalid Binary"
- Increment buildNumber in app.json
- Rebuild and resubmit

---

## Next Steps After Configuration

1. **Right Now**:
   ```bash
   eas build --profile preview --platform ios
   ```

2. **Test the Build**:
   - Install on your iPhone
   - Test all features
   - Fix any bugs

3. **Create App Store Assets**:
   - App icon (1024x1024)
   - Screenshots (at least 3)
   - Write app description

4. **Submit to TestFlight**:
   ```bash
   eas build --profile production --platform ios
   eas submit --platform ios
   ```

5. **Invite Beta Testers**:
   - Get feedback
   - Fix issues
   - Iterate

6. **Final Submission**:
   - Complete App Store Connect
   - Submit for review
   - Monitor status

---

## Support Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Expo Discord**: https://chat.expo.dev/

---

## Your Ball House App is Ready! 🏀

All configuration files are set up. You're ready to build!

Start with:
```bash
cd /app/frontend
eas build --profile preview --platform ios
```

Good luck with your App Store launch! 🚀
