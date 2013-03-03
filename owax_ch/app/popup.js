/*jshint browser: true */
/*global chrome */
chrome.tabs.getSelected(null, function (tab) {
  "use strict";

	if (tab.url.indexOf('http') !== 0 && tab.url.indexOf('https')) {
		document.body.innerHTML = '<p>You can check following schemas only: "http://", "https://"</p>';
		document.body.className = 'result';
		return;
	}

	var isIncludeFrame = window.localStorage.isIncludeFrame != 'false';
	chrome.tabs.sendMessage(
    tab.id,
    {
			action: 'execute_' + (isIncludeFrame ? 'with_frames' : 'without_frames')
    },
    function (res) {
      if (res && res.err && res.message) {
        document.body.innerHTML = res.message;
        document.body.className = 'result';
      } else {
        window.close();
      }
      return;
    }
  );
});
