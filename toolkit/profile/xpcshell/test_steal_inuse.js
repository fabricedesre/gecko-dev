/*
 * Tests that an old-style default profile previously used by this build but
 * that has already been claimed by a different build gets stolen by this build.
 */

add_task(async () => {
  let defaultProfile = makeRandomProfileDir("default");

  writeCompatibilityIni(defaultProfile);

  writeProfilesIni({
    profiles: [{
      name: PROFILE_DEFAULT,
      path: defaultProfile.leafName,
      default: true,
    }],
  });
  writeInstallsIni({
    installs: {
      otherhash: {
        default: defaultProfile.leafName,
      },
    },
  });

  let service = getProfileService();
  let { profile: selectedProfile, didCreate } = selectStartupProfile();
  checkStartupReason("firstrun-claimed-default");

  let hash = xreDirProvider.getInstallHash();
  let profileData = readProfilesIni();
  let installData = readInstallsIni();

  Assert.ok(profileData.options.startWithLastProfile, "Should be set to start with the last profile.");
  Assert.equal(profileData.profiles.length, 1, "Should have the right number of profiles.");

  let profile = profileData.profiles[0];
  Assert.equal(profile.name, PROFILE_DEFAULT, "Should have the right name.");
  Assert.equal(profile.path, defaultProfile.leafName, "Should be the original default profile.");
  Assert.ok(profile.default, "Should be marked as the old-style default.");

  Assert.equal(Object.keys(installData.installs).length, 1, "Should only be one known installs.");
  Assert.equal(installData.installs[hash].default, defaultProfile.leafName, "Should have taken the original default profile as the default for the current install.");
  Assert.ok(!installData.installs[hash].locked, "Should not have locked as we're not the default app.");

  checkProfileService(profileData, installData);

  Assert.ok(!didCreate, "Should not have created a new profile.");
  Assert.ok(!service.createdAlternateProfile, "Should not have created an alternate profile.");
  Assert.ok(selectedProfile.rootDir.equals(defaultProfile), "Should be using the right directory.");
  Assert.equal(selectedProfile.name, PROFILE_DEFAULT);
});
