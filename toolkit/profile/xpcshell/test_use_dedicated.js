/**
 * Tests that if installs.ini lists a profile we use it as the default.
 */

add_task(async () => {
  let hash = xreDirProvider.getInstallHash();
  let defaultProfile = makeRandomProfileDir("default");
  let dedicatedProfile = makeRandomProfileDir("dedicated");
  let devProfile = makeRandomProfileDir("devedition");

  // Make sure we don't steal the old-style default.
  writeCompatibilityIni(defaultProfile);

  writeProfilesIni({
    profiles: [{
      name: "default",
      path: defaultProfile.leafName,
      default: true,
    }, {
      name: "dedicated",
      path: dedicatedProfile.leafName,
    }, {
      name: "dev-edition-default",
      path: devProfile.leafName,
    }],
  });

  writeInstallsIni({
    installs: {
      [hash]: {
        default: dedicatedProfile.leafName,
      },
      "otherhash": {
        default: "foobar",
      },
    },
  });

  let { profile: selectedProfile, didCreate } = selectStartupProfile();
  checkStartupReason("default");

  let profileData = readProfilesIni();
  let installData = readInstallsIni();

  Assert.ok(profileData.options.startWithLastProfile, "Should be set to start with the last profile.");
  Assert.equal(profileData.profiles.length, 3, "Should have the right number of profiles.");

  let profile = profileData.profiles[0];
  Assert.equal(profile.name, `dedicated`, "Should have the right name.");
  Assert.equal(profile.path, dedicatedProfile.leafName, "Should be the expected dedicated profile.");
  Assert.ok(!profile.default, "Should not be marked as the old-style default.");

  profile = profileData.profiles[1];
  Assert.equal(profile.name, "default", "Should have the right name.");
  Assert.equal(profile.path, defaultProfile.leafName, "Should be the original default profile.");
  Assert.ok(profile.default, "Should be marked as the old-style default.");

  Assert.equal(Object.keys(installData.installs).length, 2, "Should be two known installs.");
  Assert.equal(installData.installs[hash].default, dedicatedProfile.leafName, "Should have kept the default for this install.");
  Assert.equal(installData.installs.otherhash.default, "foobar", "Should have kept the default for the other install.");

  checkProfileService(profileData, installData);

  Assert.ok(!didCreate, "Should not have created a new profile.");
  Assert.ok(selectedProfile.rootDir.equals(dedicatedProfile), "Should be using the right directory.");
  Assert.equal(selectedProfile.name, "dedicated");
});
