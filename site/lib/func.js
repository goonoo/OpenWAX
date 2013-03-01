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

Date.prototype.humantime = function (diffMS) {
  diffMS = diffMS || 0;

  var time = this.valueOf() / 1000,
    now = (new Date().valueOf() - diffMS) / 1000,
    m = this.getMonth() + 1,
    d = this.getDate(),
    h = this.getHours(),
    min = this.getMinutes(),
    s = this.getSeconds(),
    minutes,
    hours;

  if (time + 60 > now) {
    return '방금';
  }
  if (time + 60 * 60 > now) {
    minutes = parseInt((now - time) / 60, 10);
    return minutes === 1 ? '1분전' : minutes + '분전';
  }
  if (time + 60 * 60 * 24 > now) {
    hours = parseInt((now - time) / (60 * 60), 10);
    return hours === 1 ? '1시간전' : hours + '시간전';
  }
  return this.hstr('Y-m-d');
};
