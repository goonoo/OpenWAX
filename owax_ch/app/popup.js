/*jshint browser: true */
/*global chrome */
chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
  "use strict";

  const tab = tabs[0];
  if (tab.url.indexOf('http') !== 0 && tab.url.indexOf('https')) {
    document.body.innerHTML = '<p>You can check following schemas only: "http://", "https://"</p>';
    document.body.className = 'result';
    return;
  }

  var isIncludeFrame = window.localStorage.isIncludeFrame != 'false';
  var allowLogging = window.localStorage.allowLogging;

  if (allowLogging === undefined) {
    allowLogging = window.localStorage.allowLogging = window.confirm(
        chrome.i18n.getMessage('AllowLogging')) ? 'true' : 'false';
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: 'execute_' + (isIncludeFrame ? 'with_frames' : 'without_frames'),
      allowLogging: allowLogging === 'true'
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
