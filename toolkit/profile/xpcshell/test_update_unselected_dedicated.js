/*
 * Tests that an old-style default profile not previously used by this build gets
 * ignored.
 */

add_task(async () => {
  let hash = xreDirProvider.getInstallHash();
  let defaultProfile = makeRandomProfileDir("default");

  // Just pretend this profile was last used by something in the profile dir.
  let greDir = gProfD.clone();
  greDir.append("app");
  writeCompatibilityIni(defaultProfile, greDir, greDir);

  writeProfilesIni({
    profiles: [{
      name: PROFILE_DEFAULT,
      path: defaultProfile.leafName,
      default: true,
    }],
  });

  let service = getProfileService();
  let { profile: selectedProfile, didCreate } = selectStartupProfile();
  checkStartupReason("firstrun-skipped-default");

  let profileData = readProfilesIni();
  let installData = readInstallsIni();

  Assert.ok(profileData.options.startWithLastProfile, "Should be set to start with the last profile.");
  Assert.equal(profileData.profiles.length, 2, "Should have the right number of profiles.");

  // The name ordering is different for dev edition.
  if (AppConstants.MOZ_DEV_EDITION) {
    profileData.profiles.reverse();
  }

  let profile = profileData.profiles[0];
  Assert.equal(profile.name, PROFILE_DEFAULT, "Should have the right name.");
  Assert.equal(profile.path, defaultProfile.leafName, "Should be the original default profile.");
  Assert.ok(profile.default, "Should be marked as the old-style default.");
  profile = profileData.profiles[1];
  Assert.equal(profile.name, DEDICATED_NAME, "Should have the right name.");
  Assert.notEqual(profile.path, defaultProfile.leafName, "Should not be the original default profile.");
  Assert.ok(!profile.default, "Should not be marked as the old-style default.");

  Assert.equal(Object.keys(installData.installs).length, 1, "Should be a default for this install.");
  Assert.equal(installData.installs[hash].default, profile.path, "Should have marked the new profile as the default for this install.");
  Assert.ok(installData.installs[hash].locked, "Should have locked as we created this profile for this install.");

  checkProfileService(profileData, installData);

  Assert.ok(didCreate, "Should have created a new profile.");
  Assert.ok(service.createdAlternateProfile, "Should have created an alternate profile.");
  Assert.ok(!selectedProfile.rootDir.equals(defaultProfile), "Should be using the right directory.");
  Assert.equal(selectedProfile.name, DEDICATED_NAME);
});
