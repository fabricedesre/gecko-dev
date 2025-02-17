/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

function FooComponent() {
  this.wrappedJSObject = this;
}
FooComponent.prototype =
{
  // nsIClassInfo + information for XPCOM registration code in XPCOMUtils.jsm
  classDescription:  "Foo Component",
  classID:           Components.ID("{6b933fe6-6eba-4622-ac86-e4f654f1b474}"),
  contractID:       "@mozilla.org/tests/module-importer;1",

  // nsIClassInfo
  flags: 0,

  getInterfaces: function getInterfaces(aCount) {
    var interfaces = [Ci.nsIClassInfo];
    aCount.value = interfaces.length;

    // Guerilla test for line numbers hiding in this method
    var threw = true;
    try {
      thereIsNoSuchIdentifier;
      threw = false;
    } catch (ex) {
      Assert.ok(ex.lineNumber == 27);
    }
    Assert.ok(threw);

    return interfaces;
  },

  getScriptableHelper: function getScriptableHelper() {
    return null;
  },

  // nsISupports
  QueryInterface: function QueryInterface(aIID) {
    if (aIID.equals(Ci.nsIClassInfo) ||
        aIID.equals(Ci.nsISupports))
      return this;

    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

function BarComponent() {
}
BarComponent.prototype =
{
  // nsIClassInfo + information for XPCOM registration code in XPCOMUtils.jsm
  classDescription: "Module importer test 2",
  classID: Components.ID("{708a896a-b48d-4bff-906e-fc2fd134b296}"),
  contractID: "@mozilla.org/tests/module-importer;2",

  // nsIClassInfo
  flags: 0,

  getInterfaces: function getInterfaces(aCount) {
    var interfaces = [Ci.nsIClassInfo];
    aCount.value = interfaces.length;
    return interfaces;
  },

  getScriptableHelper: function getScriptableHelper() {
    return null;
  },

  // nsISupports
  QueryInterface: ChromeUtils.generateQI([Ci.nsIClassInfo])
};

const Assert = {
  ok(cond, text) {
    // we don't have the test harness' utilities in this scope, so we need this
    // little helper. In the failure case, the exception is propagated to the
    // caller in the main run_test() function, and the test fails.
    if (!cond)
      throw "Failed check: " + text;
  }
};

var gComponentsArray = [FooComponent, BarComponent];
this.NSGetFactory = XPCOMUtils.generateNSGetFactory(gComponentsArray);
