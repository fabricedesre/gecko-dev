AntiTracking.runTest("localStorage and Storage Access API",
  async _ => {
    /* import-globals-from storageAccessAPIHelpers.js */
    await noStorageAccessInitially();

    let shouldThrow = SpecialPowers.Services.prefs.getIntPref("network.cookie.cookieBehavior") == SpecialPowers.Ci.nsICookieService.BEHAVIOR_REJECT;

    let hasThrown;
    try {
      localStorage.foo = 42;
      ok(true, "LocalStorage is allowed");
      is(localStorage.foo, "42", "The value matches");
      hasThrown = false;
    } catch (e) {
      is(e.name, "SecurityError", "We want a security error message.");
      hasThrown = true;
    }

    is(hasThrown, shouldThrow, "LocalStorage has been exposed correctly");

    let prevLocalStorage;
    if (!shouldThrow) {
      prevLocalStorage = localStorage;
    }

    /* import-globals-from storageAccessAPIHelpers.js */
    await callRequestStorageAccess();

    if (shouldThrow) {
      try {
        is(localStorage.foo, undefined, "Undefined value after.");
        ok(false, "localStorage should not be available");
      } catch (e) {
        ok(true, "localStorage should not be available");
      }
    } else {
      ok(localStorage != prevLocalStorage, "We have a new localStorage");
      is(localStorage.foo, undefined, "Undefined value after.");

      localStorage.foo = 42;
      ok(true, "LocalStorage is still allowed");
      is(localStorage.foo, "42", "The value matches");
    }
  },
  async _ => {
    /* import-globals-from storageAccessAPIHelpers.js */
    await noStorageAccessInitially();

    localStorage.foo = 42;
    ok(true, "LocalStorage is allowed");
    is(localStorage.foo, "42", "The value matches");

    var prevLocalStorage = localStorage;

    /* import-globals-from storageAccessAPIHelpers.js */
    await callRequestStorageAccess();

    // For non-tracking windows, calling the API is a no-op
    ok(localStorage == prevLocalStorage, "We have a new localStorage");
    is(localStorage.foo, "42", "The value matches");
    ok(true, "LocalStorage is allowed");
  },
  async _ => {
    await new Promise(resolve => {
      Services.clearData.deleteData(Ci.nsIClearDataService.CLEAR_ALL, value => resolve());
    });
  },
  [["privacy.restrict3rdpartystorage.partitionedHosts", "tracking.example.org,tracking.example.com"]],
  false, false);
