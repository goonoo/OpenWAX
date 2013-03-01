/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is N-WAX(NHN Web Accessibility eXtension).
 *
 * The Initial Developer of the Original Code is
 * Goonoo Kim (NHN).
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*global Components */
(function (global, document) {
  "use strict";

  var achecker = global.achecker = {
    init: function () {
      if (achecker.preferences.getPref("firstUse") === true) {
        achecker.initFirstTimeUser();
      }
    },

    initFirstTimeUser: function () {
      achecker.attachToolbarButton();
      achecker.preferences.setPref("firstUse", false);
    },

    attachToolbarButton: function () {
      var toolButtonId = "achecker-button";
      var firefoxnav = document.getElementById("nav-bar");
      var curSet = firefoxnav.currentSet;
      var set;

      if (curSet.indexOf(toolButtonId) === -1) {
        if (curSet.indexOf("search-container") !== -1) {
          set = curSet.replace(/search-container/, "search-container," + toolButtonId);
        } else {  // at the end
          set = firefoxnav.currentSet + "," + toolButtonId;
        }

        firefoxnav.setAttribute("currentset", set);
        firefoxnav.currentSet = set;
        document.persist("nav-bar", "currentset");
        try {
          global.BrowserToolboxCustomizeDone(true);
        } catch (e) {}
      }
    },

    toggleChecker: function () {
      global.toggleSidebar('achecker-viewsidebar');
    },

    checkCurrentPage: function (isIncludeFrame) {
      var cwin = achecker.currentWin();
      var rdoc = achecker.resultDoc();
      var i;
      var getFrameDocs = function (win) {
        if (!win.frames) {
          return;
        }

        var frameDocs = [], i, l;

        for (i = 0, l = win.frames.length; i < l; i++) {
          var frame = win.frames[i];
          frameDocs.push({
            src: frame.location.href,
            doc: frame.window.document
          });

          if (frame.window.frames.length) {
            frameDocs = frameDocs.concat(getFrameDocs(frame.window));
          }
        }

        return frameDocs;
      };



      var pajetResult = achecker.Pajet.run(cwin, rdoc, isIncludeFrame, getFrameDocs(cwin));
      var pajetHeader = pajetResult.header;
      var pajetSections = pajetResult.sections;
      var pajetScore = achecker.Pajet.scoreAsElement(rdoc, pajetSections);

      rdoc.body.textContent = '';
      rdoc.body.appendChild(pajetScore);
      rdoc.body.appendChild(pajetHeader);
      for (i in pajetSections) {
        if (pajetSections.hasOwnProperty(i)) {
          rdoc.body.appendChild(pajetSections[i].getAsElement());
        }
      }
    },

    /* get elements from result.html */
    resultDoc: function () {
      return document.getElementById("sidebar").contentDocument.getElementById("resultframe").contentDocument;
    },

    resultWin: function () {
      return document.getElementById("sidebar").contentDocument.getElementById("resultframe").contentWindow;
    },

    currentDoc: function () {
      return global.parent.gBrowser.selectedBrowser.contentDocument;
    },

    currentWin: function () {
      return global.parent.gBrowser.selectedBrowser.contentWindow;
    },

    showOverlay: function () {
      if (achecker.currentDoc().getElementById("_acheckeroverlay")) {
        achecker.currentDoc().getElementById("_acheckeroverlay").style.display = "block";
        return;
      }

      var $overlay = achecker.currentDoc().createElement('div');
      $overlay.id = '_acheckeroverlay';
      $overlay.style.display = 'block';
      $overlay.style.zIndex = '99999999';
      $overlay.style.position = 'fixed';
      $overlay.style.top = '0';
      $overlay.style.right = '0';
      $overlay.style.bottom = '0';
      $overlay.style.left = '0';
      $overlay.style.backgroundColor = '#fff';
      $overlay.style.opacity = '0.01';
      achecker.currentDoc().body.appendChild($overlay);
    },

    hideOverlay: function () {
      if (achecker.currentDoc().getElementById("_acheckeroverlay")) {
        achecker.currentDoc().getElementById("_acheckeroverlay").style.display = "none";
      }
    },

    $: function (id) {
      return document.getElementById(id);
    }
  };

  achecker.preferences = {
    SERVICE_COMPONENT: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.achecker."),

    getPref: function (key) {
      var type = this.SERVICE_COMPONENT.getPrefType(key);
      switch (type) {
      case this.SERVICE_COMPONENT.PREF_BOOL:
        return this.SERVICE_COMPONENT.getBoolPref(key);

      case this.SERVICE_COMPONENT.PREF_STRING:
        return this.SERVICE_COMPONENT.getCharPref(key);

      case this.SERVICE_COMPONENT.PREF_INT:
        return this.SERVICE_COMPONENT.getIntPref(key);

      default:
        return null;
      }
    },

    setPref: function (key, value) {
      var type = this.SERVICE_COMPONENT.getPrefType(key);
      switch (type) {
      case this.SERVICE_COMPONENT.PREF_STRING:
        return this.SERVICE_COMPONENT.setCharPref(key, value);

      case this.SERVICE_COMPONENT.PREF_INT:
        return this.SERVICE_COMPONENT.setIntPref(key, value);

      case this.SERVICE_COMPONENT.PREF_BOOL:
        return this.SERVICE_COMPONENT.setBoolPref(key, value);

      default:
        return null;
      }
    }
  };

  achecker.preferences.SERVICE_COMPONENT.QueryInterface(Components.interfaces.nsIPrefBranch);
}(this, this.document));
