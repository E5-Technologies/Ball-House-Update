# 🚀 Ball House - Build Commands & Testing Guide

## ✅ Pre-Build Validation Complete

**Configuration Status:**
- ✅ app.json validated
- ✅ eas.json validated  
- ✅ All API keys configured
- ✅ Apple Developer details integrated
- ✅ Package.json ready

---

## 📋 STEP-BY-STEP BUILD PROCESS

### Prerequisites Checklist
- [ ] Have Expo account (sign up at expo.dev)
- [ ] Have Apple Developer account
- [ ] Have Node.js installed
- [ ] Have a Mac (for local iOS builds) OR use EAS cloud builds

---

## 🔨 BUILD COMMANDS (Copy & Paste)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Navigate to Frontend Directory
```bash
cd /app/frontend
```

### Step 3: Login to Expo
```bash
eas login
```
**Enter your Expo account credentials when prompted**

### Step 4: Link Project (First Time Only)
```bash
eas build:configure
```
**This creates project on Expo servers**

### Step 5: Create Preview Build for iPhone Testing
```bash
eas build --platform ios --profile preview
```

**What happens:**
- ⏱️ Build takes 15-20 minutes
- 📦 Generates IPA file
- 🔗 Provides download link
- 💾 Saved to your Expo account

**After build completes, you'll get:**
```
✔ Build successful!
Download: https://expo.dev/artifacts/[build-id]
```

### Step 6: Download & Install on iPhone

**Option A: Via TestFlight (Recommended)**
1. Download IPA from EAS build page
2. Go to https://appstoreconnect.apple.com
3. Sign in with choona.tech@gmail.com
4. Navigate to TestFlight → iOS Builds
5. Upload IPA file
6. Install TestFlight app on iPhone
7. Open link to install Ball House

**Option B: Direct Install (For Testing)**
1. Download IPA file
2. Use Apple Configurator 2 or Xcode
3. Install directly to connected iPhone

---

## 🧪 TESTING CHECKLIST FOR YOUR IPHONE

### Initial Launch
- [ ] App launches without crashing
- [ ] Splash screen shows Ball House logo
- [ ] Login screen displays correctly

### Authentication
- [ ] Can create new account
- [ ] Can login with existing account
- [ ] Profile loads after login

### Find Courts Tab (CRITICAL - Map Functionality)
- [ ] **Map view displays (not list view)**
- [ ] **Your current location shows blue dot**
- [ ] **Court markers appear on map**
- [ ] **Heat map colors work:**
  - Gray for empty courts (0 players)
  - Yellow for moderate (1-10 players)  
  - Red for busy (11+ players)
- [ ] **"RECOMMENDED COURT" badge appears on top court**
- [ ] Tapping court marker shows details
- [ ] Can navigate to court details

### Court Details
- [ ] Shows two activity metrics:
  - "0 Ball House Members" (left)
  - "18 Average Players" (right)
- [ ] Address displays correctly
- [ ] Hours display correctly
- [ ] Rating shows stars

### Media Tab
- [ ] Videos load in grid view
- [ ] Can tap to play videos
- [ ] Like button works (heart fills)
- [ ] **Share button appears next to like**
- [ ] **Tapping share shows user list**
- [ ] Can share video to another user

### Profile Tab
- [ ] Shows Network count (0)
- [ ] Shows Recent Players count (4)
- [ ] **Both sections are clickable**
- [ ] Tapping Network opens connections list
- [ ] Tapping Recent Players opens recent list
- [ ] **Tab bar remains visible** in these screens
- [ ] **Back button works** to return to profile

### Performance
- [ ] App responds smoothly
- [ ] No crashes during navigation
- [ ] Map zooms/pans smoothly
- [ ] Videos load without errors

---

## 📸 SCREENSHOTS NEEDED FOR APP STORE

Take these screenshots on your iPhone for App Store submission:

1. **Login/Splash Screen**
   - Shows Ball House logo

2. **Find Courts Map**
   - Map with court markers
   - Shows recommended court badge
   - User location visible

3. **Court Details**
   - Shows the two-column activity metrics
   - Court name and address visible

4. **Media Tab**
   - Grid of basketball videos
   - Like and share buttons visible

5. **Profile Screen**
   - Network and Recent Players counts
   - Profile picture and stats

**Required Sizes:**
- iPhone 6.7" (1290 x 2796) - iPhone 14 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max

---

## 🏭 PRODUCTION BUILD (After Testing)

Once you've tested and verified everything works:

### Step 7: Create Production Build
```bash
eas build --platform ios --profile production
```

**This creates the final App Store build with:**
- Release optimizations
- Production credentials
- Auto-incrementing build number

### Step 8: Submit to App Store
```bash
eas submit --platform ios --profile production
```

**This will:**
1. Upload build to App Store Connect
2. Link to ASC App ID: 6755755781
3. Prepare for review submission

---

## 📱 APP STORE CONNECT FINAL STEPS

1. Go to https://appstoreconnect.apple.com
2. Sign in with choona.tech@gmail.com
3. Navigate to "Ball House" app
4. Complete:
   - App Description
   - Upload screenshots (see above)
   - Keywords: basketball, courts, pickup games, hoops, players
   - Category: Sports
   - Age Rating: 4+
   - Privacy Policy URL
   - Support URL
5. Click "Submit for Review"

**Review time:** Typically 24-48 hours

---

## 🐛 TROUBLESHOOTING

### Build Fails
```bash
# Check build logs at:
https://expo.dev/accounts/[your-account]/projects/ball-house/builds

# Common fixes:
eas build --clear-cache --platform ios --profile preview
```

### Map Not Showing on iPhone
- Verify Google Maps API key is enabled for iOS in Google Cloud Console
- Check location permissions are granted in iPhone Settings

### "Invalid Binary" Error
- Build number needs to be incremented
- EAS does this automatically, but verify in app.json

### Can't Login to EAS
```bash
eas logout
eas login
```

---

## 📊 BUILD STATUS MONITORING

Track your builds at:
```
https://expo.dev/accounts/[your-account]/projects/ball-house/builds
```

You'll see:
- Build status (queued, building, success, failed)
- Build logs
- Download links for IPA files
- Build duration

---

## 🎯 QUICK COMMAND REFERENCE

```bash
# Preview build for testing
eas build --platform ios --profile preview

# Production build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View project info
eas project:info

# Clear cache if build fails
eas build --clear-cache --platform ios
```

---

## ✅ POST-BUILD CHECKLIST

After successful build:
- [ ] Downloaded IPA file
- [ ] Tested on physical iPhone
- [ ] Verified map functionality works
- [ ] All features tested (see testing checklist above)
- [ ] Screenshots captured for App Store
- [ ] Ready to submit to App Store

---

## 🚀 YOU'RE READY!

All configurations are complete. Run the commands above to build your Ball House iOS app!

**Start with:**
```bash
cd /app/frontend
eas login
eas build --platform ios --profile preview
```

Good luck! 🏀📱
