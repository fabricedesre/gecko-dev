// Make sure we behave appropriately when asking for content-disposition

const {NetUtil} = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

const path = "data/test_bug589292.zip";

function run_test() {
  var ios = Cc["@mozilla.org/network/io-service;1"].
            getService(Ci.nsIIOService);
  var spec = "jar:" + ios.newFileURI(do_get_file(path)).spec + "!/foo.txt";
  var channel = NetUtil.newChannel({uri: spec, loadUsingSystemPrincipal: true});
  instr = channel.open2();
  var val;
  try {
    val = channel.contentDisposition;
    Assert.ok(false, "The channel has content disposition?!");
  } catch (e) {
    // This is what we want to happen - there's no underlying channel, so no
    // content-disposition header is available
    Assert.ok(true, "How are you reading this?!");
  }
}
