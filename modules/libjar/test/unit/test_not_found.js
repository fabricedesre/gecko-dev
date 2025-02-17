// Should report file not found on non-existent files

const {NetUtil} = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");
const path = "data/test_bug333423.zip";

function run_test() {
  var ios = Cc["@mozilla.org/network/io-service;1"].
            getService(Ci.nsIIOService);
  var spec = "jar:" + ios.newFileURI(do_get_file(path)).spec + "!/";
  var channel = NetUtil.newChannel({
    uri: spec + "file_that_isnt_in.archive",
    loadUsingSystemPrincipal: true
  });
  try {
    instr = channel.open2();
    do_throw("Failed to report that file doesn't exist")
  } catch (e) {
      Assert.ok(e.name == "NS_ERROR_FILE_NOT_FOUND")
  }
}
