/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const kSearchEngineID = "browser_urifixup_search_engine";
const kSearchEngineURL = "http://example.com/?search={searchTerms}";

add_task(async function setup() {
  // Add a new fake search engine.
  await Services.search.addEngineWithDetails(kSearchEngineID, "", "", "", "get", kSearchEngineURL);

  let oldDefaultEngine = await Services.search.getDefault();
  await Services.search.setDefault(Services.search.getEngineByName(kSearchEngineID));

  // Remove the fake engine when done.
  registerCleanupFunction(async () => {
    if (oldDefaultEngine) {
      await Services.search.setDefault(oldDefaultEngine);
    }

    let engine = Services.search.getEngineByName(kSearchEngineID);
    if (engine) {
      await Services.search.removeEngine(engine);
    }
  });
});

add_task(async function test() {
  for (let searchParams of ["foo bar", "brokenprotocol:somethingelse"]) {
    // Add a new blank tab.
    gBrowser.selectedTab = BrowserTestUtils.addTab(gBrowser, "about:blank");
    await BrowserTestUtils.browserLoaded(gBrowser.selectedBrowser);

    // Enter search terms and start a search.
    gURLBar.value = searchParams;
    gURLBar.focus();
    EventUtils.synthesizeKey("KEY_Enter");
    await BrowserTestUtils.browserLoaded(gBrowser.selectedBrowser);

    // Check that we arrived at the correct URL.
    let escapedParams = encodeURIComponent(searchParams).replace("%20", "+");
    let expectedURL = kSearchEngineURL.replace("{searchTerms}", escapedParams);
    is(gBrowser.selectedBrowser.currentURI.spec, expectedURL,
       "New tab should have loaded with expected url.");

    // Cleanup.
    gBrowser.removeCurrentTab();
  }
});
