/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

const {NetUtil} = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

// Check that we don't crash on reading a directory entry signature
var ios = Cc["@mozilla.org/network/io-service;1"].
          getService(Ci.nsIIOService);

function run_test() {
  var file = do_get_file("data/test_bug658093.zip");
  var spec = "jar:" + ios.newFileURI(file).spec + "!/0000";
  var channel = NetUtil.newChannel({uri: spec, loadUsingSystemPrincipal: true});
  var failed = false;
  try {
    var stream = channel.open2();
  } catch (e) {
    failed = true;
  }
  Assert.ok(failed);
}
