(function () {
  "use strict";

  function toggle(el) {
    if (window.localStorage === null) {
      window.alert('Local storage is required for changing providers');
      return;
    }
    
    window.localStorage.isIncludeFrame = el.checked ? 'true' : 'false';
  }

  function toggleAllowLogging(el) {
    if (window.localStorage === null) {
      window.alert('Local storage is required for changing providers');
      return;
    }
    
    window.localStorage.allowLogging = el.checked ? 'true' : 'false';
  }

  function main() {
    if (window.localStorage === null) {
      window.alert("LocalStorage must be enabled for changing options.");
      document.getElementById('isIncludeFrame').disabled = true;
      return;
    }

    document.getElementById('isIncludeFrame').checked = window.localStorage.isIncludeFrame !== 'false';
    document.getElementById('isIncludeFrame').onclick = function () {
      toggle(this);
    };

    document.getElementById('allowLogging').checked = window.localStorage.allowLogging === 'true';
    document.getElementById('allowLogging').onclick = function () {
      toggleAllowLogging(this);
    };
  }

  window.onload = main;
}());
