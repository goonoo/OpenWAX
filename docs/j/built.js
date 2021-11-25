/*! OpenWAX - v2.0.8 - 2014-06-06 */
(function (g) {
  "use strict";

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
  var getStyle = function (el, style) {
    if (el.currentStyle) {
      return el.currentStyle.style;
    }
    return g.getComputedStyle(el, null)[style];
  };
  var toggleFoldedClass = function (el) {
    el.className = el.className.indexOf('folded') > -1 ? el.className.replace(/folded/g, '') : el.className + ' folded';

    // fix bug: IE8 won't reflow when set data-* attribute
    if (document && document.all) {
      document.body.className = document.body.getAttribute("className");
    }
  };

  var Xpath = {};

  // ********************************************************************************************* //
  // XPATH

  /**
   * Gets an XPath for an element which describes its hierarchical location.
   */
  Xpath.getElementXPath = function (element) {
    if (element && element.id) {
      return '//*[@id="' + element.id + '"]';
    }
    return Xpath.getElementTreeXPath(element);
  };

  Xpath.getElementTreeXPath = function (element) {
    var paths = [];
    var DOCUMENT_TYPE_NODE = 10;
    var sibling;

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (element; element && element.nodeType === 1; element = element.parentNode) {
      var index = 0;
      for (sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        // Ignore document type declaration.
        if (sibling.nodeType !== DOCUMENT_TYPE_NODE && sibling.nodeName === element.nodeName) {
          ++index;
        }
      }

      var tagName = element.nodeName.toLowerCase();
      var pathIndex = (index ? "[" + (index + 1) + "]" : "");
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
  };

  g.achecker = g.achecker || {};
  g.achecker.Wax = g.achecker.Wax || {};
  g.achecker.Wax.Section = function () {
    throw 'not implemented';
  };
  g.achecker.Wax.Section.prototype = {
    getAsElement : function () {
      throw 'not implemented';
    }
  };

  g.achecker.Wax.isElHidden = function (el) {
    if (el && el.tagName && (el.tagName === 'TITLE' || el.tagName === 'BODY' || el.tagName === 'HTML')) {
      return false;
    }
    do {
      if (el.tagName && getStyle(el, 'display') === 'none') {
        return true;
      }
      el = el.parentNode;
    } while (el);
    return false;
  };

  g.achecker.Wax.ListSection = g.achecker.Wax.Section;
  g.achecker.Wax.ListSection = function (cwin, rdoc, title, targetSelector,
      limit, isIncludeFrame, frameDocs, emptyMessage,
      content, validStatus, eventHandlers) {
    var this_ = this;
    this.cwin = cwin;
    this.rdoc = rdoc;
    this.title = title;
    this.emptyMessage = emptyMessage;
    this.contents = this._getContents(cwin, isIncludeFrame, frameDocs,
        targetSelector, content, validStatus, eventHandlers, limit);
  };
  g.achecker.Wax.ListSection.prototype._getContentsFromDocument = function (doc, url,
      targetSelector, content, validStatus, eventHandlers, limit) {
    if (!limit) {
      limit = 99999;
    }

    var $target = doc.querySelectorAll(targetSelector);
    var contents = [], i;

    for (i = 0; i < $target.length; i++) {
      if (limit <= 0) {
        break;
      }

      var $el = $target[i];
      var _content = typeof content === 'function' ? content.apply($el, [doc, url]) : content;
      if (_content !== false) {
        contents.push({
          el: $el,
          doc: $el.ownerDocument,
          validStatus: typeof validStatus === 'function' ? validStatus.apply($el, [doc, url]) : (typeof validStatus === 'string' ? validStatus : ''),
          content: typeof content === 'function' ? content.apply($el, [doc, url]) : content,
          eventHandlers: eventHandlers
        });
        limit--;
      }
    }
    return contents;
  };
  g.achecker.Wax.ListSection.prototype._getContents = function (win, isIncludeFrame,
      frameDocs, targetSelector, content, validStatus,
      eventHandlers, limit) {
    if (!limit) {
      limit = 99999;
    }
    var contents = this._getContentsFromDocument(win.document, win.location.href,
      targetSelector, content, validStatus, eventHandlers, limit), i, l;

    limit -= contents.length;
    if (isIncludeFrame && limit > 0) {
      for (i = 0, l = frameDocs.length; i < l; i++) {
        if (limit <= 0) {
          break;
        }

        var _contents = this._getContentsFromDocument(
          frameDocs[i].doc,
          frameDocs[i].src,
          targetSelector,
          content,
          validStatus,
          eventHandlers,
          limit
        );
        contents = contents.concat(_contents);
        limit -= _contents.length;
      }
    }
    return contents;
  };
  g.achecker.Wax.ListSection.prototype.getAsElement = function () {
    var this_ = this;
    var doc = this.rdoc;

    if (!doc.querySelectorAll) {
      // IE7 support for querySelectorAll in 274 bytes. Supports multiple / grouped selectors and the attribute selector
      // with a "for" attribute. http://www.codecouch.com/
      (function (d, s) {d = doc, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) {a = d.all, c = [], r = r.replace(/\[for\b/gi, '[htmlFor').split(','); for (i = r.length; i--;) {s.addRule(r[i], 'k:v'); for (j = a.length;j--;) {a[j].currentStyle.k && c.push(a[j]); } s.removeRule(0); } return c; }; })();
    }

    var $contentList = doc.createElement("ul"), i;
    var hasWarning = false;
    var hasError = false;
    var onClickItem = function (e) {
      if (parent.Firebug) {
        parent.Firebug.Inspector.clearAllHighlights();
      }

      var $targetEl = this['data-el'];
      var isHidden = g.achecker.Wax.isElHidden($targetEl);
      if ($targetEl.tagName === 'TITLE') {
        while ($targetEl) {
          if ($targetEl.tagName === 'HTML') {
            break;
          }
          $targetEl = $targetEl.parentNode;
        }
      }

      if (!isHidden) {
        var oldTabindex = $targetEl.getAttribute('tabindex');
        $targetEl.setAttribute('tabindex', 0);
        $targetEl.focus();
        if (oldTabindex === null) {
          $targetEl.removeAttribute('tabindex');
        } else {
          $targetEl.setAttribute('tabindex', oldTabindex);
        }
      }
      if (parent.Firebug && $targetEl) {
        parent.Firebug.Inspector.inspectFromContextMenu($targetEl);
        // compatible with firebug 1.9.x
        parent.Firebug.Inspector.highlightObject($targetEl, parent.Firebug.currentContext);
      } else if (g.console && g.console.log && $targetEl) {
        g.console.log('OpenWAX Info: ', Xpath.getElementXPath($targetEl));
      }
    };

    for (i = 0; i < this.contents.length; i++) {
      var info = this.contents[i];
      var hiddenClass = g.achecker.Wax.isElHidden(info.el) ? ' hidden_el' : '';
      var $item = doc.createElement('li');
      var key;

      $item.className = info.validStatus + ' ' + hiddenClass;
      if (typeof info.content === 'string') {
        $item.innerText = info.content;
        $item.textContent = info.content;
      } else {
        $item.appendChild(info.content);
      }
      $item['data-el'] = info.el;
      if (info.eventHandlers) {
        for (key in info.eventHandlers) {
          if (info.eventHandlers.hasOwnProperty(key)) {
            addEvent($item, key, info.eventHandlers[key]);
          }
        }
      }
      if (info.validStatus === 'fail') {
        hasError = true;
      } else if (info.validStatus === 'warning') {
        hasWarning = true;
      }
      addEvent($item, 'click', onClickItem);
      $contentList.appendChild($item);
    }

    var $section = doc.createElement('div');
    $section.className = 'waxSection';
    var $title = doc.createElement('h2');
    var $count = doc.createElement('span');
    $title.innerText = this.title + " ";
    $title.textContent = this.title + " ";
    $title.className = 'folded';
    if (hasError) {
      $title.className += ' fail';
    } else if (hasWarning) {
      $title.className += ' warning';
    }
    $count.innerText = "(" + this.contents.length + ")";
    $count.textContent = "(" + this.contents.length + ")";
    $title.appendChild($count);
    /*
    var $titleLink = doc.createElement('a');
    $titleLink.setAttribute('target', '_blank');
    $titleLink.setAttribute('href',
        'http://html.nhncorp.com/a11y/guide.php?no='+
          this.title.split(' ')[0] + '');
    $titleLink.innerText = 'Guide';
    $titleLink.textContent = 'Guide';
    $title.appendChild($titleLink);
    */
    $section.appendChild($title);

    if ($contentList.childNodes.length <= 0) {
      var $emptyItem = doc.createElement('p');
      $emptyItem.className = 'comment';
      $emptyItem.innerText = this.emptyMessage;
      $emptyItem.textContent = this.emptyMessage;
      $section.appendChild($emptyItem);
    } else {
      $section.appendChild($contentList);
    }

    addEvent($title, 'click', function (e) {
      toggleFoldedClass(this);
    });
    /*
    addEvent($titleLink, 'click', function (e) {
      e.stopPropagation();
    });
    */
    return $section;
  };
  g.achecker.Wax.ListSection.prototype.getScore = function () {
    var count = this.contents.length,
        pass = 0;

    for (var i = 0; i < count; i++) {
      if (this.contents[i].validStatus !== 'fail') {
        pass++;
      }
    }

    return {
      all: count,
      pass: pass
    };
  };

  g.achecker.Wax.TableSection = g.achecker.Wax.Section;
  g.achecker.Wax.TableSection = function (cwin, rdoc, title, targetSelector,
      colInfo, isIncludeFrame, frameDocs, emptyMessage,
      content, validStatus, eventHandlers) {
    var this_ = this;
    this.cwin = cwin;
    this.rdoc = rdoc;
    this.title = title;
    this.colInfo = colInfo;
    this.emptyMessage = emptyMessage;
    this.contents = this._getContents(cwin, isIncludeFrame, frameDocs,
        targetSelector, content, validStatus, eventHandlers);
  };
  g.achecker.Wax.TableSection.prototype._getContentsFromDocument = function (doc, url,
      targetSelector, content, validStatus, eventHandlers) {
    var $target = doc.querySelectorAll(targetSelector);
    var contents = [], i;

    for (i = 0; i < $target.length; i++) {
      var $el = $target[i];
      var _content = typeof content === 'function' ? content.apply($el, [doc, url]) : content;
      if (_content !== false) {
        contents.push({
          el: $el,
          doc: $el.ownerDocument,
          validStatus: typeof validStatus === 'function' ? validStatus.apply($el, [doc, url]) : (typeof validStatus === 'string' ? validStatus : ''),
          content: typeof content === 'function' ? content.apply($el, [doc, url]) : content,
          eventHandlers: eventHandlers
        });
      }
    }
    return contents;
  };
  g.achecker.Wax.TableSection.prototype._getContents = function (win, isIncludeFrame,
      frameDocs, targetSelector, content, validStatus,
      eventHandlers) {
    var contents = this._getContentsFromDocument(win.document, win.location.href,
      targetSelector, content, validStatus, eventHandlers), i, l;

    if (isIncludeFrame) {
      for (i = 0, l = frameDocs.length; i < l; i++) {
        var _contents = this._getContentsFromDocument(frameDocs[i].doc, frameDocs[i].src,
          targetSelector, content, validStatus, eventHandlers);
        contents = contents.concat(_contents);
      }
    }
    return contents;
  };
  g.achecker.Wax.TableSection.prototype.getAsElement = function () {
    var this_ = this;
    var doc = this.rdoc;
    var $table = doc.createElement('table');
    var $thead = doc.createElement('thead');
    var $theadTr = doc.createElement('tr');
    var hasWarning = false;
    var hasError = false;
    var i;
    var onClickTr = function (e) {
      if (parent.Firebug) {
        parent.Firebug.Inspector.clearAllHighlights();
      }

      var $targetEl = this['data-el'];
      var isHidden = g.achecker.Wax.isElHidden($targetEl);
      if ($targetEl.tagName === 'TITLE') {
        while ($targetEl) {
          if ($targetEl.tagName === 'HTML') {
            break;
          }
          $targetEl = $targetEl.parentNode;
        }
      }

      if (!isHidden) {
        var oldTabindex = $targetEl.getAttribute('tabindex');
        $targetEl.setAttribute('tabindex', 0);
        $targetEl.focus();
        if (oldTabindex === null) {
          $targetEl.removeAttribute('tabindex');
        } else {
          $targetEl.setAttribute('tabindex', oldTabindex);
        }
      }
      if (parent.Firebug && $targetEl) {
        parent.Firebug.Inspector.inspectFromContextMenu($targetEl);
        // compatible with firebug 1.9.x
        parent.Firebug.Inspector.highlightObject($targetEl, parent.Firebug.currentContext);
      } else if (g.console && g.console.log && $targetEl) {
        g.console.log('OpenWAX Info: ', Xpath.getElementXPath($targetEl));
      }
    };

    for (i = 0; i < this.colInfo.length; i++) {
      var $theadTh = doc.createElement('th');
      $theadTh.setAttribute('scope', 'col');
      $theadTh.innerText = this.colInfo[i].label;
      $theadTh.textContent = this.colInfo[i].label;
      if (this.colInfo[i].width) {
        $theadTh.style.width = this.colInfo[i].width + 'px';
      }
      if (this.colInfo[i].minWidth) {
        $theadTh.style.minWidth = this.colInfo[i].minWidth + 'px';
      }
      if (this.colInfo[i].maxWidth) {
        $theadTh.style.maxWidth = this.colInfo[i].maxWidth + 'px';
      }
      if (this.colInfo[i].className) {
        $theadTh.className = this.colInfo[i].className;
      }
      $theadTr.appendChild($theadTh);
    }
    $thead.appendChild($theadTr);
    $table.appendChild($thead);

    var $tbody = doc.createElement('tbody');
    for (i = 0; i < this.contents.length; i++) {
      var info = this.contents[i];
      var hiddenClass = g.achecker.Wax.isElHidden(info.el) ? ' hidden_el' : '';
      var $tr = doc.createElement('tr');
      var j, key;

      $tr.className = info.validStatus + ' ' + hiddenClass;
      for (j in info.content) {
        if (info.content.hasOwnProperty(j)) {
          var _content = info.content[j];
          var $td = doc.createElement('td');
          if (typeof _content === 'string') {
            $td.innerText = _content;
            $td.textContent = _content;
            $td.innerHTML = (_content
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                )
                .replace(/\[__\[/g, '<span style="color:#777!important;text-decoration:line-through">')
                .replace(/\]__\]/g, '</span>');
          } else {
            $td.appendChild(_content);
          }
          if (this.colInfo[j].className) {
            $td.className = this.colInfo[j].className;
          }
          $tr.appendChild($td);
        }
      }
      $tr['data-el'] = info.el;
      if (info.eventHandlers) {
        for (key in info.eventHandlers) {
          if (info.eventHandlers.hasOwnProperty(key)) {
            addEvent($tr, key, info.eventHandlers[key]);
          }
        }
      }
      if (info.validStatus === 'fail') {
        hasError = true;
      } else if (info.validStatus === 'warning') {
        hasWarning = true;
      }
      addEvent($tr, 'click', onClickTr);
      $tbody.appendChild($tr);
      $table.appendChild($tbody);
    }

    var $section = doc.createElement('div');
    $section.className = 'waxSection';
    var $title = doc.createElement('h2');
    var $count = doc.createElement('span');
    $title.innerText = this.title + " ";
    $title.textContent = this.title + " ";
    $title.className = 'folded';
    if (hasError) {
      $title.className += ' fail';
    } else if (hasWarning) {
      $title.className += ' warning';
    }
    $count.innerText = "(" + this.contents.length + ")";
    $count.textContent = "(" + this.contents.length + ")";
    $title.appendChild($count);
    /*
    var $titleLink = doc.createElement('a');
    $titleLink.setAttribute('target', '_blank');
    $titleLink.setAttribute('href',
        'http://html.nhncorp.com/a11y/guide.php?no='+
          this.title.split(' ')[0] + '');
    $titleLink.innerText = 'Guide';
    $titleLink.textContent = 'Guide';
    $title.appendChild($titleLink);
    */
    $section.appendChild($title);

    if ($tbody.childNodes.length <= 0) {
      var $emptyItem = doc.createElement('p');
      $emptyItem.className = 'comment';
      $emptyItem.innerText = this.emptyMessage;
      $emptyItem.textContent = this.emptyMessage;
      $section.appendChild($emptyItem);
    } else {
      $section.appendChild($table);
    }

    addEvent($title, 'click', function (e) {
      toggleFoldedClass(this);
    });
    /*
    addEvent($titleLink, 'click', function (e) {
      e.stopPropagation();
    });
    */
    return $section;
  };
  g.achecker.Wax.TableSection.prototype.getScore = function () {
    var count = this.contents.length,
        pass = 0;

    for (var i = 0; i < count; i++) {
      if (this.contents[i].validStatus !== 'fail') {
        pass++;
      }
    }

    return {
      all: count,
      pass: pass
    };
  };

  g.achecker.Wax.ToolSection = function (cwin, rdoc, id, title, content, eventHandlers) {
    var this_ = this;
    this.cwin = cwin;
    this.rdoc = rdoc;
    this.id = id;
    this.title = title;
    this.content = typeof content === 'function' ? content.apply(this, [this.cwin, this.rdoc]) : content;
    this.eventHandlers = eventHandlers;
  };
  g.achecker.Wax.ToolSection.prototype.getAsElement = function () {
    var doc = this.rdoc;

    var $section = doc.createElement('div');
    $section.id = this.id;
    $section.className = 'waxSection';
    var $title = doc.createElement('h2');
    $title.className = 'folded';
    $title.innerText = this.title;
    $title.textContent = this.title;
    /*
    var $titleLink = doc.createElement('a');
    $titleLink.setAttribute('target', '_blank');
    $titleLink.setAttribute('href',
        'http://html.nhncorp.com/a11y/guide.php?no='+
          this.title.split(' ')[0] + '');
    $titleLink.innerText = 'Guide';
    $titleLink.textContent = 'Guide';
    $title.appendChild($titleLink);
    */

    var $content = doc.createElement('div');
    if (typeof this.content === 'string') {
      $content.innerText = this.content;
      $content.textContent = this.content;
    } else {
      $content.appendChild(this.content);
    }
    $section.appendChild($title);
    $section.appendChild($content);

    $title.setAttribute('tabindex', 0);
    addEvent($title, 'click', function (e) {
      toggleFoldedClass(this);
    });
    /*
    addEvent($titleLink, 'click', function (e) {
      e.stopPropagation();
    });
    */
    return $section;
  };
  g.achecker.Wax.ToolSection.prototype.getScore = function () {
    return null;
  };
}(this));

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

        contrast: new ToolSection(
          cwin,
          rdoc,
          'contrast',
          '5. ' + g.achecker.i18n.get('No5'),
          function (win, rdoc) {
            if (!g.achecker.colorInspector) {
              var $res = rdoc.createElement('p');
              $res.className = 'comment';
              $res.innerText = 'Not Supported.';
              $res.textContent = 'Not Supported.';
              return $res;
            }

            var $ul = rdoc.createElement('ul');
            $ul.className = 'contrast';
            var $color1 = rdoc.createElement('li');
            var $color2 = rdoc.createElement('li');
            var $result = rdoc.createElement('li');

            $color1.className = 'color1';
            var $color1_label = rdoc.createElement('span');
            $color1_label.innerText = g.achecker.i18n.get('Foreground') + ': ';
            $color1_label.textContent = g.achecker.i18n.get('Foreground') + ': ';
            var $color1_color = rdoc.createElement('span');
            $color1_color.className = 'color';
            $color1_color.style.backgroundColor = '#000';
            var $color1_val = rdoc.createElement('span');
            $color1_val.className = 'val';
            $color1_val.innerText = '#000000';
            $color1_val.textContent = '#000000';
            var $color1_btn = rdoc.createElement('button');
            $color1_btn.innerText = g.achecker.i18n.get('SelectForegroundColor');
            $color1_btn.textContent = g.achecker.i18n.get('SelectForegroundColor');
            $color1.appendChild($color1_label);
            $color1.appendChild($color1_color);
            $color1.appendChild(rdoc.createTextNode(' '));
            $color1.appendChild($color1_val);
            $color1.appendChild(rdoc.createTextNode(' '));
            $color1.appendChild($color1_btn);
            $color1.onclick = function () {
              g.achecker.showOverlay();
              g.achecker.colorInspector.startInspect(function (color) {
                g.achecker.hideOverlay();
                $color1.getElementsByClassName('color')[0].style.backgroundColor = color;
                $color1.getElementsByClassName('val')[0].innerText = color;
                $color1.getElementsByClassName('val')[0].textContent = color;
                var contrastRatio = getContrastRatio(color, $color2.getElementsByClassName('val')[0].innerText);
                if (contrastRatio >= 4.5) {
                  $result.className = 'pass';
                } else if (contrastRatio >= 3) {
                  $result.className = 'warning';
                } else {
                  $result.className = 'fail';
                }
                $result.getElementsByClassName('result')[0].innerText = contrastRatio + ':1';
                $result.getElementsByClassName('result')[0].textContent = contrastRatio + ':1';
                $result.getElementsByClassName('resultText')[0].style.color = color;
              });
            };

            $color2.className = 'color2';
            var $color2_label = rdoc.createElement('span');
            $color2_label.innerText = g.achecker.i18n.get('Background') + ': ';
            $color2_label.textContent = g.achecker.i18n.get('Background') + ': ';
            var $color2_color = rdoc.createElement('span');
            $color2_color.className = 'color';
            $color2_color.style.backgroundColor = '#FFF';
            var $color2_val = rdoc.createElement('span');
            $color2_val.className = 'val';
            $color2_val.innerText = '#FFFFFF';
            $color2_val.textContent = '#FFFFFF';
            var $color2_btn = rdoc.createElement('button');
            $color2_btn.innerText = g.achecker.i18n.get('SelectBackgroundColor');
            $color2_btn.textContent = g.achecker.i18n.get('SelectBackgroundColor');
            $color2.appendChild($color2_label);
            $color2.appendChild($color2_color);
            $color2.appendChild(rdoc.createTextNode(' '));
            $color2.appendChild($color2_val);
            $color2.appendChild(rdoc.createTextNode(' '));
            $color2.appendChild($color2_btn);
            $color2.onclick = function () {
              g.achecker.showOverlay();
              g.achecker.colorInspector.startInspect(function (color) {
                g.achecker.hideOverlay();
                $color2.getElementsByClassName('color')[0].style.backgroundColor = color;
                $color2.getElementsByClassName('val')[0].innerText = color;
                $color2.getElementsByClassName('val')[0].textContent = color;
                var contrastRatio = getContrastRatio(color, $color1.getElementsByClassName('val')[0].innerText);
                if (contrastRatio >= 4.5) {
                  $result.className = 'pass';
                } else if (contrastRatio >= 3) {
                  $result.className = 'warning';
                } else {
                  $result.className = 'fail';
                }
                $result.getElementsByClassName('result')[0].innerText = contrastRatio + ':1';
                $result.getElementsByClassName('result')[0].textContent = contrastRatio + ':1';
                $result.getElementsByClassName('resultText')[0].style.backgroundColor = color;
              });
            };

            $result.className = 'pass';
            var $result_label = rdoc.createElement('span');
            $result_label.innerText = g.achecker.i18n.get('Result') + ': ';
            $result_label.textContent = g.achecker.i18n.get('Result') + ': ';
            var $result_result = rdoc.createElement('span');
            $result_result.className = 'result';
            $result_result.innerText = '21:1';
            $result_result.textContent = '21:1';
            var $result_resultText = rdoc.createElement('span');
            $result_resultText.className = 'resultText';
            $result_resultText.innerText = g.achecker.i18n.get('Test');
            $result_resultText.textContent = g.achecker.i18n.get('Test');
            $result.appendChild($result_label);
            $result.appendChild($result_result);
            $result.appendChild(rdoc.createTextNode(' '));
            $result.appendChild($result_resultText);

            $ul.appendChild($color1);
            $ul.appendChild($color2);
            $ul.appendChild($result);

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
                       contentForTest.toLowerCase().indexOf('new win') > -1) {
              //data.title = 'has notice';
            } else {
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
                content.toLowerCase().indexOf('new win') > -1) {
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

            $resultCaption.textContent = '[caption] ' + (hasCaption ? getTextContent($caption) : g.achecker.i18n.get('None'));
            $resultSummary.textContent = '[summary] ' +  (hasSummary ? this.getAttribute('summary') : g.achecker.i18n.get('None'));

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
            var isChromeAddon = typeof chrome === "object" && chrome.extension;
            var isFirefoxAddon = typeof Components === "object" && Components.classes;
            if (!isChromeAddon && !isFirefoxAddon) {
              var $res = rdoc.createElement('p');
              $res.className = 'comment';
              $res.innerText = 'Not Supported.';
              $res.textContent = 'Not Supported.';
              return $res;
            }

            var filterValidationResult = function (res) {
              var msgs = res.messages, newmsgs = [];
              var filters = [
//              /^unterminated comment: .*/,
//              /^literal is missing closing delimiter.*/,
//              /^unknown declaration type .*/,
//              /^document type does not allow element .* here; missing one of .* start\-tag.*/,
//
                // html4 (negate for xhtml 1.0 self-closing tags)
                /^end tag for (?!.*img|.*meta|.*link|.*br|.*area|.*base|.*basefont|.*hr|.*input|.*col|.*frame|.*param|.*bgsound|.*isindex|.*keygen|.*menuitem|.*source|.*track|.*wbr).* omitted.*/i,
                /^end tag for .* which is not finished.*/,
                /^end tag for element .* which is not open.*/,
                // html5
                /^End tag .* seen, but there were open elements.*/,
                /^Unclosed element .*/,
                /^Stray end tag .*/,

//              /^an attribute value must be a literal unless it contains only name characters.*/,
//              /^an attribute value literal can occur in an attribute specification list only after a VI delimiter.*/,
//              /^normalized length of attribute value literal must not exceed.*/,
//              /^syntax of attribute value does not conform to declared value.*/,
//              /^value of attribute .* must be a single token.*/,
//              /^value of attribute .* cannot be .*; must be one of .*/,
//              /^invalid comment declaration:.*/,
//              /^no document type declaration; will parse without validation.*/,
//              /^unclosed start-tag requires SHORTTAG YES.*/,
//              /^unclosed end-tag requires SHORTTAG YES.*/,
//              /^DTD did not contain element declaration for document type name.*/,
//              /^empty start-tag.*/,
//              /^empty end-tag.*/,
//              /^no document type declaration; implying .*/,
//              /^no system id specified.*/,
//              /^.* separator in comment declaration.*/,

                // html4
                /^ID .* already defined.*/,
                // html5
                /^Duplicate ID .*/,

                // attribute duplicate for XHTML 1.0
                /^duplicate specification of attribute .*/,

                // attribute duplicate for HTML 5
                /^Duplicate attribute .*/
              ];
              var i, j;

              for (i = 0; i < msgs.length; i++) {
                if (msgs[i].type === 'error') {
                  for (j = 0; j < filters.length; j++) {
                    if (filters[j].test(msgs[i].message)) {
                      newmsgs.push(msgs[i]);
                      break;
                    }
                  }
                }
              }

              res.messages = newmsgs;
              return res;
            };

            var getResultDetailEl = function (messages, url) {
              var $res = rdoc.createElement('div');
              $res.className = 'validationResult';
              var $errhead = rdoc.createElement('h3');
              $errhead.innerText = 'Error';
              $errhead.textContent = 'Error';
              $errhead.className = 'fail';
              var $errul = rdoc.createElement('ul');
              var $warninghead = rdoc.createElement('h3');
              $warninghead.innerText = 'Warning';
              $warninghead.textContent = 'Warning';
              $warninghead.className = 'warning';
              var $warningul = rdoc.createElement('ul');
              var onClickMessageLink = function (e) {
                e.preventDefault();
                e.stopPropagation();
                openDialog("chrome://global/content/viewSource.xul",
                         "achecker_sourceView",
                         "scrollbars,resizable,chrome,dialog=no",
                         url, null, null, this.getAttribute('data-line'),
                         false);
              }, i;

              for (i = 0; i < messages.length; i++) {
                var msg = messages[i];
                var $li = rdoc.createElement('li');
                var $msg = rdoc.createElement('div');
                var $msga = rdoc.createElement('a');
                $msga.innerText = msg.message;
                $msga.textContent = msg.message;
                $msga.setAttribute('href', '#');
                $msga.setAttribute('data-line', msg.lastLine);
                addEvent($msga, 'click', onClickMessageLink);
                $msg.appendChild($msga);
                var $subinfo = rdoc.createElement('div');
                $subinfo.className = 'subinfo';
                $subinfo.innerText = msg.lastLine + ' line, ' + msg.lastColumn + ' column';
                $subinfo.textContent = msg.lastLine + ' line, ' + msg.lastColumn + ' column';
                $li.appendChild($msg);
                $li.appendChild($subinfo);
                switch (msg.type) {
                case 'error':
                  $errul.appendChild($li);
                  break;
                case 'info':
                  $warningul.appendChild($li);
                  break;
                }
              }
              $res.appendChild($errhead);
              $res.appendChild($errul);
              $res.appendChild($warninghead);
              $res.appendChild($warningul);
              return $res;
            };

            var getItemEl = function (url) {
              var el = rdoc.getElementById("w3c_validation");
              var itemEls = rdoc.querySelectorAll("#w3c_validation li.validationItem");
              var i;

              for (i = 0; i < itemEls.length; i++) {
                var urlEl = itemEls[i].getElementsByClassName("url")[0];
                if (urlEl.innerText === url || urlEl.textContent === url) {
                  return itemEls[i];
                }
              }
            };

            var runValidator = function (url, html, doc) {
              var req2 = new XMLHttpRequest();
              var charset = html.toLowerCase().indexOf('euc-kr') > 0 ? 'euc-kr' : 'utf-8';
              var ggTimeout = setTimeout(function () {
                var itemEl = getItemEl(url);
                var errcntEl = itemEl.getElementsByClassName("errcnt")[0];
                var directValidationLink = rdoc.createElement("a");
                directValidationLink.target = '_blank';
                directValidationLink.href = 'http://validator.w3.org/check?uri=' + encodeURIComponent(url);
                directValidationLink.textContent = '(' + g.achecker.i18n.get('ValidateManually') + ')';
                errcntEl.innerText = g.achecker.i18n.get('ValidationTimeout') + ' ';
                errcntEl.textContent = g.achecker.i18n.get('ValidationTimeout') + ' ';
                errcntEl.appendChild(directValidationLink);
              }, 20 * 1000);

              req2.onreadystatechange = function () {
                try {
                  var i;
                  var onClickItem = function () {
                    var $res = this.getElementsByTagName("div")[0];
                    $res.style.display = $res.style.display === 'none' ? 'block' : 'none';
                  };

                  if (req2.readyState === 4) {
                    if (req2.status === 200) {
                      var responseText = req2.responseText;
                      responseText = responseText.replace(/> 80/g, 80);
                      var res = filterValidationResult(JSON.parse(responseText));

                      var el = rdoc.getElementById("w3c_validation");
                      var headerEl = rdoc.querySelectorAll("#w3c_validation h2")[0];
                      var itemEl = getItemEl(url);
                      var errcnt = 0;
                      for (i = 0; i < res.messages.length; i++) {
                        if (res.messages[i].type === 'error') {
                          errcnt++;
                        }
                      }

                      clearTimeout(ggTimeout);
                      var errcntEl = itemEl.getElementsByClassName("errcnt")[0];
                      errcntEl.innerText = errcnt + ' Errors';
                      errcntEl.textContent = errcnt + ' Errors';
                      itemEl.className = errcnt > 0 ? 'fail' : 'pass';
                      if (errcnt > 0) {
                        headerEl.className += " fail";
                      }
                      var $res = getResultDetailEl(res.messages, url);
                      $res.style.display = 'none';
                      itemEl.appendChild($res);
                      itemEl.onclick = onClickItem;
                    }
                  }
                } catch (e) {
                }
              };

              try {
                req2.open("POST", "http://validator.w3.org/check", true);
                req2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                req2.send('fragment=' + g.encodeURIComponent(html) +
                    '&output=json' +
                    '&fbd=1');
              } catch (e) {
              }
            };

            var doValidation = function (url, doc) {
              var sourceUrl = url;
              var req = new XMLHttpRequest();
              req.onreadystatechange = function () {
                if (req.readyState === 4) {
                  if (req.status === 200) {
                    // IT WORKS!
                    var html = req.responseText;
                    // remove BOM
                    html = html.replace(/^\uFEFF/, '');
                    runValidator(url, html, doc);
                  } else {
                    g.alert(g.achecker.i18n.get('ValidationFail'));
                  }
                }
              };
              req.open("GET", sourceUrl, true);
              req.send(null);
            };

            var urls = [], docs = [], i, l;
            if (win.location.href.substr(0, 7) === 'http://' ||
                  win.location.href.substr(0, 8) === 'https://' ||
                  win.location.href.substr(0, 7) === 'file://') {
              urls.push(win.location.href);
              docs.push(win.document);
            }
            if (isIncludeFrame) {
              for (i = 0, l = frameDocs.length; i < l; i++) {
                var _url = frameDocs[i].src;
                if (_url.substr(0, 7) === 'http://' || _url.substr(0, 8) === 'https://') {
                  urls.push(_url);
                  docs.push(frameDocs[i]);
                }
              }
            }

            var $output = rdoc.createElement('ul');
            for (i = 0, l = urls.length; i < l; i++) {
              doValidation(urls[i], docs[i]);
              var $item = rdoc.createElement('li');
              $item.className = 'validationItem';
              var $_url = rdoc.createElement('span');
              $_url.className = 'url';
              $_url.innerText = urls[i];
              $_url.textContent = urls[i];
              var $_errcnt = rdoc.createElement('b');
              $_errcnt.className = 'errcnt';
              $_errcnt.innerText = g.achecker.i18n.get('Loading');
              $_errcnt.textContent = g.achecker.i18n.get('Loading');
              $item.appendChild($_url);
              $item.appendChild(rdoc.createTextNode(': '));
              $item.appendChild($_errcnt);
              $output.appendChild($item);
            }
            return $output;
          }
        )
      }
    };
  };
}(this, this.document));

