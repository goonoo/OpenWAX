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
 * Goonoo Kim (http://miya.pe.kr).
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
