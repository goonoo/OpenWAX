/*jslint browser: true */
/*global chrome */
(function (global, document) {
  "use strict";

  var achecker = global.achecker || {};
  achecker.showOverlay = function () {
    if (document.getElementById("_acheckeroverlay")) {
      document.getElementById("_acheckeroverlay").style.display = "block";
      return;
    }

    var $overlay = document.createElement('div');
    $overlay.id = '_acheckeroverlay';
    $overlay.style.display = 'block';
    $overlay.style.zIndex = '99999999';
    $overlay.style.position = 'fixed';
    $overlay.style.top = '0';
    $overlay.style.right = '0';
    $overlay.style.bottom = '0';
    $overlay.style.left = '400px';
    $overlay.style.backgroundColor = '#fff';
    $overlay.style.opacity = '0.01';
    document.body.appendChild($overlay);
  };
  achecker.hideOverlay = function () {
    if (document.getElementById("_acheckeroverlay")) {
      document.getElementById("_acheckeroverlay").style.display = "none";
    }
  };

  var isLoading = false;

  var runAchecker = function (isIncludeFrame, allowLogging) {
    var frameDocs = [], discardFrameUrls = [], i, l;

    if (isIncludeFrame) {
      for (i = 0, l = document.getElementsByTagName("iframe").length; i < l; i++) {
        var f = document.getElementsByTagName("iframe")[i];
        if (f.src && f.contentDocument) {
          frameDocs.push({
            src: f.src,
            doc: f.contentDocument
          });
        } else if (f.src) {
          discardFrameUrls.push(f.src);
        }
      }
    }

    var cwin = global;
    var rdoc = document;

    if (!frameDocs.length && !cwin.document.documentElement) {
      return {
        err: true,
        message: 'You cannot check this page.'
      };
    }
    if (cwin.document.getElementsByTagName("frameset").length > 0) {
      var frames = cwin.document.getElementsByTagName("frame"), frameUrls = [], msg = '<ul>';

      for (i = 0, l = frames.length; i < l; i++) {
        if (frames[i].src.indexOf('http') > -1) {
          msg += '<li><a href="' + frames[i].src + '" target="_blank"">' + frames[i].src + '</a></li>';
        }
      }
      msg += '</ul>';

      return {
        err: true,
        message: '<p>' + achecker.i18n.get("CannotCheckFrameset") + '</p>' + msg
      };
    }

    var resultEl = rdoc.createElement("div");
    resultEl.id = "achecker-result";
    rdoc.documentElement.className += " achecker-included";

    var res = achecker.Wax.run(cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls);
    var header = res.header;
    var sections = res.sections;
    var score = achecker.Wax.scoreAsElement(cwin, rdoc, sections, allowLogging);

    resultEl.appendChild(score);
    resultEl.appendChild(header);
    for (i in sections) {
      if (sections.hasOwnProperty(i)) {
        resultEl.appendChild(sections[i].getAsElement());
      }
    }

    rdoc.body.appendChild(resultEl);
    return {
      err: false
    };
  };

  var execute = function (isIncludeFrame, allowLogging) {
    if (document.getElementById("achecker-result")) {
      document.body.removeChild(document.getElementById("achecker-result"));
      document.documentElement.className = document.documentElement.className.replace(/ achecker\-included/, '');
      return {
        err: false
      };
    }
    var res = runAchecker(isIncludeFrame, allowLogging);
    return res;
  };

  chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    var res;
    if (request.action === 'execute_with_frames') {
      res = execute(true, request.allowLogging);
    } else if (request.action === 'execute_without_frames') {
      res = execute(false, request.allowLogging);
    } else {
      res = {
        err: true,
        message: '<p>Undefined Method</p>'
      };
    }
    sendResponse(res);
  });
}(this, this.document));
