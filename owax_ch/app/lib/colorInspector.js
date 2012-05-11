(function() {
achecker = window.achecker || {};
achecker.colorInspector = {
	inspecting: false,
	callback: null,
	doCapture: true,

	init: function() {
		var $swatch = document.createElement("div");
		$swatch.id = "achecker-colorSwatch";
		$swatch.style.display = "none";
		$swatch.style.position = "fixed";
		$swatch.style.zIndex = 10000000000000001;
		$swatch.style.padding = "3px 5px";
		$swatch.style.border = "solid 1px #333";
		$swatch.style.borderRadius = "3px";
		$swatch.style.color = "#000";
		$swatch.style.font = "13px/1.2 Verdana, sans-serif";
		$swatch.style.backgroundColor = "#fff";
		document.body.appendChild($swatch);
		achecker.colorInspector.$swatch = document.getElementById("achecker-colorSwatch");

		window.addEventListener('resize', function() {
			achecker.colorInspector.doCapture=true;
		}, true);
		window.addEventListener('scroll', function() {
			achecker.colorInspector.doCapture=true;
		}, true);
	},
	startInspect: function(callback) {
		if (!document.getElementById("achecker-colorSwatch")) {
			achecker.colorInspector.init();
		};

		achecker.colorInspector.callback = callback;
		achecker.colorInspector.inspecting = true;
		achecker.colorInspector.overrideCursor();
		achecker.colorInspector._addInspectListeners();
		achecker.colorInspector.openSwatch();
	},
	stopInspect: function() {
		achecker.colorInspector.callback = null;
		achecker.colorInspector.inspecting = false;
		achecker.colorInspector.undoCursor();
		achecker.colorInspector._removeInspectListeners();
		achecker.colorInspector.hideSwatch();
	},
	openSwatch: function() {
		achecker.colorInspector.$swatch.style.display = "block";
	},
	hideSwatch: function() {
		achecker.colorInspector.$swatch.style.display = "none";
	},
	overrideCursor: function() {
		document.body.className += ' achecker-colorInspecting';
	},
	undoCursor: function() {
		document.body.className = document.body.className.replace(' achecker-colorInspecting', '');
	},
	onMouseMove: function(e) {
	    e.preventDefault();
	    e.stopPropagation();

		var pageX = e.clientX + window.scrollX;
		var pageY = e.clientY + window.scrollY;
		chrome.extension.sendRequest({
			capture:achecker.colorInspector.doCapture,
			x:e.clientX,
			y:e.clientY,
			win:[window.innerWidth,window.innerHeight],
			next:'achecker.colorInspector.onMouseMovePick'
		});
		achecker.colorInspector.doCapture = false;

		var $swatch = achecker.colorInspector.$swatch;
		$swatch.style.left = (e.clientX + 5) +"px";
		$swatch.style.top = (e.clientY + 6) +"px";
	},
	onMouseMovePick: function(color) {
		color = achecker.rainbowColor.toHex(color);
		achecker.colorInspector.changeColor(color);
	},
	pageClick: function(e) {
		var $swatch = achecker.colorInspector.$swatch,
				color = $swatch.textContent;

		achecker.colorInspector.callback(color);
		achecker.colorInspector.stopInspect();

		e.preventDefault();
		e.stopPropagation();
	},
	changeColor: function(color, show) {
		var $swatch = achecker.colorInspector.$swatch;
		var blackText = achecker.rainbowColor.blackText(color);
		$swatch.style.backgroundColor = color;
		$swatch.style.color = blackText ? 'black' : 'white';
		$swatch.textContent = achecker.rainbowColor.toHex(color);
	},
	onMouseUp: function(e) {
		e.stopPropagation(); e.preventDefault();
		chrome.extension.sendRequest({
			capture:achecker.colorInspector.doCapture,
			x:e.clientX,
			y:e.clientY,
			win:[window.innerWidth,window.innerHeight],
			next:'achecker.colorInspector.onMouseUpPick'
		});
		achecker.colorInspector.doCapture = false;
	},
	onMouseUpPick: function(color) {
		color = achecker.rainbowColor.toHex(color);
		achecker.colorInspector.callback(color);
		achecker.colorInspector.stopInspect();
	},
	_addInspectListeners: function() {
		window.addEventListener("mousemove", achecker.colorInspector.onMouseMove, true);
		window.addEventListener("mouseup", achecker.colorInspector.onMouseUp, true);
	},
	_removeInspectListeners: function() {
		window.removeEventListener("mousemove", achecker.colorInspector.onMouseMove, true);
		window.removeEventListener("mouseup", achecker.colorInspector.onMouseUp, true);
	},
};
})();
