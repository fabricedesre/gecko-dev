# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import

import urllib

from marionette_driver.by import By
from marionette_driver.keys import Keys
from marionette_driver.marionette import Actions

from marionette_harness import MarionetteTestCase, skip_if_mobile, WindowManagerMixin


def inline(doc):
    return "data:text/html;charset=utf-8,{}".format(urllib.quote(doc))


class TestKeyActions(WindowManagerMixin, MarionetteTestCase):

    def setUp(self):
        super(TestKeyActions, self).setUp()
        if self.marionette.session_capabilities["platformName"] == "mac":
            self.mod_key = Keys.META
        else:
            self.mod_key = Keys.CONTROL
        test_html = self.marionette.absolute_url("keyboard.html")
        self.marionette.navigate(test_html)
        self.reporter_element = self.marionette.find_element(By.ID, "keyReporter")
        self.reporter_element.click()
        self.key_action = Actions(self.marionette)

    @property
    def key_reporter_value(self):
        return self.reporter_element.get_property("value")

    def test_key_action_basic_input(self):
        self.key_action.key_down("a").key_down("b").key_down("c").perform()
        self.assertEqual(self.key_reporter_value, "abc")

    def test_upcase_input(self):
        (self.key_action.key_down(Keys.SHIFT)
                        .key_down("a")
                        .key_up(Keys.SHIFT)
                        .key_down("b")
                        .key_down("c")
                        .perform())
        self.assertEqual(self.key_reporter_value, "Abc")

    def test_replace_input(self):
        self.key_action.key_down("a").key_down("b").key_down("c").perform()
        self.assertEqual(self.key_reporter_value, "abc")
        (self.key_action.key_down(self.mod_key)
                        .key_down("a")
                        .key_up(self.mod_key)
                        .key_down("x")
                        .perform())
        self.assertEqual(self.key_reporter_value, "x")

    def test_clear_input(self):
        self.key_action.key_down("a").key_down("b").key_down("c").perform()
        self.assertEqual(self.key_reporter_value, "abc")
        (self.key_action.key_down(self.mod_key)
                        .key_down("a")
                        .key_down("x")
                        .perform())
        self.assertEqual(self.key_reporter_value, "")
        self.key_action.key_down("a").key_down("b").key_down("c").perform()
        self.assertEqual(self.key_reporter_value, "abc")

    def test_input_with_wait(self):
        self.key_action.key_down("a").key_down("b").key_down("c").perform()
        (self.key_action.key_down(self.mod_key)
                        .key_down("a")
                        .wait(.5)
                        .key_down("x")
                        .perform())
        self.assertEqual(self.key_reporter_value, "")
