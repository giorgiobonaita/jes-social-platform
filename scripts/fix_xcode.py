import sys

pbxproj = sys.argv[1]

with open(pbxproj, 'r') as f:
    c = f.read()

# 1. Sign in with Apple entitlement
if 'CODE_SIGN_ENTITLEMENTS' not in c:
    c = c.replace(
        'ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES',
        'CODE_SIGN_ENTITLEMENTS = "App/App.entitlements";\n\t\t\t\tALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'
    )
    print('Entitlements added')

# 2. SystemCapabilities for Sign in with Apple and Push Notifications
if 'SystemCapabilities' not in c:
    capabilities = (
        '\t\t\t\t\tSystemCapabilities = {\n'
        '\t\t\t\t\t\t"com.apple.Push-Notifications" = {\n'
        '\t\t\t\t\t\t\tenabled = 1;\n'
        '\t\t\t\t\t\t};\n'
        '\t\t\t\t\t\t"com.apple.Sign-in-with-Apple" = {\n'
        '\t\t\t\t\t\t\tenabled = 1;\n'
        '\t\t\t\t\t\t};\n'
        '\t\t\t\t\t};\n'
    )
    # Match both Automatic (before use-profiles) and Manual (after use-profiles)
    import re
    new_c = re.sub(
        r'(\t+ProvisioningStyle = (?:Automatic|Manual);\n\t+\};)',
        lambda m: m.group(0).replace('};', capabilities + '\t\t\t\t};', 1),
        c,
        count=1
    )
    if new_c != c:
        c = new_c
        print('SystemCapabilities added')
    else:
        print('WARNING: SystemCapabilities pattern not found - skipping')

# 3. GoogleService-Info.plist in Xcode project
GFILE_REF = 'AA00000000000001AAAAAAAA'
GBUILD_FILE = 'AA00000000000002AAAAAAAA'

if 'GoogleService-Info.plist' not in c:
    file_ref = '\t\t' + GFILE_REF + ' = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = GoogleService-Info.plist; sourceTree = "<group>"; };\n'
    c = c.replace('/* Begin PBXFileReference section */', '/* Begin PBXFileReference section */\n' + file_ref, 1)

    build_file = '\t\t' + GBUILD_FILE + ' = {isa = PBXBuildFile; fileRef = ' + GFILE_REF + ' /* GoogleService-Info.plist */; };\n'
    c = c.replace('/* Begin PBXBuildFile section */', '/* Begin PBXBuildFile section */\n' + build_file, 1)

    group_entry = '\t\t\t\t' + GFILE_REF + ' /* GoogleService-Info.plist */,\n'
    c = c.replace('504EC3071FED79650016851F /* AppDelegate.swift */,', '504EC3071FED79650016851F /* AppDelegate.swift */,\n' + group_entry, 1)

    res_entry = '\t\t\t\t' + GBUILD_FILE + ' /* GoogleService-Info.plist in Resources */,\n'
    c = c.replace('504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,', '504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,\n' + res_entry, 1)

    print('GoogleService-Info.plist added to Xcode project')
else:
    print('GoogleService-Info.plist already in project')

with open(pbxproj, 'w') as f:
    f.write(c)

print('Done')
