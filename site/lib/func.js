/*jshint node: true */
"use strict";

Date.prototype.hstr = function (format) {
  var m = this.getMonth() + 1,
    d = this.getDate(),
    h = this.getHours(),
    min = this.getMinutes(),
    s = this.getSeconds();

  return format
      .replace('Y', this.getFullYear())
      .replace('m', m.toString().length === 1 ? '0' + m : m)
      .replace('n', m)
      .replace('d', d.toString().length === 1 ? '0' + d : d)
      .replace('j', d)
      .replace('j', this.getDate())
      .replace('H', h.toString().length === 1 ? '0' + h : h)
      .replace('h', h)
      .replace('i', min.toString().length === 1 ? '0' + min : min)
      .replace('s', s.toString().length === 1 ? '0' + s : s);
};

Date.prototype.humantime = function (lang) {
  var time = this.valueOf() / 1000,
    now = new Date().valueOf() / 1000,
    m = this.getMonth() + 1,
    d = this.getDate(),
    h = this.getHours(),
    min = this.getMinutes(),
    s = this.getSeconds(),
    minutes,
    hours;

  if (time + 60 > now) {
    switch (lang) {
    case "ko":
    case "ko-KR":
      return '방금';

    default:
      return 'just now';
    }
  }
  if (time + 60 * 60 > now) {
    minutes = parseInt((now - time) / 60, 10);
    switch (lang) {
    case "ko":
    case "ko-KR":
      return minutes + '분전';

    default:
      return minutes === 1 ? 'm ago' : minutes + 'm ago';
    }
  }
  if (time + 60 * 60 * 24 > now) {
    hours = parseInt((now - time) / (60 * 60), 10);
    switch (lang) {
    case "ko":
    case "ko-KR":
      return hours + '시간전';

    default:
      return hours === 1 ? '1 hour ago' : hours + ' hours ago';
    }
  }
  switch (lang) {
  case "ko":
  case "ko-KR":
    return this.hstr('Y-m-d');

  default:
    return this.hstr('n/j/Y');
  }
};

String.prototype.h = function () {	
	return this.replace(/\&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");
};
