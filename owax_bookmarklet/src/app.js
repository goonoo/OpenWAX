/*jslint browser: true */
/*global achecker */
(function () {
  "use strict";

  window.achecker = window.achecker || {};
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

  var runAchecker = function (isIncludeFrame) {
    var frameDocs = [];
    var discardFrameUrls = [];
    var i, l;

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

    var cwin = window;
    var rdoc = document;

    if (!frameDocs.length && !cwin.document.documentElement) {
      return {
        err: true,
        message: 'You cannot check this page.'
      };
    }
    if (cwin.document.getElementsByTagName("frameset").length > 0) {
      var frames = cwin.document.getElementsByTagName("frame"),
        frameUrls = [];
      var msg = '<ul>';
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

    var res = achecker.Pajet.run(cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls);
    var header = res.header;
    var sections = res.sections;

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

  var execute = function (isIncludeFrame) {
    if (!document.getElementById("achecker-css")) {
      document.getElementsByTagName("head")[0].innerHTML +=
          '<link rel="stylesheet" id="achecker-css" href="http://openwax.miya.pe.kr/c/bookmarklet.css" />';
    }

    if (document.getElementById("achecker-result")) {
      document.body.removeChild(document.getElementById("achecker-result"));
      document.documentElement.className = document.documentElement.className.replace(/ achecker\-included/, '');
      return {
        err: false
      };
    }
    var res = runAchecker(isIncludeFrame);
    return res;
  };

  execute();
}());
