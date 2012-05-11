/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
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
 * The Original Code is Rainbow.
 *
 * The Initial Developer of the Original Code is
 * Heather Arthur.
 * Portions created by the Initial Developer are Copyright (C) 2009
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

achecker.colorInspector = {
	inspecting: false,
	callback: null,

	wm: Components.classes["@mozilla.org/appshell/window-mediator;1"]
       .getService(Components.interfaces.nsIWindowMediator),

	openSwatch: function() {
		var colorSwatch = achecker.$('achecker-colorSwatch');
		colorSwatch.openPopupAtScreen(-200,-200,false);
	},
	hideSwatch: function() {
		var colorSwatch = achecker.$('achecker-colorSwatch');
		colorSwatch.hidePopup();
	},
	overrideCursor: function() {
		var sheet = "chrome://achecker/skin/cursor.css";
		/* add a user style sheet that applies to all documents */
		var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
				.getService(Components.interfaces.nsIStyleSheetService);
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);
		var uri = ios.newURI(sheet, null, null);
		if(!sss.sheetRegistered(uri, sss.AGENT_SHEET))
			sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET); 
	},
	undoCursor: function() {
		var sheet = "chrome://achecker/skin/cursor.css";
		var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
				.getService(Components.interfaces.nsIStyleSheetService);
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);
		var uri = ios.newURI(sheet, null, null);
		if(sss.sheetRegistered(uri, sss.AGENT_SHEET))
			sss.unregisterSheet(uri, sss.AGENT_SHEET);
	},
	startInspect: function(callback) {
		achecker.colorInspector.callback = callback;
		achecker.colorInspector.inspecting = true;
		achecker.colorInspector.openSwatch();
		achecker.colorInspector._addInspectListeners();
    	achecker.colorInspector.overrideCursor();
		// cursor change
	},
	stopInspect: function() {
		achecker.colorInspector.callback = null;
		achecker.colorInspector.inspecting = false;
		achecker.colorInspector.hideSwatch();
		achecker.colorInspector._removeInspectListeners();
    	achecker.colorInspector.undoCursor();
		// cursor restore
	},
	_addInspectListeners: function() {
	    var enumerator = achecker.colorInspector.wm.getEnumerator("");
	    while(enumerator.hasMoreElements()) {
	      var win = enumerator.getNext();
	      win.addEventListener("mousemove", achecker.colorInspector.inspectPixel, true);
	      win.addEventListener("click", achecker.colorInspector.pageClick, true);
	    };
	},
	_removeInspectListeners: function() {
	    var enumerator = achecker.colorInspector.wm.getEnumerator("");
	    while(enumerator.hasMoreElements()) {
	      var win = enumerator.getNext(); 
	      try {
	        win.removeEventListener("mousemove", achecker.colorInspector.inspectPixel, true);
	        win.removeEventListener("click", achecker.colorInspector.pageClick, true);
	      } catch(e) { }
	    };
	},
	inspectPixel: function(event) {
		var win = event.target.ownerDocument.defaultView;
	    var pageX = event.clientX + win.scrollX;
	    var pageY = event.clientY + win.scrollY;
	    var color = achecker.colorInspector.getPixel(win, pageX, pageY);
	    achecker.colorInspector.changeColor(color);

	    var swatch = achecker.$('achecker-colorSwatch');
		swatch.moveTo(event.screenX + 5, event.screenY + 6);
	    achecker.colorInspector.updateDisplay(event.clientX, event.clientY, win, event);

	    swatch.clientX = event.clientX - 5; // can keep track in case of keypress moving
	    swatch.clientY = event.clientY - 6;
	    swatch.pageX = event.clientX + win.scrollX;
	    swatch.pageY = event.clientY + win.scrollY;
	    swatch.win = win;

	    event.preventDefault();
	    event.stopPropagation();
	},
	changeColor : function(color, show) {
		var hexColor = achecker.rainbowColor.toHex(color);
		var swatch = achecker.$("achecker-colorSwatch");
		swatch.style.backgroundColor = hexColor;
		swatch.color = hexColor;

		var swatchBox = achecker.$("achecker-colorSwatchBox");
		swatchBox.style.backgroundColor = hexColor;

		var blackText = achecker.rainbowColor.blackText(color);
		var colorval = achecker.$("achecker-colorSwatchVal");
		colorval.value = hexColor;
		colorval.style.color = blackText ? 'black' : 'white';
		colorval.style.backgroundColor = hexColor;
	},
	updateDisplay : function(clientX, clientY, win, event) {
		var swatch = achecker.$("achecker-colorSwatch");
		swatch.x = clientX;
		swatch.y = clientY;
	},
	pageClick: function(event) {
		var $display = achecker.$('achecker-colorSwatchVal'),
			color = $display.value;

		achecker.colorInspector.callback(color);
		achecker.colorInspector.stopInspect();

		event.preventDefault();
		event.stopPropagation();
	},
	getPixel : function(win, x, y) {
		var context = achecker.$('achecker-colorInspector').getContext("2d");
		context.drawWindow(win, x, y, 1, 1, "white");
		var data = context.getImageData(0, 0, 1, 1).data;
		return "rgb(" + data[0] + "," + data[1] + "," + data[2] + ")";
	},
};
