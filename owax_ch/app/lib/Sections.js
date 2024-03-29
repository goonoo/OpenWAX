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

/*jslint browser: true */
/*global chrome, Components, openDialog, XMLHttpRequest, FormData */

(function (g, document) {
  "use strict";

  if (!g.achecker) {
    g.achecker = {};
  }
  if (!g.achecker.Wax) {
    g.achecker.Wax = {};
  }
  var addEvent = function (obj, type, fn) {
    if (obj.addEventListener) {
      obj.addEventListener(type, fn, false);
    } else if (obj.attachEvent) {
      obj["e" + type + fn] = fn;
      obj[type + fn] = function () {
        obj["e" + type + fn](g.event);
      };
      obj.attachEvent("on" + type, obj[type + fn]);
    }
  };
  var ListSection = g.achecker.Wax.ListSection;
  var TableSection = g.achecker.Wax.TableSection;
  var ToolSection = g.achecker.Wax.ToolSection;
  var getElsFromChildNodes = function (pEl, tagName) {
    var els = [], i = 0;
    if (pEl.length && pEl.push) {
      for (i = 0; i < pEl.length; i++) {
        els = els.concat(getElsFromChildNodes(pEl[i], tagName));
      }
      return els;
    }
    var n = pEl.childNodes;
    if (n && n.length) {
      for (i = 0; i < n.length; i++) {
        if (n[i].tagName && n[i].tagName.toLowerCase() === tagName.toLowerCase()) {
          els.push(n[i]);
        }
      }
      return els;
    }
    return [];
  };
  var toggleFoldedClass = function (el) {
    el.className = el.className === 'folded' ? '' : 'folded';

    // fix bug: IE8 won't reflow when set data-* attribute
    if (document && document.all) {
      document.body.className = document.body.getAttribute('className');
    }
  };

  var getContrastRatio = function (color1, color2) {
    var l1; // higher value
    var l2; // lower value
    var contrast;
    var l1R, l1G, l1B, l2R, l2G, l2B;

    // error check, check if pound sign was put in field value
    if (color2.indexOf('#') === 0) {
      color2 = color2.substr(1, color2.length - 1);
    }
    if (color1.indexOf('#') === 0) {
      color1 = color1.substr(1, color1.length - 1);
    }

    //Linearised R (for example) = (R/FS)^2.2 where FS is full scale value (255
    //for 8 bit color channels). L1 is the higher value (of text or background)
    //alert(parseInt("0x"+color1.substr(0, 2)));
    //Math.pow(n,x);
    l1R = parseInt(color1.substr(0, 2), 16) / 255;
    if (l1R <= 0.03928) {
      l1R = l1R / 12.92;
    } else {
      l1R = Math.pow(((l1R + 0.055) / 1.055), 2.4);
    }
    l1G = parseInt(color1.substr(2, 2), 16) / 255;
    if (l1G <= 0.03928) {
      l1G = l1G / 12.92;
    } else {
      l1G = Math.pow(((l1G + 0.055) / 1.055), 2.4);
    }
    l1B = parseInt(color1.substr(4, 2), 16) / 255;
    if (l1B <= 0.03928) {
      l1B = l1B / 12.92;
    } else {
      l1B = Math.pow(((l1B + 0.055) / 1.055), 2.4);
    }
    l2R = parseInt(color2.substr(0, 2), 16) / 255;
    if (l2R <= 0.03928) {
      l2R = l2R / 12.92;
    } else {
      l2R = Math.pow(((l2R + 0.055) / 1.055), 2.4);
    }
    l2G = parseInt(color2.substr(2, 2), 16) / 255;
    if (l2G <= 0.03928) {
      l2G = l2G / 12.92;
    } else {
      l2G = Math.pow(((l2G + 0.055) / 1.055), 2.4);
    }
    l2B = parseInt(color2.substr(4, 2), 16) / 255;
    if (l2B <= 0.03928) {
      l2B = l2B / 12.92;
    } else {
      l2B = Math.pow(((l2B + 0.055) / 1.055), 2.4);
    }
    //where L is luminosity and is defined as
    l1 = (0.2126 * l1R) + (0.7152 * l1G) + (0.0722 * l1B); //using linearised R, G, and B value
    l2 = (0.2126 * l2R) + (0.7152 * l2G) + (0.0722 * l2B); //using linearised R, G, and B value
    //and L2 is the lower value.
    l1 = l1 + 0.05;
    l2 = l2 + 0.05;
    if (l1 < l2) {
      var temp = l1;
      l1 = l2;
      l2 = temp;
    }
    l1 = l1 / l2;
    l1 = l1.toFixed(1);
    return l1;
  };

  var getLabelText = function (el) {
    var ELEMENT_NODE = 1;
    var txt = '';
    var nodeType = el.nodeType;
    var tagName = el.tagName ? el.tagName.toUpperCase() : '';
    var attrType = el.getAttribute ? el.getAttribute('type') : '';
    var styleDisplay;

    try {
      var computedStyle = el.currentStyle || el.ownerDocument.defaultView.getComputedStyle(el, null);
      styleDisplay = computedStyle.display;
    } catch (e) {
      styleDisplay = "";
    }

    if (nodeType === ELEMENT_NODE &&
        styleDisplay === 'none') {
      txt += '[__[';
    }

    if (nodeType === ELEMENT_NODE &&
        tagName === "IMG") {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "AREA") {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT" &&
        attrType === 'image') {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT" &&
        (attrType === 'submit' ||
          attrType === 'reset' ||
          attrType === 'button')) {
      txt += el.value;
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT") {
      txt += '';
    } else if (nodeType === ELEMENT_NODE &&
        (tagName === "TEXTAREA" || tagName === "SELECT")) {
      txt += '';
    } else if (nodeType !== ELEMENT_NODE ||
        (tagName !== "SCRIPT" && tagName !== "STYLE")) {
      var cNodes = el.childNodes;
      var TEXT_NODE = 3;
      var i, l;
      for (i = 0, l = cNodes.length; i < l; i++) {
        if (cNodes[i].nodeType === TEXT_NODE) {
          txt += cNodes[i].nodeValue;
        } else {
          txt += getLabelText(cNodes[i]);
        }
      }
    }

    if (nodeType === ELEMENT_NODE &&
        styleDisplay === 'none') {
      txt += ']__]';
    }
    txt = txt ? txt.replace(/^\s+/, '').replace(/\s+$/, '') : '';
    return txt;
  };

  var getLabel = function (element) {
    var currentLabel = "";
    var currentLabelElement;
    var doc = element.ownerDocument;
    var labelElement, labelChilds, i, l, _i, _l;

labelLoop:
    for (i = 0, l = doc.getElementsByTagName("label").length; i < l; i++) {
      labelElement = doc.getElementsByTagName("label")[i];
      labelChilds = labelElement.childNodes;

      if (labelElement.htmlFor && labelElement.htmlFor === element.id) {
        currentLabelElement = labelElement;
        break labelLoop;
      }
      for (_i = 0, _l = labelChilds.length; _i < _l; _i++) {
        if (labelChilds[_i] === element) {
          currentLabelElement = labelElement;
          break labelLoop;
        }
      }
    }

    if (currentLabelElement) {
      currentLabel = currentLabelElement.innerText;
    }
    if (!currentLabel) {
      if (element.title) {
        currentLabel = element.title;
      } else if (element.id) {
        currentLabel = element.id;
      } else if (element.name) {
        currentLabel = element.name;
      } else {
        currentLabel = "";
      }
    }
    return currentLabel;
  };

  var getTextContent = function (el) {
    var ELEMENT_NODE = 1;
    var txt = '';
    var nodeType = el.nodeType;
    var tagName = el.tagName ? el.tagName.toUpperCase() : '';
    var attrType = el.getAttribute ? el.getAttribute('type') : '';
    var styleDisplay;

    try {
      var computedStyle = el.currentStyle || el.ownerDocument.defaultView.getComputedStyle(el, null);
      styleDisplay = computedStyle.display;
    } catch (e) {
      styleDisplay = "";
    }

    if (nodeType === ELEMENT_NODE &&
        styleDisplay === 'none') {
      txt += '[__[';
    }

    if (nodeType === ELEMENT_NODE &&
        tagName === "IMG") {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "AREA") {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT" &&
        attrType === 'image') {
      txt += el.getAttribute('alt');
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT" &&
        (attrType === 'submit' ||
          attrType === 'reset' ||
          attrType === 'button')) {
      txt += el.value;
    } else if (nodeType === ELEMENT_NODE &&
        tagName === "INPUT") {
      txt += getLabel(el);
    } else if (nodeType === ELEMENT_NODE &&
        (tagName === "TEXTAREA" || tagName === "SELECT")) {
      txt += getLabel(el);
    } else if (nodeType !== ELEMENT_NODE ||
        (tagName !== "SCRIPT" && tagName !== "STYLE")) {
      var cNodes = el.childNodes;
      var TEXT_NODE = 3;
      var i, l;
      for (i = 0, l = cNodes.length; i < l; i++) {
        if (cNodes[i].nodeType === TEXT_NODE) {
          txt += cNodes[i].nodeValue;
        } else {
          txt += getTextContent(cNodes[i]);
        }
      }
    }

    if (nodeType === ELEMENT_NODE &&
        styleDisplay === 'none') {
      txt += ']__]';
    }
    txt = txt ? txt.replace(/^\s+/, '').replace(/\s+$/, '') : '';
    return txt;
  };

  var getAbsolutePath = function (src, url, doc) {
    var newpath, orgPath;
    var baseHref = (function () {
      if (!doc.getElementsByTagName("base").length) {
        return null;
      }

      var baseEl = doc.getElementsByTagName("base")[0];
      return baseEl.href || null;
    }());

    if (baseHref) {
      url = baseHref;
    }

    // remove url querystring
    url = url.replace(/\?.*$/, '');

    if (src && src.indexOf('//') === -1) {
      if (src.substr(0, 3) === '../') {
        newpath = url.substr(0, url.lastIndexOf('/') > 10 ? url.lastIndexOf('/') : url.length);
        while (src.substr(0, 3) === '../') {
          newpath = newpath.substr(0, newpath.lastIndexOf('/') > 10 ? newpath.lastIndexOf('/') : newpath.length);
          src = src.substr(3);
        }
        src = newpath + '/' + src;
      } else if (src.substr(0, 1) === '/') {
        orgPath = url.replace(/^((?:https?\:\/\/|file\:\/\/\/)[^\/]+)\/.*$/, '$1');
        src = orgPath + src;
      } else {
        orgPath = url.substr(0, url.lastIndexOf('/'));
        src = orgPath + '/' + src;
      }
    }
    return src;
  };

  g.achecker.Wax.run = function (cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls) {
    var isIEQuirksMode = rdoc && rdoc.compatMode === "BackCompat" && rdoc.documentMode;

    if (!rdoc.querySelectorAll) {
      // IE7 support for querySelectorAll in 274 bytes. Supports multiple / grouped selectors and the attribute selector
      // with a "for" attribute. http://www.codecouch.com/
      (function (d, s) {d = rdoc, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) {a = d.all, c = [], r = r.replace(/\[for\b/gi, '[htmlFor').split(','); for (i = r.length; i--;) {s.addRule(r[i], 'k:v'); for (j = a.length;j--;) {a[j].currentStyle.k && c.push(a[j]); } s.removeRule(0); } return c; }; })();
    }

    return {
      header: (function () {
        var $div = rdoc.createElement('div');
        $div.className = 'waxFrames';

        var $fold = rdoc.createElement('div');
        var $foldBtn = rdoc.createElement('button');

        $fold.className = 'toggleAll';
        $foldBtn.className = 'fold';
        $foldBtn.setAttribute('data-folded', 'folded');
        $foldBtn.title = g.achecker.i18n.get('UnfoldAll');
        $foldBtn.setAttribute('type', 'button');
        $foldBtn.innerText = 'Toggle All';
        $foldBtn.textContent = 'Toggle All';
        $foldBtn.onclick = function () {
          var $headings = rdoc.querySelectorAll('.waxSection h2,.waxFrames h2');
          var foldedClass = this.getAttribute('data-folded') === 'folded' ? '' : 'folded';
          var i, l;

          for (i = 0, l = $headings.length; i < l; i++) {
            $headings[i].className = $headings[i].className.replace('folded', '') + ' ' + foldedClass;
          }

          if (foldedClass) {
            this.className = 'unfold';
            this.title = g.achecker.i18n.get('UnfoldAll');
          } else {
            this.className = 'fold';
            this.title = g.achecker.i18n.get('FoldAll');
          }
          this.setAttribute('data-folded', foldedClass);
          // fix bug: IE8 won't reflow when set data-* attribute
          rdoc.body.className = rdoc.body.getAttribute("className");
        };
        $fold.appendChild($foldBtn);
        $div.appendChild($fold);

        var $title = rdoc.createElement('h2');
        $title.className = '';
        $title.innerText = g.achecker.i18n.get('TargetPage');
        $title.textContent = g.achecker.i18n.get('TargetPage');
        addEvent($title, 'click', function (e) {
          toggleFoldedClass(this);
        });
        var $pages = rdoc.createElement('ul'), $pageLink;
        var $topPage = rdoc.createElement('li');
        var $topPageLink = rdoc.createElement('a');
        var i, l, $page;

        $topPageLink.setAttribute('href', cwin.location.href);
        $topPageLink.setAttribute('target', '_blank');
        $topPageLink.innerText = cwin.location.href;
        $topPageLink.textContent = cwin.location.href;
        $topPage.appendChild($topPageLink);
        $pages.appendChild($topPage);
        if (isIncludeFrame) {
          for (i = 0, l = frameDocs.length; i < l; i++) {
            $page = rdoc.createElement('li');
            $pageLink = rdoc.createElement('a');
            $pageLink.setAttribute('href', frameDocs[i].src);
            $pageLink.setAttribute('target', '_blank');
            $pageLink.innerText = frameDocs[i].src;
            $pageLink.textContent = frameDocs[i].src;
            $page.appendChild($pageLink);
            $pages.appendChild($page);
          }
        }
        $div.appendChild($title);
        $div.appendChild($pages);

        if (discardFrameUrls && discardFrameUrls.length) {
          $title = rdoc.createElement('h2');
          $title.innerText = g.achecker.i18n.get('NoneTargetPage');
          $title.textContent = g.achecker.i18n.get('NoneTargetPage');
          $title.className = 'folded';
          addEvent($title, 'click', function (e) {
            toggleFoldedClass(this);
          });
          $pages = rdoc.createElement('ul');
          for (i = 0, l = discardFrameUrls.length; i < l; i++) {
            $page = rdoc.createElement('li');
            $pageLink = rdoc.createElement('a');
            $pageLink.setAttribute('href', discardFrameUrls[i]);
            $pageLink.setAttribute('target', '_blank');
            $pageLink.innerText = discardFrameUrls[i];
            $pageLink.textContent = discardFrameUrls[i];
            $page.appendChild($pageLink);
            $pages.appendChild($page);
          }
        }
        $div.appendChild($title);
        $div.appendChild($pages);
        return $div;
      }()),
      sections: {
        altText: new TableSection(
          cwin,
          rdoc,
          '1. ' + g.achecker.i18n.get('No1') + ' (img)',
          'input[type=image],img,area',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Preview'), width: 106},
            {label: g.achecker.i18n.get('Element'), width: 45},
            {label: g.achecker.i18n.get('Contents')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function (doc, url) {
            var tagName = this.tagName.toLowerCase();
            var data = {
              hidden: '',
              preview: '',
              el: '',
              alt: ''
            };
            var self = this;

            var handleImg = function () {
              var hasAlt = isIEQuirksMode && self.outerHTML ? self.outerHTML.toLowerCase().indexOf("alt=") > 0 : self.getAttribute('alt') !== null;
              data.alt = rdoc.createElement('span');
              if (!hasAlt) {
                data.alt.innerText = 'alt ' + g.achecker.i18n.get('Undefined');
                data.alt.textContent = 'alt ' + g.achecker.i18n.get('Undefined');
              } else if (!self.getAttribute('alt')) {
                data.alt.innerText = 'alt=""';
                data.alt.textContent = 'alt=""';
              } else {
                data.alt.innerText = self.getAttribute('alt');
                data.alt.textContent = self.getAttribute('alt');
              }
              data.el = tagName;

              if (self.getAttribute('longdesc')) {
                var $longdesc = rdoc.createElement('a');
                $longdesc.setAttribute('href',
                  getAbsolutePath(self.getAttribute('longdesc'), url, doc));
                $longdesc.setAttribute('target', '_blank');
                $longdesc.innerText = 'longdesc link';
                $longdesc.textContent = 'longdesc link';
                data.alt.innerText += ' ';
                data.alt.textContent += ' ';
                data.alt.appendChild($longdesc);
              }

              var src = self.getAttribute('src');

              var $container = rdoc.createElement('div');
              $container.style.width = "100px";
              $container.style.margin = "0 auto";
              $container.style.overflow = "hidden";
              var $img = rdoc.createElement('img');
              $img.setAttribute('alt', '');
              $img.setAttribute('src', getAbsolutePath(src, url, doc));
              $container.appendChild($img);
              data.preview = $container;

              return [
                data.hidden,
                data.preview,
                data.el,
                data.alt
              ];
            };

            switch (tagName) {
            case "input":
              if (this.type.toLowerCase() !== 'image') {
                break;
              }
              return handleImg();

            case "img":
              return handleImg();

            case "area":
              var hasAlt = isIEQuirksMode && this.outerHTML ? this.outerHTML.toLowerCase().indexOf("alt=") > 0 : this.getAttribute('alt') !== null;
              data.alt = rdoc.createElement('span');
              if (!hasAlt) {
                data.alt.innerText = 'alt ' + g.achecker.i18n.get('Undefined');
                data.alt.textContent = 'alt ' + g.achecker.i18n.get('Undefined');
              } else if (!this.getAttribute('alt')) {
                data.alt.innerText = 'alt=""';
                data.alt.textContent = 'alt=""';
              } else {
                data.alt.innerText = this.getAttribute('alt');
                data.alt.textContent = this.getAttribute('alt');
              }
              data.el = tagName;

              return [
                data.hidden,
                data.preview,
                data.el,
                data.alt
              ];
            }

            return false;
          },
          function () {
            var tagName = this.tagName;
            switch (tagName) {
            case "IMG":
            case "INPUT":
            case "AREA":
              var hasAlt = isIEQuirksMode && this.outerHTML ? this.outerHTML.toLowerCase().indexOf("alt=") > 0 : this.getAttribute('alt') !== null;

              if (!hasAlt) {
                return 'fail';
              }
              if (!this.getAttribute('alt')) {
                return 'warning';
              }
              return 'pass';
            }
          }
        ),

        altTextBG: new TableSection(
          cwin,
          rdoc,
          '1. ' + g.achecker.i18n.get('No1') + ' (bg)',
          'body *',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Preview'), width: 106},
            {label: g.achecker.i18n.get('Contents')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function (doc, url) {
            var data = {
              hidden: '',
              preview: '',
              content: ''
            };
            var computedStyle = this.currentStyle || cwin.getComputedStyle(this, null);
            var bgImage = computedStyle.backgroundImage;
            if (bgImage !== 'none') {
              var $bg = rdoc.createElement('span');
              var w, h;
              url = bgImage.replace(/^url\("?/, '').replace(/"?\)$/, '');

              try {
                $bg.style.backgroundImage = bgImage;
                $bg.style.backgroundPosition = computedStyle.backgroundPosition;
                $bg.style.backgroundRepeat = computedStyle.backgroundRepeat;
                w = parseInt(computedStyle.width, 10);
                h = parseInt(computedStyle.height, 10);
                $bg.style.width = computedStyle.width;
                $bg.style.height = computedStyle.height;
              } catch (e) {
              }
              $bg.style.maxWidth = '100px';
              $bg.style.maxHeight = '200px';
              if (w > 100 && h > 200) {
                $bg.style.backgroundSize = 'cover';
              }
              $bg.style.display = 'inline-block';
              $bg.style.overflow = 'hidden';

              data.preview = $bg;
              data.content = getTextContent(this);

              if (data.content.length > 100) {
                data.content = data.content.substr(0, 100) + '...';
              }

              return [
                data.hidden,
                data.preview,
                data.content
              ];
            }

            return false;
          }
        ),

        altTextEmbed: new TableSection(
          cwin,
          rdoc,
          '1. ' + g.achecker.i18n.get('No1') + ' (object)',
          'object,embed,video,audio,canvas,svg',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Element')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function (doc, url) {
            var tagName = this.tagName;
            switch (tagName) {
            case "OBJECT":
              if (this.parentNode && this.parentNode.tagName &&
                  (this.parentNode.tagName === 'OBJECT' ||
                    this.parentNode.tagName === 'EMBED')) {
                return false;
              }
              return [
                '',
                '<object>'
              ];
            case "EMBED":
              if (this.parentNode && this.parentNode.tagName &&
                  (this.parentNode.tagName === 'OBJECT' ||
                    this.parentNode.tagName === 'EMBED')) {
                return false;
              }
              return [
                '',
                '<embed>'
              ];
            }

            return false;
          }
        ),

        grayscale: new ToolSection(
          cwin,
          rdoc,
          'grayscale',
          '3. ' + g.achecker.i18n.get('No3'),
          function (win, rdoc) {
            var $ul = rdoc.createElement('ul');
            $ul.className = 'grayscale';
            var $tool = rdoc.createElement('li');
            var $tool_btn = rdoc.createElement('button');
            $tool_btn.innerText = g.achecker.i18n.get('ToggleGrayscale');
            $tool_btn.textContent = g.achecker.i18n.get('ToggleGrayscale');
            $tool_btn.onclick = function () {
              var is_on = $tool_btn.getAttribute('data-on') === '1';
              var el = cwin.document.getElementsByTagName("html")[0];
              if (is_on) {
                el.style.webkitFilter = '';
                el.style.mozFilter = '';
                el.style.filter = '';
                $tool_btn.setAttribute('data-on', '');
              } else {
                el.style.webkitFilter = 'grayscale(100%)';
                el.style.mozFilter = 'grayscale(100%)';
                el.style.filter = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'grayscale\'><feColorMatrix type=\'matrix\' values=\'0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\'/></filter></svg>#grayscale")'; // FF 3.5+
                el.style.filter = 'gray'; // IE
                $tool_btn.setAttribute('data-on', '1');
              }
            };

            $tool.appendChild($tool_btn);
            $ul.appendChild($tool);

            return $ul;
          }
        ),

        kbdFocus: new TableSection(
          cwin,
          rdoc,
          '8. ' + g.achecker.i18n.get('No8'),
          '*',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('ErrorType'), width: 65},
            {label: g.achecker.i18n.get('Contents')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('RequireConfirmation'),
          function (doc, url) {
            try {
              var evtWrapper = this.wrappedJSObject || this;
              var hasBlurEvent = false;
              if (evtWrapper.onfocus && evtWrapper.onfocus.toString().indexOf('blur()') > -1) {
                hasBlurEvent = true;
              } else if (evtWrapper.onclick && evtWrapper.onclick.toString().indexOf('blur()') > -1) {
                hasBlurEvent = true;
              }
              var outlineWidth = this.style.getPropertyValue('outline-width');
              var zeroOutlineWidth = outlineWidth === '0' || outlineWidth === '0pt' || outlineWidth === '0px';

              if (hasBlurEvent) {
                return [
                  '',
                  'blur()',
                  getTextContent(this)
                ];
              }
              if (zeroOutlineWidth) {
                return [
                  '',
                  'outline:0',
                  getTextContent(this)
                ];
              }
              return false;
            } catch (e) {
              return false;
            }
          },
          function (doc, url) {
            try {
              var evtWrapper = this.wrappedJSObject || this;
              var hasBlurEvent = evtWrapper.onfocus ?
                  evtWrapper.onfocus.toString().indexOf('blur()') > -1 : false;
              var outlineWidth = this.style.getPropertyValue('outline-width');
              var zeroOutlineWidth = outlineWidth === '0' || outlineWidth === '0pt' || outlineWidth === '0px';

              if (hasBlurEvent) {
                return 'fail';
              }
              if (zeroOutlineWidth) {
                return 'fail';
              }
              return 'pass';
            } catch (e) {
              return false;
            }
          }
        ),

        skipNav: new TableSection(
          cwin,
          rdoc,
          '12. ' + g.achecker.i18n.get('No12'),
          'a[href^="#"]',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('No'), width: 65},
            {label: g.achecker.i18n.get('Contents')},
            {label: g.achecker.i18n.get('Connected'), width: 45}
          ],
          isIncludeFrame,
          frameDocs,
          '-',
          function (doc, url) {
            if (cwin.document !== doc) {
              return false;
            }

            var href = this.getAttribute('href');
            var isConnectedLink = href === '#' ? false :
                !!doc.getElementById(href.replace('#', '')) ||
                  doc.getElementsByName(href.replace('#', '')).length > 0;
            var linkIdx, i, l;

            for (i = 0, l = doc.getElementsByTagName('a').length; i < l; i++) {
              if (doc.getElementsByTagName('a')[i] === this) {
                linkIdx = i + 1;
                if (linkIdx > 20) {
                  return false;
                }

                break;
              }
            }

            return [
              '',
              linkIdx + g.achecker.i18n.get('ThLink'),
              '(' + href + ') ' + getTextContent(this),
              (isConnectedLink ? 'O' : 'X')
            ];
          },
          function (doc, url) {
            var href = this.getAttribute('href');
            var isConnectedLink = href === '#' ? false :
                !!doc.getElementById(href.replace('#', '')) ||
                  doc.getElementsByName(href.replace('#', '')).length > 0;
            return isConnectedLink ? 'pass' : 'fail';
          }
        ),

        pageTitle: new ListSection(
          cwin,
          rdoc,
          '13. ' + g.achecker.i18n.get('No13') + '(<title>)',
          'body',
          null,
          isIncludeFrame,
          frameDocs,
          '-',
          function (doc, url) {
            var $res = rdoc.createElement('span');
            var $val = rdoc.createElement('strong');
            var val = doc.title || g.achecker.i18n.get('NoPageTitle');

            $res.innerText = url + ': ';
            $res.textContent = url + ': ';
            $val.innerText = val;
            $val.textContent = val;
            $res.appendChild($val);

            return $res;
          },
          function (doc) {
            var title = doc.title || '';
            var dupCharacters = [
              '::', '||', '--', '@@', '##', '$$', '%%', '&&', '**', '((', '))', '++', '==', '~~',
              ';;', '<<', '>>', '[[', ']]', '★★', '☆☆', '◎◎', '●●', '◆◆', '◇◇', '□□', '■■', '△△',
              '▲▲', '▽▽', '▼▼', '◁◁', '◀◀', '▷▷', '▶▶', '♠♠', '♤♤', '♡♡', '♥♥', '♧♧', '♣♣', '⊙⊙',
              '◈◈', '▣▣', '◐◐', '◑◑', '▒▒', '▤▤', '▥▥', '▨▨', '▧▧', '▦▦', '▩▩', '♨♨', '☏☏', '☎☎'
            ];
            var hasTitle = !!title;
            var hasSpecialCharactersDup = false;
            for (var i = 0; i < dupCharacters.length; i++) {
              if (title.indexOf(dupCharacters[i]) > -1) {
                hasSpecialCharactersDup = true;
                break;
              }
            }

            return hasTitle && !hasSpecialCharactersDup ? 'pass' : 'fail';
          }
        ),

        frame: new TableSection(
          cwin,
          rdoc,
          '13. ' + g.achecker.i18n.get('No13') + '(frame)',
          'iframe',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Element'), width: 45},
            {label: g.achecker.i18n.get('Title'), minWidth: 50, className: 'lt'},
            {label: g.achecker.i18n.get('Contents'), maxWidth: 200}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function () {
            var data = {
              hidden: '',
              el: '',
              title: '',
              url: ''
            };
            var src = this.getAttribute('src');
            var title = this.getAttribute('title');
            data.el = 'iframe';

            if (src) {
              var $a = rdoc.createElement('a');
              $a.setAttribute('href', src);
              $a.setAttribute('target', '_blank');
              $a.innerText = src;
              $a.textContent = src;
              data.url = $a;
            } else {
              data.url = g.achecker.i18n.get('NoSrc');
            }
            data.title = title || g.achecker.i18n.get('NoTitle');
            return [
              data.hidden,
              data.el,
              data.title,
              data.url
            ];
          },
          function () {
            var title = this.getAttribute('title');
            return title ? 'pass' : 'fail';
          }
        ),

        blockTitle: new TableSection(
          cwin,
          rdoc,
          '13. ' + g.achecker.i18n.get('No13') + '(<h1>~<h6>)',
          'h1,h2,h3,h4,h5,h6',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Element'), width: 45},
            {label: g.achecker.i18n.get('Contents')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('RequireConfirmation'),
          function () {
            return [
              '',
              this.tagName.toLowerCase(),
              getTextContent(this)
            ];
          }
        ),

        linkText: new TableSection(
          cwin,
          rdoc,
          '14. ' + g.achecker.i18n.get('No14'),
          'a,area',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Element'), width: 45},
            {label: g.achecker.i18n.get('Contents')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function () {
            var href = this.getAttribute('href');
            var text = getTextContent(this);
            var title = this.getAttribute('title');

            return href ? [
              '',
              this.tagName.toLowerCase(),
              (text || '-') +
                (title ? ' (title: ' + title + ')' : '')
            ] : false;
          },
          function () {
            var text = getTextContent(this);

            return text ? 'pass' : 'fail';
          }
        ),

        pageLang: new ListSection(
          cwin,
          rdoc,
          '15. ' + g.achecker.i18n.get('No15'),
          'html',
          null,
          isIncludeFrame,
          frameDocs,
          '-',
          function (doc, url) {
            var isXhtml = this.getAttribute('xmlns');
            var val = '';
            var $res = rdoc.createElement('span');

            // ignore if protocol is not http(s)? or .html extension
            if (url.substr(0, 4).toLowerCase() !== 'http' &&
                url.substr(-5).toLowerCase() !== '.html') {
              return false;
            }
            if (isXhtml && this.getAttribute('xml:lang') && this.getAttribute('lang')) {
              val = 'xml:lang=' + this.getAttribute('xml:lang') + ', lang=' + this.getAttribute('lang');
            } else if (isXhtml && this.getAttribute('xml:lang')) {
              val = 'xml:lang=' + this.getAttribute('xml:lang');
            } else if (isXhtml && this.getAttribute('lang')) {
              val = 'xml:lang=' + g.achecker.i18n.get('None') + ', lang=' + this.getAttribute('lang');
            } else if (!isXhtml && this.getAttribute('lang')) {
              val = 'lang=' + this.getAttribute('lang');
            } else {
              val = g.achecker.i18n.get('NoMainLang');
            }
            $res.innerText = url + ': ';
            $res.textContent = url + ': ';

            var $val = rdoc.createElement('strong');
            $val.innerText = val;
            $val.textContent = val;
            $res.appendChild($val);
            return $res;
          },
          function (doc, url) {
            var isXhtml = this.getAttribute('xmlns');

            if (isXhtml && this.getAttribute('xml:lang')) {
              return 'pass';
            }
            if (isXhtml && this.getAttribute('lang')) {
              return 'warning';
            }
            if (!isXhtml && this.getAttribute('lang')) {
              return 'pass';
            }
            return 'fail';
          }
        ),

        unintendedFunction: new TableSection(
          cwin,
          rdoc,
          '16. ' + g.achecker.i18n.get('No16'),
          'a,area,input,button',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Event'), width: 80},
            {label: g.achecker.i18n.get('Contents'), className: 'lt'},
            {label: g.achecker.i18n.get('TitleAttribute')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('RequireConfirmation'),
          function (doc, url) {
            var data = {
              hidden: '',
              event: '',
              content: '',
              title: ''
            };
            var evtWrapper = this.wrappedJSObject || this;
            var hasChangeEvent;
            var hasWindowOpenEvent;
            var contentForTest;

            try {
              hasWindowOpenEvent = evtWrapper.onclick ?
                  evtWrapper.onclick.toString().indexOf('window.open') > -1 : false;
            } catch (e) {
              hasWindowOpenEvent = null;
            }

            data.content = getTextContent(this);
            contentForTest = data.content.replace(/ /g, '').toLowerCase();
            if (this.getAttribute('title')) {
              data.title = this.getAttribute('title');
            } else if (this.getAttribute('target') === '_blank') {
              data.title = 'target="_blank"';
            } else if (contentForTest.indexOf('새창') > -1 ||
                       contentForTest.indexOf('팝업') > -1 ||
                       contentForTest.toLowerCase().indexOf('newwin') > -1) {
            } else {
              data.title = 'has notice';
            }

            if (hasWindowOpenEvent) {
              data.event = 'window.open';
            } else {
              return false;
            }

            return [
              data.hidden,
              data.event,
              data.content,
              data.title
            ];
          },
          function () {
            var content = getTextContent(this);
            if (this.getAttribute('title')) {
              return 'warning';
            }
            if (this.getAttribute('target') === '_blank') {
              return 'pass';
            }
            if (content.indexOf('새창') > -1 ||
                content.indexOf('팝업') > -1 ||
                content.toLowerCase().indexOf('new window') > -1) {
              return 'pass';
            }
            return 'fail';
          }
        ),

        table: new TableSection(
          cwin,
          rdoc,
          '18. ' + g.achecker.i18n.get('No18'),
          'table',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Structure'), className: 'tb_str'}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function () {
            var data = {
              hidden: '',
              structure: ''
            };
            var childNodes = this.childNodes;
            var $caption = null;
            var $resultCaption = rdoc.createElement('p');
            var $resultSummary = rdoc.createElement('p');
            var i, l;

            for (i = 0; i < childNodes.length; i++) {
              if (childNodes[i].tagName &&
                  childNodes[i].tagName.toLowerCase() === 'caption') {
                $caption = childNodes[i];
                break;
              }
            }
            var hasCaption = !!$caption;
            var hasSummary = !!this.getAttribute('summary');

            $resultCaption.innerHTML = 'caption: ' + (hasCaption ? getTextContent($caption) : g.achecker.i18n.get('None'));
            $resultSummary.innerHTML = 'summary: ' +  (hasSummary ? this.getAttribute('summary') : g.achecker.i18n.get('None'));

            var $thead = getElsFromChildNodes(this, 'thead');
            var $tfoot = getElsFromChildNodes(this, 'tfoot');
            var $tbody = getElsFromChildNodes(this, 'tbody');
            var $theadTh = getElsFromChildNodes(
                getElsFromChildNodes($thead, 'tr'),
                'th'
              );
            var $tfootTh = getElsFromChildNodes(
                getElsFromChildNodes($tfoot, 'tr'),
                'th'
              );
            var $tbodyTh = getElsFromChildNodes(
                getElsFromChildNodes($tbody, 'tr'),
                'th'
              ).concat(
                getElsFromChildNodes(
                  getElsFromChildNodes(this, 'tr'),
                  'th'
                )
              );
            var hasTh = !!$theadTh.length || !!$tfootTh.length || $tbodyTh.length;
            var $resultTable = rdoc.createElement('table');
            var $resultThead = rdoc.createElement('thead');
            var $resultTbody = rdoc.createElement('tbody');
            var $resultTheadTr = rdoc.createElement('tr');
            var $resultTheadTh1 = rdoc.createElement('th');
            var $resultTheadTh2 = rdoc.createElement('th');
            var $resultTheadTh3 = rdoc.createElement('th');
            $resultTheadTh1.innerText = '요소';
            $resultTheadTh1.textContent = '요소';
            $resultTheadTh2.innerText = '유무';
            $resultTheadTh2.textContent = '유무';
            $resultTheadTh3.innerText = '제목셀 정보 (scope 속성값)';
            $resultTheadTh3.textContent = '제목셀 정보 (scope 속성값)';
            $resultTheadTr.appendChild($resultTheadTh1);
            $resultTheadTr.appendChild($resultTheadTh2);
            $resultTheadTr.appendChild($resultTheadTh3);
            $resultThead.appendChild($resultTheadTr);
            $resultTable.appendChild($resultThead);
            $resultTable.appendChild($resultTbody);

            var $resultTr = rdoc.createElement('tr');
            var $resultTd1 = rdoc.createElement('td');
            var $resultTd2 = rdoc.createElement('td');
            var $resultTd3 = rdoc.createElement('td');
            var $resultTd3Ul;
            var $th;
            var scope;
            var $infoItem;

            if ($thead.length) {
              $resultTd3Ul = rdoc.createElement('ul');
              $resultTd1.innerText = 'thead';
              $resultTd1.textContent = 'thead';
              $resultTd2.innerText = 'O';
              $resultTd2.textContent = 'O';
              for (i = 0, l = $theadTh.length; i < l; i++) {
                $th = $theadTh[i];
                scope = $th.getAttribute('scope');
                $infoItem = rdoc.createElement('li');

                $infoItem.innerText = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $infoItem.textContent = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $resultTd3Ul.appendChild($infoItem);
              }
              $resultTd3.appendChild($resultTd3Ul);
            } else {
              $resultTd1.innerText = 'thead';
              $resultTd1.textContent = 'thead';
              $resultTd2.innerText = 'X';
              $resultTd2.textContent = 'X';
              $resultTd3.innerText = '-';
              $resultTd3.textContent = '-';
            }
            $resultTr.appendChild($resultTd1);
            $resultTr.appendChild($resultTd2);
            $resultTr.appendChild($resultTd3);
            $resultTbody.appendChild($resultTr);

            $resultTr = rdoc.createElement('tr');
            $resultTd1 = rdoc.createElement('td');
            $resultTd2 = rdoc.createElement('td');
            $resultTd3 = rdoc.createElement('td');
            if ($tfoot.length) {
              $resultTd3Ul = rdoc.createElement('ul');
              $resultTd1.innerText = 'tfoot';
              $resultTd1.textContent = 'tfoot';
              $resultTd2.innerText = 'O';
              $resultTd2.textContent = 'O';
              for (i = 0, l = $tfootTh.length; i < l; i++) {
                $th = $tfootTh[i];
                scope = $th.getAttribute('scope');
                $infoItem = rdoc.createElement('li');

                $infoItem.innerText = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $infoItem.textContent = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $resultTd3Ul.appendChild($infoItem);
              }
              $resultTd3.appendChild($resultTd3Ul);
            } else {
              $resultTd1.innerText = 'tfoot';
              $resultTd1.textContent = 'tfoot';
              $resultTd2.innerText = 'X';
              $resultTd2.textContent = 'X';
              $resultTd3.innerText = '-';
              $resultTd3.textContent = '-';
            }
            $resultTr.appendChild($resultTd1);
            $resultTr.appendChild($resultTd2);
            $resultTr.appendChild($resultTd3);
            $resultTbody.appendChild($resultTr);

            $resultTr = rdoc.createElement('tr');
            $resultTd1 = rdoc.createElement('td');
            $resultTd2 = rdoc.createElement('td');
            $resultTd3 = rdoc.createElement('td');
            if ($tbody.length) {
              $resultTd3Ul = rdoc.createElement('ul');
              $resultTd1.innerText = 'tbody';
              $resultTd1.textContent = 'tbody';
              $resultTd2.innerText = 'O';
              $resultTd2.textContent = 'O';
              for (i = 0, l = $tbodyTh.length; i < l; i++) {
                $th = $tbodyTh[i];
                scope = $th.getAttribute('scope');
                $infoItem = rdoc.createElement('li');

                $infoItem.innerText = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $infoItem.textContent = getTextContent($th) +
                  (!!scope ? '(' + scope + ')' : '(X)');
                $resultTd3Ul.appendChild($infoItem);
              }
              $resultTd3.appendChild($resultTd3Ul);
            } else {
              $resultTd1.innerText = 'tbody';
              $resultTd1.textContent = 'tbody';
              $resultTd2.innerText = 'X';
              $resultTd2.textContent = 'X';
              $resultTd3.innerText = '-';
              $resultTd3.textContent = '-';
            }
            $resultTr.appendChild($resultTd1);
            $resultTr.appendChild($resultTd2);
            $resultTr.appendChild($resultTd3);
            $resultTbody.appendChild($resultTr);

            var $resultDiv = rdoc.createElement('div');
            $resultDiv.appendChild($resultCaption);
            $resultDiv.appendChild($resultSummary);
            $resultDiv.appendChild($resultTable);

            data.structure = $resultDiv;

            return [
              data.hidden,
              data.structure
            ];
          },
          function () {
            var childNodes = this.childNodes,
              $caption = null,
              i,
              l;
            for (i = 0; i < childNodes.length; i++) {
              if (childNodes[i].tagName &&
                  childNodes[i].tagName.toLowerCase() === 'caption') {
                $caption = childNodes[i];
                break;
              }
            }
            var hasCaption = !!$caption;
            var hasSummary = !!this.getAttribute('summary');
            var $theadTh = getElsFromChildNodes(
                getElsFromChildNodes(
                  getElsFromChildNodes(this, 'thead'),
                  'tr'
                ),
                'th'
              );
            var $tfootTh = getElsFromChildNodes(
                getElsFromChildNodes(
                  getElsFromChildNodes(this, 'tfoot'),
                  'tr'
                ),
                'th'
              );
            var $tbodyTh = getElsFromChildNodes(
                getElsFromChildNodes(
                  getElsFromChildNodes(this, 'tbody'),
                  'tr'
                ),
                'th'
              ).concat(
                getElsFromChildNodes(
                  getElsFromChildNodes(this, 'tr'),
                  'th'
                )
              );
            var hasTh = $theadTh.length || $tfootTh.length || $tbodyTh.length;
            var hasScope = function ($ths) {
              var i, l;
              for (i = 0, l = $ths.length; i < l; i++) {
                if (!$ths[i].getAttribute('scope')) {
                  return false;
                }
              }
              return true;
            };

            if (hasTh && hasScope($theadTh) && hasScope($tfootTh) &&
                hasScope($tbodyTh) && hasCaption) {
              return 'pass';
            } else if (hasTh && hasCaption) {
              return 'warning';
            } else if (!hasCaption && !hasSummary && !hasTh) {
              return 'warning';
            } else {
              return 'fail';
            }
          }
        ),

        label: new TableSection(
          cwin,
          rdoc,
          '19. ' + g.achecker.i18n.get('No19'),
          'input,textarea,select',
          [ {label: g.achecker.i18n.get('Hidden'), width: 45},
            {label: g.achecker.i18n.get('Element'), width: 45},
            {label: g.achecker.i18n.get('FormType'), width: 66},
            {label: g.achecker.i18n.get('LabelConnection'), className: 'lt'},
            {label: g.achecker.i18n.get('TitleAttribute')}
          ],
          isIncludeFrame,
          frameDocs,
          g.achecker.i18n.get('NotApplicable'),
          function (doc, url) {
            var typeAttr = this.getAttribute('type') ? this.getAttribute('type').toLowerCase() : null;
            if (this.tagName === 'INPUT' &&
                (typeAttr === 'submit' ||
                  typeAttr === 'button' ||
                  typeAttr === 'image' ||
                  typeAttr === 'hidden' ||
                  typeAttr === 'reset')) {
              return false;
            }

            var data = {
              hidden: '',
              el: '',
              type: '',
              label: '',
              title: ''
            };
            var _id = this.getAttribute('id');
            var $labels = doc.getElementsByTagName("label");
            var hasLabelElement = false,
              $label = null,
              i,
              l;

            if (_id) {
              for (i = 0, l = $labels.length; i < l; i++) {
                if ($labels[i].getAttribute('for') === _id) {
                  hasLabelElement = true;
                  $label = $labels[i];
                  break;
                }
              }
            }
            var hasTitle = !!this.getAttribute('title');

            var hasImplicitLabel = false;
            var parentEl = this.parentNode;
            do {
              if (parentEl.tagName === 'LABEL') {
                hasImplicitLabel = true;
                $label = parentEl;
                break;
              }
              parentEl = parentEl.parentNode;
            } while (parentEl.parentNode);

            data.el = this.tagName.toLowerCase();
            data.type = typeAttr || '-';
            data.label = $label ? getLabelText($label) : '';
            if (!data.label) {
              data.label = 'X';
            }
            data.title = this.getAttribute('title');
            if (!data.title) {
              data.title = '-';
            }

            return [
              data.hidden,
              data.el,
              data.type,
              data.label,
              data.title
            ];
          },
          function (doc, url) {
            var _id = this.getAttribute('id');
            var $labels = doc.getElementsByTagName("label");
            var hasLabelElement = false, i, l;
            if (_id) {
              for (i = 0, l = $labels.length; i < l; i++) {
                if ($labels[i].getAttribute('for') === _id) {
                  hasLabelElement = true;
                  break;
                }
              }
            }
            var hasTitle = !!this.getAttribute('title');
            var hasImplicitLabel = false;
            var parentEl = this.parentNode;
            do {
              if (parentEl.tagName === 'LABEL') {
                hasImplicitLabel = true;
              }
              parentEl = parentEl.parentNode;
            } while (parentEl.parentNode);

            if (hasLabelElement) {
              return 'pass';
            }
            if (hasImplicitLabel) {
              return 'pass';
            }
            if (hasTitle) {
              return 'warning';
            }
            return 'fail';
          }
        ),

        validation: new ToolSection(
          cwin,
          rdoc,
          'w3c_validation',
          '21. ' + g.achecker.i18n.get('No21'),
          function (win, rdoc) {
            var urls = [], i, l;
            if (win.location.href.substr(0, 7) === 'http://' ||
                  win.location.href.substr(0, 8) === 'https://' ||
                  win.location.href.substr(0, 7) === 'file://') {
              urls.push(win.location.href);
            }
            if (isIncludeFrame) {
              for (i = 0, l = frameDocs.length; i < l; i++) {
                var _url = frameDocs[i].src;
                if (_url.substr(0, 7) === 'http://' || _url.substr(0, 8) === 'https://') {
                  urls.push(_url);
                }
              }
            }

            var $ul = rdoc.createElement('ul');
            for (i = 0; i < urls.length; i++) {
              var url = urls[i];
              var $item = rdoc.createElement('li');
              var directValidationLink = rdoc.createElement("a");
              directValidationLink.target = '_blank';
              directValidationLink.href = 'https://validator.w3.org/check?uri=' + encodeURIComponent(url);
              directValidationLink.textContent = g.achecker.i18n.get('ValidateManually');
              $item.textContent = url + ': ';
              $item.appendChild(directValidationLink);
              $ul.appendChild($item);
            }
            return $ul;
          }
        )
      }
    };
  };
}(this, this.document));
