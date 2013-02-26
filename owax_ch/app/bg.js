/*jslint browser: true */
/*global chrome */
(function () {
  "use strict";

  var ctx = document.createElement('canvas'), img = new Image();
  ctx.width = '101';
  ctx.height = '101';
  ctx = ctx.getContext('2d');
  var cPRange = 1;

  chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.getSelected(null, function (tab) {
      if (tab.url.indexOf('http') !== 0 && tab.url.indexOf('https')) {
        window.alert('You can check following schemas only: "http://", "https://"');
        return;
      }

      var isIncludeFrame = window.localStorage.isIncludeFrame !== 'false';
      chrome.tabs.sendMessage(tab.id, {
        action: 'execute_' + (isIncludeFrame
          ? 'with_frames'
          : 'without_frames')
      }, function (enabled) {
      });
    });
  });

  function pickColor2(request) {
    var pixels, x = request.x, y = request.y, xS1, yS1, xS2, yS2, r = (cPRange - 1) / 2, pixel = [0, 0, 0],
      n, m;

    xS1 = x - (x - r < 0 ? x : r);
    yS1 = y - (y - r < 0 ? y : r);
    xS2 = cPRange - (x <= r ? r - x : 0) - (x + r > request.win[0] ? r - request.win[0] + x + 1 : 0);
    yS2 = cPRange - (y <= r ? r - y : 0) - (y + r > request.win[1] ? r - request.win[1] + y + 1 : 0);

    ctx.drawImage(img, xS1, yS1, xS2, yS2, 0, 0, xS2, yS2);
    pixels = ctx.getImageData(0, 0, xS2, yS2).data;
    for (n = 0, m = pixels.length; n < m; n += 4) {
      pixel[0] += pixels[n];
      pixel[1] += pixels[n + 1];
      pixel[2] += pixels[n + 2];
    }
    pixel[0] = Math.round(pixel[0] / m * 4);
    pixel[1] = Math.round(pixel[1] / m * 4);
    pixel[2] = Math.round(pixel[2] / m * 4);
    chrome.tabs.executeScript(null, {code: request.next + '(\'rgb(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ')\')'});
    request.callback(pixel);
  }

  function pickColor(request) {
    if (request.capture) {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
        img.onload = function () {
          pickColor2(request);
        };
        img.src = dataUrl;
        dataUrl = null;
      });
    } else {
      pickColor2(request);
    }
  }

  chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.x) {
      pickColor(request);
    }
  });
}());
