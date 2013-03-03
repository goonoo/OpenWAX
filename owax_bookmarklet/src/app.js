/*jslint browser: true */
/*global achecker */
(function (g) {
  "use strict";

  g.achecker = g.achecker || {};
  g.achecker.showOverlay = function () {
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
  g.achecker.hideOverlay = function () {
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
        message: 'You cannot check this page.',
        text_message: 'You cannot check this page.'
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
        message: '<p>' + g.achecker.i18n.get("CannotCheckFrameset") + '</p>' + msg,
        text_message: g.achecker.i18n.get("CannotCheckFrameset")
      };
    }

    var resultEl = rdoc.createElement("div");
    resultEl.id = "achecker-result";
    rdoc.documentElement.className += " achecker-included";

    var res = g.achecker.Pajet.run(cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls);
    var header = res.header;
    var sections = res.sections;
    var score = g.achecker.Pajet.scoreAsElement(cwin, rdoc, sections);

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

  var execute = function (isIncludeFrame) {
    if (!document.getElementById("achecker-css")) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.id = "achecker-css";
      css.href = "http://openwax.miya.pe.kr/c/bookmarklet.css";
      document.getElementsByTagName("head")[0].appendChild(css);
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

  var result = execute();
  if (result.err) {
    window.alert(result.text_message);
  }
}(window));
