/* -*- js-indent-level: 2; indent-tabs-mode: nil -*- */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */
/* eslint-disable no-shadow, max-nested-callbacks */

"use strict";

var gDebuggee;
var gClient;
var gThreadClient;

// This test ensures that we can create SourceActors and SourceClients properly,
// and that they can communicate over the protocol to fetch the source text for
// a given script.

function run_test() {
  initTestDebuggerServer();
  gDebuggee = addTestGlobal("test-grips");
  Cu.evalInSandbox(
    "" + function stopMe(arg1) {
      debugger;
    },
    gDebuggee,
    "1.8",
    getFileUrl("test_source-02.js")
  );

  gClient = new DebuggerClient(DebuggerServer.connectPipe());
  gClient.connect().then(function() {
    attachTestTabAndResume(gClient, "test-grips",
                           function(response, targetFront, threadClient) {
                             gThreadClient = threadClient;
                             test_source();
                           });
  });
  do_test_pending();
}

const SOURCE_URL = "http://example.com/foobar.js";
const SOURCE_CONTENT = "stopMe()";

function test_source() {
  DebuggerServer.LONG_STRING_LENGTH = 200;

  gThreadClient.addOneTimeListener("paused", function(event, packet) {
    gThreadClient.getSources(async function(response) {
      Assert.ok(!!response);
      Assert.ok(!!response.sources);

      const source = response.sources.filter(function(s) {
        return s.url === SOURCE_URL;
      })[0];

      Assert.ok(!!source);

      const sourceClient = gThreadClient.source(source);
      response = await sourceClient.getBreakpointPositions();
      Assert.ok(!!response);
      Assert.ok(!!response.positions);
      Assert.deepEqual(
        response.positions,
        [{
          line: 1,
          column: 0,
        }, {
          line: 1,
          column: 8,
        }]
      );

      response = await sourceClient.getBreakpointPositionsCompressed();
      Assert.ok(!!response);
      Assert.ok(!!response.positions);
      Assert.deepEqual(
        response.positions,
        {
          1: [0, 8],
        }
      );

      await gThreadClient.resume();
      finishClient(gClient);
    });
  });

  Cu.evalInSandbox(
    SOURCE_CONTENT,
    gDebuggee,
    "1.8",
    SOURCE_URL
  );
}
