/*jshint browser: true */
/*global chrome */

chrome.action.onClicked.addListener(function () {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    const tab = tabs[0];
    if (tab.url.indexOf('http') !== 0 && tab.url.indexOf('https')) {
      window.alert('You can check following schemas only: "http://", "https://"');
      return;
    }

    var isIncludeFrame = window.localStorage.isIncludeFrame !== 'false';
    chrome.tabs.sendMessage(tab.id, {
      action: 'execute_' + (isIncludeFrame ? 'with_frames' : 'without_frames')
    }, function (enabled) {
    });
  });
});