(function (g) {
  "use strict";

  var sectionWeights = {
    "altText": 30,
    "kbdFocus": 10,
    "frame": 10,
    "linkText": 10,
    "pageLang": 10,
    "unintendedFunction": 10,
    "label": 20
  };

  var getLevel = function (score) {
    if (score >= 95) {
      return "perfect";
    } else if (score > 80) {
      return "good";
    } else if (score > 60) {
      return "bad";
    } else {
      return "fail";
    }
  };

  var canonicalUrl = function (win) {
    var url = win.location.href;
    var linkEls = win.document.getElementsByTagName("link");
    var i, l = linkEls.length;
    for (i = 0; i < l; i++) {
      if (linkEls[i].getAttribute("rel") === "canonical" &&
          linkEls[i].getAttribute("href")) {
        url = linkEls[i].getAttribute("href");
      }
    }
    // remove fragment identifier from URL
    url = url.replace(/\#.*$/, '');
    return url;
  };

  g.achecker = g.achecker || {};
  g.achecker.Wax = g.achecker.Wax || {};
  g.achecker.Wax.score = function (waxSections) {
    var score = 0, info;

    for (var key in sectionWeights) {
      if (sectionWeights.hasOwnProperty(key)) {
        info = waxSections[key] ? waxSections[key].getScore() : null;
        if (info && info.all > 0) {
          score += parseInt(info.pass / info.all * sectionWeights[key] * 10, 10) / 10;
        } else {
          score += parseInt(sectionWeights[key], 10);
        }
      }
    }

    return parseInt(score * 10, 10) / 10;
  };
  g.achecker.Wax.scoreAsElement = function (cwin, rdoc, waxSections, allowLogging) {
    var score = g.achecker.Wax.score(waxSections);
    var $div = rdoc.createElement('div');
    $div.className = 'waxScore ' + getLevel(score);

    var $title = rdoc.createElement('h2');
    var $label = rdoc.createElement('a');
    $label.setAttribute('href', 'http://openwax.miya.pe.kr/#guide_score');
    $label.setAttribute('target', '_blank');
    $label.innerText = "WAX Score: ";
    $label.textContent = "WAX Score: ";
    var $score = rdoc.createElement('strong');
    $score.innerText = score;
    $score.textContent = score;

    $label.appendChild($score);
    $title.appendChild($label);
    $div.appendChild($title);

    if (allowLogging) {
      var $logger = rdoc.createElement('img');
      $logger.style.position = 'absolute';
      $logger.style.top = '-9999px';
      $logger.style.left = '-9999px';
      $logger.setAttribute('src', 'http://openwax.miya.pe.kr/log?' +
          'url=' + encodeURIComponent(canonicalUrl(cwin)) + '&' +
          'title=' + encodeURIComponent(cwin.document.title) + '&' +
          'score=' + score + '&');
      $div.appendChild($logger);
    }

    return $div;
  };
}(this));

var achecker_locale={};
achecker_locale["messages"] = {
	"Target": {
		"message": "대상",
		"description": ""
	},
	"TargetPage": {
		"message": "대상 페이지",
		"description": ""
	},
	"NoneTargetPage": {
		"message": "비대상 페이지",
		"description": ""
	},
	"AltText": {
		"message": "대체 텍스트",
		"description": ""
	},
	"Undefined": {
		"message": "미정의",
		"description": ""
	},
	"ValidationFail": {
		"message": "유효성 검사 오류 발생!",
		"description": ""
	},
	"Loading": {
		"message": "로딩중...",
		"description": ""
	},
	"TableTitle": {
		"message": "표 제목",
		"description": ""
	},
	"None": {
		"message": "없음",
		"description": ""
	},
	"TableStructure": {
		"message": "표 구조화",
		"description": ""
	},
	"HasThead": {
		"message": "thead있음",
		"description": ""
	},
	"HasTfoot": {
		"message": "tfoot있음",
		"description": ""
	},
	"HasTbody": {
		"message": "tbody있음",
		"description": ""
	},
	"NoThead": {
		"message": "thead없음",
		"description": ""
	},
	"NoTfoot": {
		"message": "tfoot없음",
		"description": ""
	},
	"NoTbody": {
		"message": "tbody없음",
		"description": ""
	},
	"LevelAA": {
		"message": "레벨AA",
		"description": ""
	},
	"DocumentsForView": {
		"message": "단순 열람 문서 형식",
		"description": ""
	},
	"ShortCut": {
		"message": "단축키",
		"description": ""
	},
	"PageMainLang": {
		"message": "주언어 명시",
		"description": ""
	},
	"NoMainLang": {
		"message": "주언어 없음",
		"description": ""
	},
	"ToggleGrayscale": {
		"message": "흑백 토글",
		"description": ""
	},
	"Contrast": {
		"message": "명도 대비",
		"description": ""
	},
	"Foreground": {
		"message": "전경",
		"description": ""
	},
	"SelectForegroundColor": {
		"message": "전경색 선택",
		"description": ""
	},
	"Background": {
		"message": "배경",
		"description": ""
	},
	"SelectBackgroundColor": {
		"message": "배경색 선택",
		"description": ""
	},
	"Result": {
		"message": "결과",
		"description": ""
	},
	"Test": {
		"message": "테스트",
		"description": ""
	},
	"KeyboardFocus": {
		"message": "키보드 포커스",
		"description": ""
	},
	"Error": {
		"message": "오류",
		"description": ""
	},
	"PageTitle": {
		"message": "페이지 제목",
		"description": ""
	},
	"NoPageTitle": {
		"message": "페이지 제목 없음",
		"description": ""
	},
	"UseFrame": {
		"message": "프레임 사용",
		"description": ""
	},
	"NoSrc": {
		"message": "src 없음",
		"description": ""
	},
	"NoTitle": {
		"message": "title 없음",
		"description": ""
	},
	"BlockTitle": {
		"message": "콘텐츠 블록 제목",
		"description": ""
	},
	"SkipNavigation": {
		"message": "건너뛰기 링크",
		"description": ""
	},
	"NthLink": {
		"message": "번째 링크",
		"description": ""
	},
	"Link": {
		"message": "링크",
		"description": ""
	},
	"Connected": {
		"message": "연결",
		"description": ""
	},
	"IsConnected": {
		"message": "연결됨",
		"description": ""
	},
	"IsNotConnected": {
		"message": "연결되지 않음",
		"description": ""
	},
	"LinkText": {
		"message": "링크 텍스트",
		"description": ""
	},
	"NoText": {
		"message": "텍스트 없음",
		"description": ""
	},
	"UnintendedFunction": {
		"message": "의도하지 않은 기능",
		"description": ""
	},
	"Label": {
		"message": "레이블",
		"description": ""
	},
	"No": {
		"message": "번호",
		"description": ""
	},
	"ThLink": {
		"message": "번째 링크",
		"description": ""
	},

	"NotApplicable": {
		"message": "해당없음",
		"description": ""
	},
	"RequireConfirmation": {
		"message": "직접 확인 필요",
		"description": ""
	},

	"FoldAll": {
		"message": "전체 접기",
		"description": ""
	},
	"UnfoldAll": {
		"message": "전체 펼치기",
		"description": ""
	},

	"Hidden": {
		"message": "숨김",
		"description": ""
	},
	"Preview": {
		"message": "미리보기",
		"description": ""
	},
	"Element": {
		"message": "요소",
		"description": ""
	},
	"Contents": {
		"message": "내용",
		"description": ""
	},
	"CaptionContent": {
		"message": "Caption 내용",
		"description": ""
	},
	"SummaryContent": {
		"message": "Summary 내용",
		"description": ""
	},
	"Structure": {
		"message": "구조",
		"description": ""
	},
	"ErrorType": {
		"message": "오류 유형",
		"description": ""
	},
	"Title": {
		"message": "제목",
		"description": ""
	},
	"Event": {
		"message": "이벤트",
		"description": ""
	},
	"TitleAttribute": {
		"message": "title 속성값",
		"description": ""
	},
	"FormType": {
		"message": "폼 유형",
		"description": ""
	},
	"LabelConnection": {
		"message": "label 연결",
		"description": ""
	},
	"CannotCheckFrameset": {
		"message": "프레임셋 페이지는 검사할 수 없습니다. 프레임셋에 포함된 URL로 이동하여 재시도하실 수 있습니다.",
		"description": ""
	},
	"ValidationTimeout": {
		"message": "시간초과",
		"description": ""
	},
	"ValidateManually": {
		"message": "수동 검사",
		"description": ""
	},

	"No1": {
		"message": "적절한 대체 텍스트",
		"description": ""
	},
  "No3": {
		"message": "색에 무관한 콘텐츠 인식",
		"description": ""
  },
	"No5": {
		"message": "텍스트 콘텐츠의 명도 대비",
		"description": ""
	},
	"No8": {
		"message": "초점 이동",
		"description": ""
	},
	"No12": {
		"message": "건너뛰기 링크",
		"description": ""
	},
	"No13": {
		"message": "제목 제공",
		"description": ""
	},
	"No14": {
		"message": "적절한 링크 텍스트",
		"description": ""
	},
	"No15": {
		"message": "기본 언어 표시",
		"description": ""
	},
	"No16": {
		"message": "사용자 요구에 따른 실행",
		"description": ""
	},
	"No18": {
		"message": "표의 구성",
		"description": ""
	},
	"No19": {
		"message": "레이블 제공",
		"description": ""
	},
	"No21": {
		"message": "마크업 오류 방지",
		"description": ""
	}
}
;
/*jslint browser: true */
/*global achecker_locale */

(function (global) {
  "use strict";

  var achecker = global.achecker || {};
  achecker.i18n = {
    get: function (val) {
      return achecker_locale.messages[val].message || '';
    }
  };
}(window));

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

    var res = g.achecker.Wax.run(cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls);
    var header = res.header;
    var sections = res.sections;
    var score = g.achecker.Wax.scoreAsElement(cwin, rdoc, sections, true);

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
      css.href = "http://openwax.miya.pe.kr/c/bookmarklet.css?t=" + new Date().valueOf();
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
