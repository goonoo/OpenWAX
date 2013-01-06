OpenWAX (Open Web Accessibility eXtension)
========================================

OpenWAX(Open Web Accessibility eXtension) is a tool that can help diagnose and fix the accessibility problem.

OpenWAX can diagnose following accessibility problems.

 * Text Alternatives of \<img\>, \<area\>, CSS Background
 * Data Table
 * Shortcut
 * Language of page
 * Keyboard focus
 * Page title
 * Frame title
 * Heading elements
 * Skip navigation
 * Link text
 * Label

OpenWAX is based on and branch of [N-WAX](http://html.nhncorp.com/markup_tools/nwax).

----

Download
--------
 * [OpenWAX Firefox Addon](https://addons.mozilla.org/firefox/addon/openwax/)
 * [OpenWAX Google Chrome Extension](https://chrome.google.com/webstore/detail/bfahpbmaknaeohgdklfbobogpdngngoe)

Guide
-----
OpenWAX 설치 후 브라우저에 추가된 사다리 모양의 아이콘을 클릭하시면 실행됩니다.

항목별 결과의 숨김 열은 요소가 CSS를 통해 숨겨져 있는지 여부를 표시합니다. 요소는 숨겨져 있지 않지만 내용에 해당하는 요소만 숨겨져 있는 경우는 내용이 취소선으로 표시됩니다.

* Text Alternatives
  * Display alt text of none text elements(`<img>`, `<area>`, `<input type="image">`, CSS Background Image)
  * Display whether `<object>` or `<embed>` element has used or not.
* W3C Validation
  * Display W3C Validation errors related to WCAG parsing problem.
  * W3C Validation will execute from source code with session information like login.
* Table Title: Display `<caption>` and `summary` attribute of `<table>` which used in page.
* Table Structure
  * Display rows in `<table>` are groupped with `<thead>`, `<tbody>`, `<tfoot>` or not.
  * Display if title cells(`<th>`) are used or not.
* Language of page: Display language of page.
* Contrast: Display contrast ratio which two selected colors by user.
* Keyboard focus: Display elements which specified `onfocus="this.blur()"` or `outline:0` CSS property.
* Page title: Display page title(`<title>`).
* Frame title: Display frame title(`title` attribute of `<frame>`, `<iframe>`).
* Heading elements: Display `<h1>`~`<h6>` element.
* Link text: Display text of link elements(`<a>`, `<area>`).
* Unwanted function: Display elements which specified `onclick="window.open()"` or `onchange` event.
* Label: Display label(`<label>`, `title` attribute) of form controls.