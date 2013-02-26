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
    "altText": 25,
    "altTextBG": 5,
    "kbdFocus": 10,
    "skipNav": 10,
    "frame": 10,
    "linkText": 10,
    "pageLang": 10,
    "unintendedFunction": 10,
    "label": 10
  };

  var getLevel = function (score) {
    if (score === 100) {
      return "perfect";
    } else if (score > 80) {
      return "good";
    } else if (score > 60) {
      return "bad";
    } else {
      return "fail";
    }
  };

  g.achecker = g.achecker || {};
  g.achecker.Pajet = g.achecker.Pajet || {};
  g.achecker.Pajet.score = function (pajetSections) {
    var score = 0, info;

    for (var key in sectionWeights) {
      if (sectionWeights.hasOwnProperty(key)) {
        info = pajetSections[key] ? pajetSections[key].getScore() : null;
        if (info && info.all > 0) {
          score += parseInt(info.pass / info.all * sectionWeights[key] * 10, 10) / 10;
        } else {
          score += parseInt(sectionWeights[key], 10);
        }
      }
    }

    return score;
  };
  g.achecker.Pajet.scoreAsElement = function (pajetSections) {
    var score = g.achecker.Pajet.score(pajetSections);
    var rdoc = g.document;
    var $div = rdoc.createElement('div');
    $div.className = 'pajetScore ' + getLevel(score);

    var $title = rdoc.createElement('h2');
    var $label = rdoc.createElement('i');
    $label.innerText = "WAX Score: ";
    $label.textContent = "WAX Score: ";
    var $score = rdoc.createElement('strong');
    $score.innerText = score;
    $score.textContent = score;

    $title.appendChild($label);
    $title.appendChild($score);
    $div.appendChild($title);

    return $div;
  };
}(window));
