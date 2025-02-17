/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// This is loaded into all XUL windows. Wrap in a block to prevent
// leaking to window scope.
{
const MozXULMenuElement = MozElementMixin(XULMenuElement);
const MenuBaseControl = BaseControlMixin(MozXULMenuElement);

class MozMenuList extends MenuBaseControl {
  constructor() {
    super();

    this.addEventListener("command", (event) => {
      if (event.target.parentNode.parentNode == this) {
        this.selectedItem = event.target;
      }
    }, true);

    this.addEventListener("popupshowing", (event) => {
      if (event.target.parentNode == this) {
        this.activeChild = null;
        if (this.selectedItem)
          // Not ready for auto-setting the active child in hierarchies yet.
          // For now, only do this when the outermost menupopup opens.
          this.activeChild = this.mSelectedInternal;
      }
    });

    this.addEventListener("keypress", (event) => {
      if (event.altKey ||
          event.ctrlKey ||
          event.metaKey) {
        return;
      }

      if (!event.defaultPrevented &&
        (event.keyCode == KeyEvent.DOM_VK_UP ||
          event.keyCode == KeyEvent.DOM_VK_DOWN ||
          event.keyCode == KeyEvent.DOM_VK_PAGE_UP ||
          event.keyCode == KeyEvent.DOM_VK_PAGE_DOWN ||
          event.keyCode == KeyEvent.DOM_VK_HOME ||
          event.keyCode == KeyEvent.DOM_VK_END ||
          event.keyCode == KeyEvent.DOM_VK_BACK_SPACE ||
          event.charCode > 0)) {
        // Moving relative to an item: start from the currently selected item
        this.activeChild = this.mSelectedInternal;
        if (this.handleKeyPress(event)) {
          this.activeChild.doCommand();
          event.preventDefault();
        }
      }
    }, { mozSystemGroup: true });
  }

  connectedCallback() {
    if (this.delayConnectedCallback()) {
      return;
    }

    if (this.getAttribute("popuponly") != "true") {
      this.prepend(MozMenuList.fragment.cloneNode(true));
      this._labelBox = this.children[0];
      this._dropmarker = this.children[1];
    }

    this._updateAttributes();

    this.mSelectedInternal = null;
    this.mAttributeObserver = null;
    this.setInitialSelection();
  }

  static get fragment() {
    // Accessibility information of these nodes will be
    // presented on XULComboboxAccessible generated from <menulist>;
    // hide these nodes from the accessibility tree.
    let frag = document.importNode(MozXULElement.parseXULToFragment(`
        <hbox class="menulist-label-box" flex="1" role="none">
          <image class="menulist-icon" role="none"/>
          <label class="menulist-label" crop="right" flex="1" role="none"/>
          <label class="menulist-highlightable-label" crop="right" flex="1" role="none"/>
        </hbox>
        <dropmarker class="menulist-dropmarker" type="menu" role="none"/>
      `), true);

    Object.defineProperty(this, "fragment", { value: frag });
    return frag;
  }

  // nsIDOMXULSelectControlElement
  set value(val) {
    // if the new value is null, we still need to remove the old value
    if (val == null)
      return this.selectedItem = val;

    var arr = null;
    var popup = this.menupopup;
    if (popup)
      arr = popup.getElementsByAttribute("value", val);

    if (arr && arr.item(0))
      this.selectedItem = arr[0];
    else {
      this.selectedItem = null;
      this.setAttribute("value", val);
    }

    return val;
  }

  // nsIDOMXULSelectControlElement
  get value() {
    return this.getAttribute("value");
  }

  // nsIDOMXULMenuListElement
  set crop(val) {
    this.setAttribute("crop", val);
  }

  // nsIDOMXULMenuListElement
  get crop() {
    return this.getAttribute("crop");
  }

  // nsIDOMXULMenuListElement
  set image(val) {
    this.setAttribute("image", val);
    return val;
  }

  // nsIDOMXULMenuListElement
  get image() {
    return this.getAttribute("image");
  }

  // nsIDOMXULMenuListElement
  get label() {
    return this.getAttribute("label");
  }

  set description(val) {
    this.setAttribute("description", val);
    return val;
  }

  get description() {
    return this.getAttribute("description");
  }

  // nsIDOMXULMenuListElement
  set open(val) {
    this.openMenu(val);
    return val;
  }

  // nsIDOMXULMenuListElement
  get open() {
    return this.hasAttribute("open");
  }

  // nsIDOMXULSelectControlElement
  get itemCount() {
    return this.menupopup ? this.menupopup.children.length : 0;
  }

  get menupopup() {
    var popup = this.firstElementChild;
    while (popup && popup.localName != "menupopup")
      popup = popup.nextElementSibling;
    return popup;
  }

  // nsIDOMXULSelectControlElement
  set selectedIndex(val) {
    var popup = this.menupopup;
    if (popup && 0 <= val) {
      if (val < popup.children.length)
        this.selectedItem = popup.children[val];
    } else
      this.selectedItem = null;
    return val;
  }

  // nsIDOMXULSelectControlElement
  get selectedIndex() {
    // Quick and dirty. We won't deal with hierarchical menulists yet.
    if (!this.selectedItem ||
      !this.mSelectedInternal.parentNode ||
      this.mSelectedInternal.parentNode.parentNode != this)
      return -1;

    var children = this.mSelectedInternal.parentNode.children;
    var i = children.length;
    while (i--)
      if (children[i] == this.mSelectedInternal)
        break;

    return i;
  }

  // nsIDOMXULSelectControlElement
  set selectedItem(val) {
    var oldval = this.mSelectedInternal;
    if (oldval == val)
      return val;

    if (val && !this.contains(val))
      return val;

    if (oldval) {
      oldval.removeAttribute("selected");
      this.mAttributeObserver.disconnect();
    }

    this.mSelectedInternal = val;
    let attributeFilter = ["value", "label", "image", "description"];
    if (val) {
      val.setAttribute("selected", "true");
      for (let attr of attributeFilter) {
        if (val.hasAttribute(attr)) {
          this.setAttribute(attr, val.getAttribute(attr));
        } else {
          this.removeAttribute(attr);
        }
      }

      this.mAttributeObserver = new MutationObserver(this.handleMutation.bind(this));
      this.mAttributeObserver.observe(val, { attributeFilter });
    } else {
      for (let attr of attributeFilter) {
        this.removeAttribute(attr);
      }
    }

    var event = document.createEvent("Events");
    event.initEvent("select", true, true);
    this.dispatchEvent(event);

    event = document.createEvent("Events");
    event.initEvent("ValueChange", true, true);
    this.dispatchEvent(event);

    return val;
  }

  // nsIDOMXULSelectControlElement
  get selectedItem() {
    return this.mSelectedInternal;
  }

  setInitialSelection() {
    var popup = this.menupopup;
    if (popup) {
      var arr = popup.getElementsByAttribute("selected", "true");

      var editable = this.editable;
      var value = this.value;
      if (!arr.item(0) && value)
        arr = popup.getElementsByAttribute(editable ? "label" : "value", value);

      if (arr.item(0))
        this.selectedItem = arr[0];
      else if (!editable)
        this.selectedIndex = 0;
    }
  }

  contains(item) {
    if (!item)
      return false;

    var parent = item.parentNode;
    return (parent && parent.parentNode == this);
  }

  handleMutation(aRecords) {
    for (let record of aRecords) {
      let t = record.target;
      if (t == this.mSelectedInternal) {
        let attrName = record.attributeName;
        switch (attrName) {
          case "value":
          case "label":
          case "image":
          case "description":
            if (t.hasAttribute(attrName)) {
              this.setAttribute(attrName, t.getAttribute(attrName));
            } else {
              this.removeAttribute(attrName);
            }
        }
      }
    }
  }

  // nsIDOMXULSelectControlElement
  getIndexOfItem(item) {
    var popup = this.menupopup;
    if (popup) {
      var children = popup.children;
      var i = children.length;
      while (i--)
        if (children[i] == item)
          return i;
    }
    return -1;
  }

  // nsIDOMXULSelectControlElement
  getItemAtIndex(index) {
    var popup = this.menupopup;
    if (popup) {
      var children = popup.children;
      if (index >= 0 && index < children.length)
        return children[index];
    }
    return null;
  }

  appendItem(label, value, description) {
    if (!this.menupopup) {
      this.appendChild(MozXULElement.parseXULToFragment(`<menupopup />`));
    }

    var popup = this.menupopup;
    popup.appendChild(MozXULElement.parseXULToFragment(`<menuitem />`));

    var item = popup.lastElementChild;
    if (label !== undefined) {
      item.setAttribute("label", label);
    }
    item.setAttribute("value", value);
    if (description) {
      item.setAttribute("description", description);
    }

    return item;
  }

  removeAllItems() {
    this.selectedItem = null;
    var popup = this.menupopup;
    if (popup)
      this.removeChild(popup);
  }

  disconnectedCallback() {
    if (this.mAttributeObserver) {
      this.mAttributeObserver.disconnect();
    }

    if (this._labelBox) {
      this._labelBox.remove();
      this._dropmarker.remove();
      this._labelBox = null;
      this._dropmarker = null;
    }
  }

  static get observedAttributes() {
    return ["label", "crop", "accesskey", "highlightable", "image", "disabled",
            "open"];
  }

  attributeChangedCallback() {
    if (this.isConnectedAndReady) {
      this._updateAttributes();
    }
  }

  _updateAttributes() {
    if (!this._labelBox) {
      return;
    }

    let icon = this._labelBox.querySelector(".menulist-icon");
    this.inheritAttribute(icon, "src=image");

    let label = this._labelBox.querySelector(".menulist-label");
    this.inheritAttribute(label, "value=label");
    this.inheritAttribute(label, "crop");
    this.inheritAttribute(label, "accesskey");
    this.inheritAttribute(label, "highlightable");

    let highlightableLabel = this._labelBox.querySelector(".menulist-highlightable-label");
    this.inheritAttribute(highlightableLabel, "text=label");
    this.inheritAttribute(highlightableLabel, "crop");
    this.inheritAttribute(highlightableLabel, "accesskey");
    this.inheritAttribute(highlightableLabel, "highlightable");

    this.inheritAttribute(this._dropmarker, "disabled");
    this.inheritAttribute(this._dropmarker, "open");
  }
}

MenuBaseControl.implementCustomInterface(MozMenuList, [Ci.nsIDOMXULMenuListElement,
                                                       Ci.nsIDOMXULSelectControlElement]);

customElements.define("menulist", MozMenuList);
}
