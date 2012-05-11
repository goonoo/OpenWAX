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
(function() {
achecker = window.achecker || {};
achecker.Pajet = achecker.Pajet || {};
var ListSection = achecker.Pajet.ListSection;
var TableSection = achecker.Pajet.TableSection;
var ToolSection = achecker.Pajet.ToolSection;
var getElsFromChildNodes = function(pEl, tagName) {
	if (pEl.length && pEl.push) {
		var els = [];
		for (var i=0; i<pEl.length; i++) {
			els = els.concat(getElsFromChildNodes(pEl[i], tagName));
		};
		return els;
	};
	var n = pEl.childNodes;
	if (n && n.length) {
		var els = [];
		for (var i=0; i<n.length; i++) {
			if (n[i].tagName && n[i].tagName.toLowerCase() == tagName.toLowerCase()) {
				els.push(n[i]);
			};
		};
		return els;
	};
	return [];
};

var getContrastRatio = function(color1, color2) {
	var l1; // higher value
	var l2; // lower value
	var contrast;
	var l1R, l1G, l1B, l2R, l2G, l2B;

	// error check, check if pound sign was put in field value
	if (color2.indexOf('#') == 0) {
		color2 = color2.substr(1, color2.length-1);
	}
	if (color1.indexOf('#') == 0) {
		color1 = color1.substr(1, color1.length-1);
	}

	//Linearised R (for example) = (R/FS)^2.2 where FS is full scale value (255
	//for 8 bit color channels). L1 is the higher value (of text or background)
	//alert(parseInt("0x"+color1.substr(0,2)));
	//Math.pow(n,x);
	l1R = parseInt("0x"+color1.substr(0,2))/255;
	if (l1R <= 0.03928) {
		l1R = l1R/12.92;
	} else {
		l1R = Math.pow(((l1R+0.055)/1.055),2.4);
	}
	l1G = parseInt("0x"+color1.substr(2,2))/255;
	if (l1G <= 0.03928) {
		l1G = l1G/12.92;
	} else {
		l1G = Math.pow(((l1G+0.055)/1.055),2.4);
	}
	l1B = parseInt("0x"+color1.substr(4,2))/255;
	if (l1B <= 0.03928) {
		l1B = l1B/12.92;
	} else {
		l1B = Math.pow(((l1B+0.055)/1.055),2.4);
	}
	l2R = parseInt("0x"+color2.substr(0,2))/255;
	if (l2R <= 0.03928) {
		l2R = l2R/12.92;
	} else {
		l2R = Math.pow(((l2R+0.055)/1.055),2.4);
	}
	l2G = parseInt("0x"+color2.substr(2,2))/255;
	if (l2G <= 0.03928) {
		l2G = l2G/12.92;
	} else {
		l2G = Math.pow(((l2G+0.055)/1.055),2.4);
	}
	l2B = parseInt("0x"+color2.substr(4,2))/255;
	if (l2B <= 0.03928) {
		l2B = l2B/12.92;
	} else {
		l2B = Math.pow(((l2B+0.055)/1.055),2.4);
	}
	//where L is luminosity and is defined as
	l1 = (.2126*l1R) + (.7152*l1G) + (.0722*l1B); //using linearised R, G, and B value
	l2 = (.2126*l2R) + (.7152*l2G) + (.0722*l2B); //using linearised R, G, and B value
	//and L2 is the lower value.
	l1 = l1 + .05;
	l2 = l2 + .05;
	if (l1 < l2) {
	  temp = l1;
	  l1 = l2;
	  l2 = temp;
	}
	l1 = l1/l2;
	l1 = l1.toFixed(1);
	return l1;
};

var getTextContent = function(el) {
	var txt = '';
	var nodeType = el.nodeType;
	var tagName = el.tagName ? el.tagName.toUpperCase() : '';
	var attrType = el.getAttribute ? el.getAttribute('type') : '';
	try {
		var computedStyle = el.ownerDocument.defaultView.getComputedStyle(el, null);
		var styleDisplay = computedStyle.display;
	} catch(e) {
		var styleDisplay = "";
	};

	if (nodeType == Node.ELEMENT_NODE &&
			styleDisplay == 'none') {
		txt = '';
	} else if (nodeType == Node.ELEMENT_NODE &&
			tagName == "IMG") {
		txt = el.getAttribute('alt');
	} else if (nodeType == Node.ELEMENT_NODE &&
			tagName == "AREA") {
		txt = el.getAttribute('alt');
	} else if (nodeType == Node.ELEMENT_NODE &&
			tagName == "INPUT" &&
			attrType == 'image') {
		txt = el.getAttribute('alt');
	} else if (nodeType == Node.ELEMENT_NODE &&
			tagName == "INPUT" &&
			(attrType == 'submit' ||
				attrType == 'reset' ||
				attrType == 'button')) {
		txt = el.value;
	} else if (nodeType == Node.ELEMENT_NODE &&
			tagName == "INPUT") {
		txt = getLabel(el);
	} else if (nodeType == Node.ELEMENT_NODE &&
			(tagName == "TEXTAREA" || tagName == "SELECT")) {
		txt = getLabel(el);
	} else if (nodeType == Node.ELEMENT_NODE &&
			(tagName == "SCRIPT" || tagName == "STYLE")) {
		// do nothing
	} else {
		var cNodes = el.childNodes;
		for (var i=0, l=cNodes.length; i<l; i++) {
			if (cNodes[i].nodeType == Node.TEXT_NODE)
				txt += cNodes[i].nodeValue;
			else
				txt += getTextContent(cNodes[i]);
		};
	};
	txt = txt ? txt.replace(/^\s+/, '').replace(/\s+$/, '') : '';
	return txt;
};

var getLabel = function(element) {
    var currentLabel = "";
    var currentLabelElement;
    var doc = element.ownerDocument;

    labelLoop:
    for (var i=0, l=doc.getElementsByTagName("label").length; i<l; i++) {
        var labelElement = doc.getElementsByTagName("label")[i];
        var labelChilds = labelElement.childNodes;

        if (labelElement.htmlFor && labelElement.htmlFor == element.id) {
            currentLabelElement = labelElement;
            break labelLoop;
        };
        for (var _i=0, _l=labelChilds.length; _i<_l; _i++) {
            if (labelChilds[_i] == element) {
                currentLabelElement = labelElement;
                break labelLoop;
            };
        };
    };

    if (currentLabelElement) {
        var labelChilds = currentLabelElement.childNodes;
        for (var i=0, l=labelChilds.length; i<l; i++) {
            if (!labelChilds[i].tagName) // check is text node
                currentLabel += labelChilds[i].nodeValue.replace(/^\s+/, "").replace(/\s+$/, "");
        };
    };
    if (!currentLabel) {
        if (element.title)
            currentLabel = element.title;
        else if (element.id)
            currentLabel = element.id;
        else if (element.name)
            currentLabel = element.name;
        else
            currentLabel = "";
    };
    return currentLabel;
};

var getAbsolutePath = function(src, url) {
	if (src && src.indexOf('//') === -1) {
		if (src.substr(0,3) == '../') {
			var newpath = url.substr(0,url.lastIndexOf('/')>10?url.lastIndexOf('/'):url.length);
			while (src.substr(0,3) == '../') {
				newpath = newpath.substr(0,newpath.lastIndexOf('/')>10?newpath.lastIndexOf('/'):newpath.length);
				src = src.substr(3);
			};
			src = newpath + '/'+ src;
		} else if (src.substr(0,1) == '/') {
			var orgPath = url.replace(/^((?:https?\:\/\/|file\:\/\/\/)[^\/]+)\/.*$/, '$1');
			src = orgPath + '/'+ src;
		} else {
			var orgPath = url.substr(0,url.lastIndexOf('/'));
			src = orgPath + '/'+ src;
		};
	};
	return src;
};

achecker.Pajet.run = function(cwin, rdoc, isIncludeFrame, frameDocs, discardFrameUrls) {
	return {
		header: (function() {
			var $div = rdoc.createElement('div');
			$div.className = 'pajetFrames';

			var $fold = rdoc.createElement('div');
			var $foldLabel = rdoc.createElement('span');
			var $foldBtn = rdoc.createElement('button');

			$fold.className = 'foldcontrol';
			$foldLabel.className = 'all';
			$foldLabel.textContent = 'All';
			$foldBtn.className = 'unfold';
			$foldBtn.setAttribute('data-folded', 'folded');
			$foldBtn.title = achecker.i18n.get('FoldAll');
			$foldBtn.setAttribute('type', 'button');
			$foldBtn.textContent = 'Unfold';
			$foldBtn.onclick = function() {
				var $headings = rdoc.querySelectorAll('.pajetSection h2,.pajetFrames h2');
				var foldedClass = this.getAttribute('data-folded') == 'folded' ? '' : 'folded';

				for (var i=0, l=$headings.length; i<l; i++) {
					$headings[i].className = foldedClass;
				};

				if (foldedClass) {
					this.className = 'unfold';
					this.title = achecker.i18n.get('UnfoldAll');
					this.textContent = 'Unfold';
				} else {
					this.className = 'fold';
					this.title = achecker.i18n.get('FoldAll');
					this.textContent = 'Fold';
				};
				this.setAttribute('data-folded', foldedClass);
			};
			$fold.appendChild($foldLabel);
			$fold.appendChild($foldBtn);
			$div.appendChild($fold);

			var $title = rdoc.createElement('h2');
			$title.className = 'folded';
			$title.textContent = achecker.i18n.get('TargetPage');
			$title.addEventListener('click', function() {
				var oldClassName = this.className;
				this.className = oldClassName == 'folded' ?
						'' : 'folded';
			}, false);
			var $pages = rdoc.createElement('ul');
			var $topPage = rdoc.createElement('li');
			var $topPageLink = rdoc.createElement('a');
			$topPageLink.setAttribute('href', cwin.location.href);
			$topPageLink.setAttribute('target', '_blank');
			$topPageLink.textContent = cwin.location.href;
			$topPage.appendChild($topPageLink);
			$pages.appendChild($topPage);
			if (isIncludeFrame) {
				for (var i=0, l=frameDocs.length; i<l; i++) {
					var $page = rdoc.createElement('li');
					var $pageLink = rdoc.createElement('a');
					$pageLink.setAttribute('href', frameDocs[i].src);
					$pageLink.setAttribute('target', '_blank');
					$pageLink.textContent = frameDocs[i].src;
					$page.appendChild($pageLink);
					$pages.appendChild($page);
				};
			};
			$div.appendChild($title);
			$div.appendChild($pages);

			if (discardFrameUrls && discardFrameUrls.length) {
				var $title = rdoc.createElement('h2');
				$title.textContent = achecker.i18n.get('NoneTargetPage');
				$title.className = 'folded';
				$title.addEventListener('click', function() {
					var oldClassName = this.className;
					this.className = oldClassName == 'folded' ?
							'' : 'folded';
				}, false);
				var $pages = rdoc.createElement('ul');
				for (var i=0, l=discardFrameUrls.length; i<l; i++) {
					var $page = rdoc.createElement('li');
					var $pageLink = rdoc.createElement('a');
					$pageLink.setAttribute('href', discardFrameUrls[i]);
					$pageLink.setAttribute('target', '_blank');
					$pageLink.textContent = discardFrameUrls[i];
					$page.appendChild($pageLink);
					$pages.appendChild($page);
				};
			};
			$div.appendChild($title);
			$div.appendChild($pages);
			return $div;
		})(),
		sections: {
			altText: new TableSection(
				cwin, rdoc, 
				'1.1.1 '+ achecker.i18n.get('AltText') +' (img)',
				'input[type=image],img,area',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Preview'), width: 106},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function(doc, url) {
					var tagName = this.tagName.toLowerCase();
					var data = {
						hidden: '',
						preview: '',
						el: '',
						alt: ''
					};

					switch (tagName) {
						case "input":
							if (this.type.toLowerCase() != 'image') {
								break;
							};
						case "img":
							var hasAlt = this.getAttribute('alt') !== null;
							data.alt = rdoc.createElement('span');
							if (!hasAlt) {
								data.alt.textContent = 'alt '+ achecker.i18n.get('Undefined');
							} else if (!this.getAttribute('alt')) {
								data.alt.textContent = 'alt=""';
							} else {
								data.alt.textContent = this.getAttribute('alt');
							};
							data.el = tagName;

							if (this.getAttribute('longdesc')) {
								var $longdesc = rdoc.createElement('a');
								$longdesc.setAttribute('href',
									getAbsolutePath(this.getAttribute('longdesc'), url));
								$longdesc.setAttribute('target', '_blank');
								$longdesc.textContent = 'longdesc link';
								data.alt.textContent += ' ';
								data.alt.appendChild($longdesc);
							};

							var src = this.getAttribute('src');

							var $img = rdoc.createElement('img');
							$img.setAttribute('alt', '');
							$img.setAttribute('src', getAbsolutePath(src, url));
							data.preview = $img;

							return [
								data.hidden,
								data.preview,
								data.el,
								data.alt
							];
						case "AREA":
							var hasAlt = this.getAttribute('alt') !== null;
							data.alt = rdoc.createElement('span');
							if (!hasAlt) {
								data.alt.textContent = 'alt '+ achecker.i18n.get('Undefined');
							} else if (!this.getAttribute('alt')) {
								data.alt.textContent = 'alt=""';
							} else {
								data.alt.textContent = this.getAttribute('alt');
							};
							data.el = tagName;

							return [
								data.hidden,
								data.preview,
								data.el,
								data.alt
							];
					};

					return false;
				},
				function() {
					var tagName = this.tagName;
					switch (tagName) {
						case "IMG":
						case "INPUT":
						case "AREA":
							var hasAlt = this.getAttribute('alt') !== null;
			
							if (!hasAlt) {
								return 'fail';
							} else if (!this.getAttribute('alt')) {
								return 'warning';
							} else {
								return 'pass';
							};
					}
				}
			),

			altTextBG: new TableSection(
				cwin, rdoc, 
				'1.1.1 '+ achecker.i18n.get('AltText') +' (bg)',
				'body *',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Preview'), width: 106},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function(doc, url) {
					var data = {
						hidden: '',
						preview: '',
						content: ''
					};
					var computedStyle = cwin.getComputedStyle(this,null);
					var bgImage = computedStyle.backgroundImage;
					if (bgImage != 'none' &&
							this.getElementsByTagName('*').length < 10) {
						var url = bgImage.replace(/^url\("?/, '').replace(/"?\)$/, '');
						var $bg = rdoc.createElement('span');

						with ($bg.style) {
							backgroundImage = bgImage;
							backgroundPosition = computedStyle.backgroundPosition;
							backgroundRepeat = computedStyle.backgroundRepeat;
							width = computedStyle.width;
							height = computedStyle.height;
							maxWidth = '100px';
							maxHeight = '200px';
							display = 'inline-block';
							overflow = 'hidden';
						};

						data.preview = $bg;
						data.content = getTextContent(this);

						return [
							data.hidden,
							data.preview,
							data.content
						];
					};

					return false;
				}
			),

			altTextEmbed: new TableSection(
				cwin, rdoc, 
				'1.1.1 '+ achecker.i18n.get('AltText') +' (object)',
				'object,embed,video,audio,canvas,svg',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Element')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function(doc, url) {
					var tagName = this.tagName;
					switch (tagName) {
						case "OBJECT":
							if (this.parentNode && this.parentNode.tagName &&
									(this.parentNode.tagName == 'OBJECT' || 
										this.parentNode.tagName == 'EMBED'))
								return false;
							return [
								'',
								'<object>'
							];
						case "EMBED":
							if (this.parentNode && this.parentNode.tagName &&
									(this.parentNode.tagName == 'OBJECT' || 
										this.parentNode.tagName == 'EMBED'))
								return false;
							return [
								'',
								'<embed>'
							];
					};

					return false;
				}
			),

			validation: new ToolSection(
				cwin, rdoc, 
				'w3c_validation',
				'2.2.1 W3C Validation',
				function(win, rdoc) {
					var filterValidationResult = function(res) {
						var msgs = res.messages, newmsgs = [];
						var filters = [
							/^unterminated comment: .*/,
							/^literal is missing closing delimiter.*/,
							/^unknown declaration type .*/,
							/^document type does not allow element .* here; missing one of .* start\-tag.*/,
							/^end tag for .* omitted, but its declaration does not permit this.*/,
							/^end tag for .* which is not finished.*/,
							/^end tag for element .* which is not open.*/,
							/^an attribute value must be a literal unless it contains only name characters.*/,
							/^an attribute value literal can occur in an attribute specification list only after a VI delimiter.*/,
							/^normalized length of attribute value literal must not exceed.*/,
							/^syntax of attribute value does not conform to declared value.*/,
							/^value of attribute .* must be a single token.*/,
							/^value of attribute .* cannot be .*; must be one of .*/,
							/^invalid comment declaration:.*/,
							/^ID .* already defined.*/,
							/^no document type declaration; will parse without validation.*/,
							/^unclosed start-tag requires SHORTTAG YES.*/,
							/^unclosed end-tag requires SHORTTAG YES.*/,
							/^DTD did not contain element declaration for document type name.*/,
							/^empty start-tag.*/,
							/^empty end-tag.*/,
							/^no document type declaration; implying .*/,
							/^no system id specified.*/,
							/^.* separator in comment declaration.*/,
						];

						for (var i=0; i<msgs.length; i++) {
							if (msgs[i].type == 'error') {
								for (var j=0; j<filters.length; j++) {
									if (filters[j].test(msgs[i].message)) {
										newmsgs.push(msgs[i]);
										break;
									};
								};
							};
						};

						res.messages = newmsgs;
						return res;
					};

					var getResultDetailEl = function(messages, url) {
						var $res = rdoc.createElement('div');
						$res.className = 'validationResult'
						var $errhead = rdoc.createElement('h3');
						$errhead.textContent = 'Error';
						$errhead.className = 'fail';
						var $errul = rdoc.createElement('ul');
						var $warninghead = rdoc.createElement('h3');
						$warninghead.textContent = 'Warning';
						$warninghead.className = 'warning';
						var $warningul = rdoc.createElement('ul');
						for (var i=0; i<messages.length; i++) {
							var msg = messages[i];
							var $li = rdoc.createElement('li');
							var $msg = rdoc.createElement('div');
							var $msga = rdoc.createElement('a');
							$msga.textContent = msg.message;
							$msga.setAttribute('href', 'javascript:;');
							$msga.setAttribute('data-line', msg.lastLine);
							$msga.addEventListener('click', function(e) {
								e.preventDefault();
								e.stopPropagation();
								openDialog("chrome://global/content/viewSource.xul",
						             "achecker_sourceView",
						             "scrollbars,resizable,chrome,dialog=no",
						             url,null,null,this.getAttribute('data-line'),false);
							}, false);
							$msg.appendChild($msga);
							var $subinfo = rdoc.createElement('div');
							$subinfo.className = 'subinfo';
							$subinfo.textContent = msg.lastLine +' line, '+ msg.lastColumn +' column';
							$li.appendChild($msg);
							$li.appendChild($subinfo);
							switch (msg.type) {
								case 'error':
									$errul.appendChild($li);
									break;
								case 'info':
									$warningul.appendChild($li);
									break;
							};
						};
						$res.appendChild($errhead);
						$res.appendChild($errul);
						$res.appendChild($warninghead);
						$res.appendChild($warningul);
						return $res;
					};

					var doValidation = function(url, doc) {
						var sourceUrl = url;
						var req = new XMLHttpRequest();   
						req.onreadystatechange = function() {
							if (req.readyState == 4) {
								if (req.status == 200) {
									// IT WORKS!
									var html = req.responseText;
									var req2 = new XMLHttpRequest();
									var charset = html.indexOf('euc-kr')>0?'euc-kr':'utf-8';
									req2.onreadystatechange = function() {
										if (req2.readyState == 4) {
											if (req2.status == 200) {
												var res = filterValidationResult(JSON.parse(req2.responseText));
												var el = rdoc.getElementById("w3c_validation");
												var itemEls = el.querySelectorAll("li.validationItem");
												var errcnt = 0;
												for (var i=0; i<res.messages.length; i++) {
													if (res.messages[i].type == 'error')
														errcnt++;
												};
												for (var i=0; i<itemEls.length; i++) {
													var urlEl = itemEls[i].getElementsByClassName("url")[0];
													var errcntEl = itemEls[i].getElementsByClassName("errcnt")[0];
													if (urlEl.textContent == url) {
														//urlEl.setAttribute('href', 'validation_result.html?res='+ encodeURIComponent(req2.responseText));
														errcntEl.textContent = errcnt +' Errors';
														itemEls[i].className = errcnt > 0 ? 'fail' : 'pass';
														var $res = getResultDetailEl(res.messages, url);
														$res.style.display = 'none';
														itemEls[i].appendChild($res);
														itemEls[i].onclick = function() {
															var $res = this.getElementsByTagName("div")[0];
															$res.style.display = $res.style.display == 'none' ? 'block' : 'none';
														};
													};
												};
											}
										};
									};
									req2.open("POST", "http://validator.w3.org/check", true);

									// Firefox < 4
									if (typeof FormData == "undefined") {
										req2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
										req2.send('fragment='+ escape(html) +
												'&doctype=Inline' +
												'&output=json');
									} else {
										var formData = new FormData();
										formData.append('fragment', html);
										formData.append('doctype', 'Inline');
										formData.append('output', 'json');
										req2.send(formData);
									};
								} else {
									alert(achecker.i18n.get('ValidationFail'));
								};
							};
						};
						req.open("GET",sourceUrl,true);
						req.send(null);
					};

					var urls = [], docs = [];
					if (win.location.href.substr(0,7) == 'http://' ||
								win.location.href.substr(0,8) == 'https://') {
						urls.push(win.location.href);
						docs.push(win.document);
					};
					if (isIncludeFrame) {
						for (var i=0, l=frameDocs.length; i<l; i++) {
							var _url = frameDocs[i].src;
							if (_url.substr(0,7) == 'http://' || _url.substr(0,8) == 'https://') {
								urls.push(_url);
								docs.push(frameDocs[i]);
							};
						};
					};

					var $output = rdoc.createElement('ul');
					for (var i=0, l=urls.length; i<l; i++) {
						doValidation(urls[i], docs[i]);
						var $item = rdoc.createElement('li');
						$item.className = 'validationItem';
						var $_url = rdoc.createElement('span');
						$_url.className = 'url';
						$_url.textContent = urls[i];
						var $_errcnt = rdoc.createElement('b');
						$_errcnt.className = 'errcnt';
						$_errcnt.textContent = achecker.i18n.get('Loading');
						$item.appendChild($_url);
						$item.appendChild(rdoc.createTextNode(': '));
						$item.appendChild($_errcnt);
						$output.appendChild($item);
					};
					return $output;
				}
			),
	
			tableTitle: new TableSection(
				cwin, rdoc,
				'2.3.1 '+ achecker.i18n.get('TableTitle'),
				'table',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('CaptionContent'), className: 'lt'},
					{label: achecker.i18n.get('SummaryContent')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function() {
					var childNodes = this.childNodes,
						$caption = null,
						data = {
							hidden: '',
							caption: '',
							summary: ''
						};
					for (var i=0; i<childNodes.length; i++) {
						if (childNodes[i].tagName &&
								childNodes[i].tagName.toLowerCase() == 'caption') {
							$caption = childNodes[i];
							break;
						};
					};
					var hasCaption = !!$caption;
					var hasSummary = !!this.getAttribute('summary');

					data.caption = hasCaption ? getTextContent($caption) : achecker.i18n.get('None');
					data.summary = hasSummary ? this.getAttribute('summary') : achecker.i18n.get('None');

					return [
						data.hidden,
						data.caption,
						data.summary
					];
				},
				function() {
					var childNodes = this.childNodes,
						$caption = null;
					for (var i=0; i<childNodes.length; i++) {
						if (childNodes[i].tagName &&
								childNodes[i].tagName.toLowerCase() == 'caption') {
							$caption = childNodes[i];
							break;
						};
					};
					var hasCaption = !!$caption;
					var hasSummary = !!this.getAttribute('summary');

					return hasCaption ? 'pass' : 'fail';
				}
			),

			tableStructure: new TableSection(
				cwin, rdoc,
				'2.3.2, 2.3.3 '+ achecker.i18n.get('TableStructure'),
				'table',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Structure'), className: 'tb_str'}
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function() {
					var data = {
						hidden: '',
						structure: ''
					};
					var $thead = getElsFromChildNodes(
									this, 'thead'
								);
					var $tfoot = getElsFromChildNodes(
									this, 'tfoot'
								);
					var $tbody = getElsFromChildNodes(
									this, 'tbody'
								);
					var $theadTh = getElsFromChildNodes(
							getElsFromChildNodes(
								$thead, 'tr'
							), 'th'
						);
					var $tfootTh = getElsFromChildNodes(
							getElsFromChildNodes(
								$tfoot, 'tr'
							), 'th'
						);
					var $tbodyTh = getElsFromChildNodes(
							getElsFromChildNodes(
								$tbody, 'tr'
							), 'th'
						).concat(
							getElsFromChildNodes(
								getElsFromChildNodes(
									this, 'tr'
								), 'th'
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
					$resultTheadTh1.textContent = '요소';
					$resultTheadTh2.textContent = '유무';
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
					if ($thead.length) {
						var $resultTd3Ul = rdoc.createElement('ul');
						$resultTd1.textContent = 'thead';
						$resultTd2.textContent = 'O';
						for (var i=0,l=$theadTh.length; i<l; i++) {
							var $th = $theadTh[i];
							var scope = $th.getAttribute('scope');
							var $infoItem = rdoc.createElement('li');

							$infoItem.textContent = getTextContent($th) +
								(!!scope ? '(' + scope + ')' : '(X)');
							$resultTd3Ul.appendChild($infoItem);
						};
						$resultTd3.appendChild($resultTd3Ul);
					} else {
						$resultTd1.textContent = 'thead';
						$resultTd2.textContent = 'X';
						$resultTd3.textContent = '-';
					};
					$resultTr.appendChild($resultTd1);
					$resultTr.appendChild($resultTd2);
					$resultTr.appendChild($resultTd3);
					$resultTbody.appendChild($resultTr);

					var $resultTr = rdoc.createElement('tr');
					var $resultTd1 = rdoc.createElement('td');
					var $resultTd2 = rdoc.createElement('td');
					var $resultTd3 = rdoc.createElement('td');
					if ($tfoot.length) {
						var $resultTd3Ul = rdoc.createElement('ul');
						$resultTd1.textContent = 'tfoot';
						$resultTd2.textContent = 'O';
						for (var i=0,l=$tfootTh.length; i<l; i++) {
							var $th = $tfootTh[i];
							var scope = $th.getAttribute('scope');
							var $infoItem = rdoc.createElement('li');

							$infoItem.textContent = getTextContent($th) +
								(!!scope ? '(' + scope + ')' : '(X)');
							$resultTd3Ul.appendChild($infoItem);
						};
						$resultTd3.appendChild($resultTd3Ul);
					} else {
						$resultTd1.textContent = 'tfoot';
						$resultTd2.textContent = 'X';
						$resultTd3.textContent = '-';
					};
					$resultTr.appendChild($resultTd1);
					$resultTr.appendChild($resultTd2);
					$resultTr.appendChild($resultTd3);
					$resultTbody.appendChild($resultTr);

					var $resultTr = rdoc.createElement('tr');
					var $resultTd1 = rdoc.createElement('td');
					var $resultTd2 = rdoc.createElement('td');
					var $resultTd3 = rdoc.createElement('td');
					if ($tbody.length) {
						var $resultTd3Ul = rdoc.createElement('ul');
						$resultTd1.textContent = 'tbody';
						$resultTd2.textContent = 'O';
						for (var i=0,l=$tbodyTh.length; i<l; i++) {
							var $th = $tbodyTh[i];
							var scope = $th.getAttribute('scope');
							var $infoItem = rdoc.createElement('li');

							$infoItem.textContent = getTextContent($th) +
								(!!scope ? '(' + scope + ')' : '(X)');
							$resultTd3Ul.appendChild($infoItem);
						};
						$resultTd3.appendChild($resultTd3Ul);
					} else {
						$resultTd1.textContent = 'tbody';
						$resultTd2.textContent = 'X';
						$resultTd3.textContent = '-';
					};
					$resultTr.appendChild($resultTd1);
					$resultTr.appendChild($resultTd2);
					$resultTr.appendChild($resultTd3);
					$resultTbody.appendChild($resultTr);

					data.structure = $resultTable;

					return [
						data.hidden,
						data.structure
					];
				},
				function() {
					var $theadTh = getElsFromChildNodes(
							getElsFromChildNodes(
								getElsFromChildNodes(
									this, 'thead'
								), 'tr'
							), 'th'
						);
					var $tfootTh = getElsFromChildNodes(
							getElsFromChildNodes(
								getElsFromChildNodes(
									this, 'tfoot'
								), 'tr'
							), 'th'
						);
					var $tbodyTh = getElsFromChildNodes(
							getElsFromChildNodes(
								getElsFromChildNodes(
									this, 'tbody'
								), 'tr'
							), 'th'
						).concat(
							getElsFromChildNodes(
								getElsFromChildNodes(
									this, 'tr'
								), 'th'
							)
						);
					var hasTh = $theadTh.length || $tfootTh.length || $tbodyTh.length;
					var hasScope = function($ths) {
						for (var i=0, l=$ths.length; i<l; i++) {
							if (!$ths[i].getAttribute('scope'))
								return false;
						};
						return true;
					};

					return hasTh && hasScope($theadTh) && hasScope($tfootTh) &&
							hasScope($tbodyTh) ? 'pass' : 'fail';
				}
			),
	
			documentsForView: new ListSection(
				cwin, rdoc,
				'2.6.1 ('+ achecker.i18n.get('LevelAA') +') '+ achecker.i18n.get('DocumentsForView'),
				'[href$=".doc"],[href$=".ppt"],[href$=".hwp"]', null,
				isIncludeFrame,
				frameDocs, achecker.i18n.get('RequireConfirmation'),
				function() {
					return this.textContent;
				}
			),

			sKey: new TableSection(
				cwin, rdoc,
				'2.7.2 ('+ achecker.i18n.get('LevelAA') +') '+ achecker.i18n.get('ShortCut'),
				'[accesskey]',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('ShortCut'), width: 45},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function() {
					var hidden = '';
					return [
						hidden,
						this.getAttribute('accesskey'),
						this.tagName.toLowerCase(),
						this.textContent
					];
				},
				function() {
					var allowKeys = '~`!@#$%^&*()-_+[]{};:\'",.<>/?\\|1234567890BGIKWY';
					var accesskey = this.getAttribute('accesskey').toUpperCase();

					return allowKeys.indexOf(accesskey) > -1 ? 'pass' : 'fail';
				}
			),
	
			pageLang: new ListSection(
				cwin, rdoc,
				'3.1.1 '+ achecker.i18n.get('PageMainLang'),
				'html', null,
				isIncludeFrame,
				frameDocs, '-',
				function(doc, url) {
					var isXhtml = this.getAttribute('xmlns');
					var val = '';
					var $res = rdoc.createElement('span');

					if (isXhtml && this.getAttribute('xml:lang') && this.getAttribute('lang')) {
						val = 'xml:lang=' + this.getAttribute('xml:lang') +', lang=' + this.getAttribute('lang');
					} else if (isXhtml && this.getAttribute('xml:lang')) {
						val = 'xml:lang=' + this.getAttribute('xml:lang');
					} else if (isXhtml && this.getAttribute('lang')) {
						val = 'xml:lang='+ achecker.i18n.get('None') +', lang=' + this.getAttribute('lang');
					} else if (!isXhtml && this.getAttribute('lang')) {
						val = 'lang=' + this.getAttribute('lang');
					} else {
						val = achecker.i18n.get('NoMainLang');
					}
					$res.textContent = url + ': ';
					
					var $val = rdoc.createElement('strong');
					$val.textContent = val;
					$res.appendChild($val);
					return $res;
				},
				function(doc, url) {
					var isXhtml = this.getAttribute('xmlns');
	
					if (isXhtml && this.getAttribute('xml:lang')) {
						return 'pass';
					} else if (isXhtml && this.getAttribute('lang')) {
						return 'warning';
					} else if (!isXhtml && this.getAttribute('lang')) {
						return 'pass';
					} else {
						return 'fail';
					}
				}
			),

			contrast: new ToolSection(
				cwin, rdoc,
				'contrast',
				'3.3.1 '+ achecker.i18n.get('Contrast'),
				function(win, rdoc) {
					if (!achecker.colorInspector) {
						var $res = rdoc.createElement('p');
						$res.className = 'comment';
						$res.textContent = 'Not Supported.';
						return $res;
					};

					var $ul = rdoc.createElement('ul');
					$ul.className = 'contrast';
					var $color1 = rdoc.createElement('li');
					var $color2 = rdoc.createElement('li');
					var $result = rdoc.createElement('li');

					$color1.className = 'color1';
					var $color1_label = rdoc.createElement('span');
					$color1_label.textContent = achecker.i18n.get('Foreground') +': ';
					var $color1_color = rdoc.createElement('span');
					$color1_color.className = 'color';
					$color1_color.style.backgroundColor = '#000';
					var $color1_val = rdoc.createElement('span');
					$color1_val.className = 'val';
					$color1_val.textContent = '#000000';
					var $color1_btn = rdoc.createElement('button');
					$color1_btn.textContent = achecker.i18n.get('SelectForegroundColor');
					$color1.appendChild($color1_label);
					$color1.appendChild($color1_color);
					$color1.appendChild(rdoc.createTextNode(' '));
					$color1.appendChild($color1_val);
					$color1.appendChild(rdoc.createTextNode(' '));
					$color1.appendChild($color1_btn);
					$color1.onclick = function() {
						achecker.showOverlay();
						achecker.colorInspector.startInspect(function(color) {
							achecker.hideOverlay();
							$color1.getElementsByClassName('color')[0].style.backgroundColor = color;
							$color1.getElementsByClassName('val')[0].textContent = color;
							var contrastRatio = getContrastRatio(color, $color2.getElementsByClassName('val')[0].textContent);
							if (contrastRatio >= 4.5)
								$result.className = 'pass';
							else if (contrastRatio >= 3)
								$result.className = 'warning';
							else
								$result.className = 'fail';
							$result.getElementsByClassName('result')[0].textContent = contrastRatio +':1';
							$result.getElementsByClassName('resultText')[0].style.color = color;
						});
					};

					$color2.className = 'color2';
					var $color2_label = rdoc.createElement('span');
					$color2_label.textContent = achecker.i18n.get('Background') +': ';
					var $color2_color = rdoc.createElement('span');
					$color2_color.className = 'color';
					$color2_color.style.backgroundColor = '#FFF';
					var $color2_val = rdoc.createElement('span');
					$color2_val.className = 'val';
					$color2_val.textContent = '#FFFFFF';
					var $color2_btn = rdoc.createElement('button');
					$color2_btn.textContent = achecker.i18n.get('SelectBackgroundColor');
					$color2.appendChild($color2_label);
					$color2.appendChild($color2_color);
					$color2.appendChild(rdoc.createTextNode(' '));
					$color2.appendChild($color2_val);
					$color2.appendChild(rdoc.createTextNode(' '));
					$color2.appendChild($color2_btn);
					$color2.onclick = function() {
						achecker.showOverlay();
						achecker.colorInspector.startInspect(function(color) {
							achecker.hideOverlay();
							$color2.getElementsByClassName('color')[0].style.backgroundColor = color;
							$color2.getElementsByClassName('val')[0].textContent = color;
							var contrastRatio = getContrastRatio(color, $color1.getElementsByClassName('val')[0].textContent);
							if (contrastRatio >= 4.5)
								$result.className = 'pass';
							else if (contrastRatio >= 3)
								$result.className = 'warning';
							else
								$result.className = 'fail';
							$result.getElementsByClassName('result')[0].textContent = contrastRatio +':1';
							$result.getElementsByClassName('resultText')[0].style.backgroundColor = color;
						});
					};

					$result.className = 'pass';
					var $result_label = rdoc.createElement('span');
					$result_label.textContent = achecker.i18n.get('Result') +': ';
					var $result_result = rdoc.createElement('span');
					$result_result.className = 'result';
					$result_result.textContent = '21:1';
					var $result_resultText = rdoc.createElement('span');
					$result_resultText.className = 'resultText';
					$result_resultText.textContent = achecker.i18n.get('Test');
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
				cwin, rdoc,
				'6.3.1 '+ achecker.i18n.get('KeyboardFocus'),
				'*',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('ErrorType'), width: 65},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs,
				achecker.i18n.get('RequireConfirmation'),
				function(doc, url) {
					try {
						var evtWrapper = this.wrappedJSObject ? this.wrappedJSObject : this;
						var hasBlurEvent = false;
						if (evtWrapper.onfocus && evtWrapper.onfocus.toString().indexOf('blur()') > -1)
							hasBlurEvent = true;
						else if (evtWrapper.onclick && evtWrapper.onclick.toString().indexOf('blur()') > -1)
							hasBlurEvent = true;
						var outlineWidth = this.style.getPropertyValue('outline-width');
						var zeroOutlineWidth = outlineWidth == '0' || outlineWidth == '0pt' || outlineWidth == '0px';
	
						if (hasBlurEvent) {
							return [
								'',
								'blur()',
								getTextContent(this)
							];
						} else if (zeroOutlineWidth) {
							return [
								'',
								'outline:0',
								getTextContent(this)
							];
						} else {
							return false;
						};
					} catch(e) {
						return false;
					};
				},
				function(doc, url) {
					try {
						var evtWrapper = this.wrappedJSObject ? this.wrappedJSObject : this;
						var hasBlurEvent = evtWrapper.onfocus ?
								evtWrapper.onfocus.toString().indexOf('blur()') > -1 : false;
						var outlineWidth = this.style.getPropertyValue('outline-width');
						var zeroOutlineWidth = outlineWidth == '0' || outlineWidth == '0pt' || outlineWidth == '0px';
	
						if (hasBlurEvent) {
							return 'fail';
						} else if (zeroOutlineWidth) {
							return 'fail';
						} else {
							return 'pass';
						};
					} catch(e) {
						return false;
					};
				}
			),

			pageTitle: new ListSection(
				cwin, rdoc,
				'7.1.1 '+ achecker.i18n.get('PageTitle'),
				'title', null,
				isIncludeFrame,
				frameDocs, '-',
				function(doc, url) {
					var $res = rdoc.createElement('span');
					var $val = rdoc.createElement('strong');
					var val = this.textContent ? this.textContent : achecker.i18n.get('NoPageTitle');

					$res.textContent = url +': ';
					$val.textContent = val;
					$res.appendChild($val);

					return $res;
				},
				function() {
					return this.textContent ? 'pass' : 'fail';
				}
			),

			frame: new TableSection(
				cwin, rdoc,
				'7.1.2 '+ achecker.i18n.get('UseFrame'),
				'iframe',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('Title'), className: 'lt'},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function() {
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
						$a.textContent = src;
						data.url = $a;
					} else {
						data.url = achecker.i18n.get('NoSrc');
					};
					data.title = title ? title : achecker.i18n.get('NoTitle');
					return [
						data.hidden,
						data.el,
						data.title,
						data.url
					];
				},
				function() {
					var title = this.getAttribute('title');
					return title ? 'pass' : 'fail';
				}
			),

			blockTitle: new TableSection(
				cwin, rdoc,
				'7.1.3 '+ achecker.i18n.get('BlockTitle'),
				'h1,h2,h3,h4,h5,h6',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('RequireConfirmation'),
				function() {
					return [
						'',
						this.tagName.toLowerCase(),
						getTextContent(this)
					];
				}
			),

			linkText: new TableSection(
				cwin, rdoc,
				'7.3.1 '+ achecker.i18n.get('LinkText'),
				'a,area',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('Contents')},
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function() {
					var text = getTextContent(this);
					var title = this.getAttribute('title');

					return [
						'',
						this.tagName.toLowerCase(),
						(text ? text : '-') +
							(title ? ' (title: '+ title +')' : '')
					];
				},
				function() {
					var text = getTextContent(this);

					return text ? 'pass' : 'fail';
				}
			),

			unintendedFunction: new TableSection(
				cwin, rdoc,
				'8.1.1 '+ achecker.i18n.get('UnintendedFunction'),
				'a,area,input,select,textarea',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Event'), width: 80},
					{label: achecker.i18n.get('Contents'), className: 'lt'},
					{label: achecker.i18n.get('TitleAttribute')}
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('RequireConfirmation'),
				function(doc, url) {
					var data = {
						hidden: '',
						event: '',
						content: '',
						title: ''
					};
					var evtWrapper = this.wrappedJSObject ? this.wrappedJSObject : this;
					try {
						var hasChangeEvent = !!evtWrapper.onchange;
						var hasWindowOpenEvent = evtWrapper.onclick ?
								evtWrapper.onclick.toString().indexOf('window.open') > -1 : false;
					} catch(e) {
						var hasChangeEvent = null;
						var hasWindowOpenEvent = null;
					};

					
					data.content = getTextContent(this);
					data.title = this.getAttribute('title') ? this.getAttribute('title') : '-';

					if (hasChangeEvent) {
						data.event = 'change';
					} else if (hasWindowOpenEvent) {
						data.event = 'window.open';
					} else {
						return false;
					};

					return [
						data.hidden,
						data.event,
						data.content,
						data.title
					];
				}
			),

			label: new TableSection(
				cwin, rdoc,
				'8.2.1 '+ achecker.i18n.get('Label'),
				'input,textarea,select',
				[
					{label: achecker.i18n.get('Hidden'), width: 45},
					{label: achecker.i18n.get('Element'), width: 45},
					{label: achecker.i18n.get('FormType'), width: 66},
					{label: achecker.i18n.get('LabelConnection'), className: 'lt'},
					{label: achecker.i18n.get('TitleAttribute')}
				],
				isIncludeFrame,
				frameDocs, achecker.i18n.get('NotApplicable'),
				function(doc, url) {
					if (this.tagName == 'INPUT' &&
							(this.getAttribute('type') == 'submit' ||
								this.getAttribute('type') == 'button' ||
								this.getAttribute('type') == 'image' ||
								this.getAttribute('type') == 'hidden' ||
								this.getAttribute('type') == 'reset')) {
						return false;
					};

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
						$label = null;
					if (_id) {
						for (var i=0, l=$labels.length; i<l; i++) {
							if ($labels[i].getAttribute('for') == _id) {
								hasLabelElement = true;
								$label = $labels[i];
								break;
							};
						};
					};
					var hasTitle = !!this.getAttribute('title');

					var hasImplicitLabel = false;
					var parentEl = this.parentNode;
					do {
						if (parentEl.tagName == 'LABEL') {
							hasImplicitLabel = true;
							$label = parentEl;
							break;
						};
					} while (parentEl = parentEl.parentNode);

					data.el = this.tagName.toLowerCase();
					data.type = this.getAttribute('type') ? this.getAttribute('type').toLowerCase() : '-';
					data.label = $label ? getTextContent($label) : '';
					if (!data.label) data.label = 'X';
					data.title = this.getAttribute('title');
					if (!data.title) data.title = '-';

					return [
						data.hidden,
						data.el,
						data.type,
						data.label,
						data.title
					];
				},
				function(doc, url) {
					var _id = this.getAttribute('id');
					var $labels = doc.getElementsByTagName("label");
					var hasLabelElement = false;
					if (_id) {
						for (var i=0, l=$labels.length; i<l; i++) {
							if ($labels[i].getAttribute('for') == _id) {
								hasLabelElement = true;
								break;
							};
						};
					};
					var hasTitle = !!this.getAttribute('title');
					var hasImplicitLabel = false;
					var parentEl = this.parentNode;
					do {
						if (parentEl.tagName == 'LABEL') {
							hasImplicitLabel = true;
						};
					} while (parentEl = parentEl.parentNode);
	
					if (hasLabelElement) {
						return 'pass';
					} else if (hasImplicitLabel) {
						return 'pass';
					} else if (hasTitle) {
						return 'warning';
					} else {
						return 'fail';
					}
					return 'fail';
				}
			),
		}
	}
};
})();
