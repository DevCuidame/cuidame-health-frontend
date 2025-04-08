# Generate Android Studio files
ionic capacitor copy android
ionic capacitor sync android
npx cap open android

# First time setup - copies Android folder to Android Studio workspace

# Icon generation
npm install -g cordova-res
cordova-res android --skip-config --copy

# Add iOS platform
npx cap add ios
ionic capacitor add ios

# Sync iOS files
npx cap sync ios
ionic capacitor sync ios

# Build iOS app
ionic capacitor build ios --prod
ionic capacitor build ios --prod --release
ionic capacitor build iOS --prod --release
ionic capacitor build ios --prod --buildFlag="-UseModernBuildSystem=0"

# Update iOS platform
ionic capacitor platform update ios

# Open in Xcode
npx cap open ios
# OR
open ios/App/App.xcworkspace


# Step 1: Install Homebrew
curl -fsSL -o install.sh https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh
/bin/bash install.sh

# Step 2: Install Ruby requirements
brew install chruby ruby-install

# Configure Homebrew in shell
(echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/lvinazco/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Step 3: Install Cocoapods
brew install cocoapods

# Step 4: Check/upgrade Cocoapods version
brew upgrade cocoapods

# Generate web server files
ionic build --prod

# Copy for deployment
ionic capacitor copy ios


# Browser plugins
ionic cordova plugin add cordova-plugin-inappbrowser
npm install @awesome-cordova-plugins/in-app-browser
npm install @capacitor/browser
npx cap sync