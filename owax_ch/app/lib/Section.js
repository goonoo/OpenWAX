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
}(this));
