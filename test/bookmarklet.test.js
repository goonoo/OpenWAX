/*jshint undef: false */

(function () {
  "use strict";

  module('bookmarklet');

  test("scripts initialization", function () {
    expect(5);

    ok(!!achecker,
      "achecker 객체가 존재해야 한다");
    ok(!!achecker.Wax,
      "achecker.Wax 객체가 존재해야 한다");
    ok(typeof achecker.Wax.run === 'function',
      "achecker.Wax.run 함수가 존재해야 한다");
    ok(!!document.getElementById("achecker-css"),
      "CSS가 로드되어야 한다.");
    ok(!!document.getElementById("achecker-result"),
      "평가결과 표시용 태그가 삽입되어야 한다.");
  });

  test("1. Alternative text", function () {
    expect(4);

    var $section = $(".waxSection").eq(0);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });
    var isWarnings = _.map($items, function (el) {
      return $(el).hasClass('warning');
    });

    equal($section.find("h2 span").text(), '(13)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [true, true, false, false, false,
                         true, false, true, false, false,
                         false, false, false],
      "오류를 정확히 표시한다.");
    deepEqual(isWarnings, [false, false, true, false, false,
                         false, false, false, false, true,
                         true, true, true],
      "경고를 정확히 표시한다.");
    ok($items.eq(8).hasClass('hidden_el'),
      "숨김 여부를 제대로 표시한다.");
  });

  test("1. Alternative text (BG)", function () {
    expect(2);

    var $section = $(".waxSection").eq(1);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(1)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false],
      "오류를 정확히 표시한다.");
  });

  test("1. Alternative text (object)", function () {
    expect(2);

    var $section = $(".waxSection").eq(2);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(2)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, false],
      "오류를 정확히 표시한다.");
  });

  test("8. Focus order/visible", function () {
    expect(2);

    var $section = $(".waxSection").eq(5);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(2)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [true, true],
      "오류를 정확히 표시한다.");
  });

  test("12. Skip navigation", function () {
    expect(2);

    var $section = $(".waxSection").eq(6);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(3)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, false, true],
      "오류를 정확히 표시한다.");
  });

  test("13. Page titled", function () {
    expect(2);

    var $section = $(".waxSection").eq(7);
    var $items = $section.find('li');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(1)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [true],
      "오류를 정확히 표시한다.");
  });

  test("13. Frame titled", function () {
    expect(2);

    var $section = $(".waxSection").eq(8);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(4)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, true, true, false],
      "오류를 정확히 표시한다.");
  });

  test("13. Headings", function () {
    expect(2);

    var $section = $(".waxSection").eq(9);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(11)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, false, false, false, false,
                         false, false, false, false, false,
                         false],
      "오류를 정확히 표시한다.");
  });

  test("14. Link purpose", function () {
    expect(3);

    var $section = $(".waxSection").eq(10);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(23)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, false, false, false, false,
                         false, false, false, false, false,
                         false, false, false, false, false,
                         false, true, true, false, false,
                         false, false, false],
      "오류를 정확히 표시한다.");
    ok($items.eq(3).hasClass('hidden_el'),
      "숨김 여부를 제대로 표시한다.");
  });

  test("15. Language of page", function () {
    expect(2);

    var $section = $(".waxSection").eq(11);
    var $items = $section.find('li');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(1)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false],
      "오류를 정확히 표시한다.");
  });

  test("16. Unintended consequences", function () {
    expect(2);

    var $section = $(".waxSection").eq(12);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(4)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [true, false, false, false],
      "오류를 정확히 표시한다.");
  });

  test("18. Table", function () {
    expect(2);

    var $section = $(".waxSection").eq(13);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });

    equal($section.find("h2 span").text(), '(5)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [false, true, true, false, true],
      "오류를 정확히 표시한다.");
  });

  test("19. Labels", function () {
    expect(4);

    var $section = $(".waxSection").eq(14);
    var $items = $section.find('>table>tbody>tr');
    var isErrors = _.map($items, function (el) {
      return $(el).hasClass('fail');
    });
    var isWarnings = _.map($items, function (el) {
      return $(el).hasClass('warning');
    });

    equal($section.find("h2 span").text(), '(9)',
      "항목 갯수를 정확히 집계해야 한다.");
    deepEqual(isErrors, [true, true, false, false, false,
                         false, false, false, false],
      "오류를 정확히 표시한다.");
    deepEqual(isWarnings, [false, false, false, false, false,
                         true, false, false, true],
      "경고를 정확히 표시한다.");
    ok($items.eq(8).hasClass('hidden_el'),
      "숨김 여부를 제대로 표시한다.");
  });

  test("Toggle all buttons works", function () {
    expect(2);


    $('.toggleAll button').click();
    ok($('.toggleAll button').hasClass('fold') &&
        !$('.waxFrames h2, .waxSection h2').hasClass('folded'),
      "Section들이 잘 접힌다.");
    $('.toggleAll button').click();
    ok($('.toggleAll button').hasClass('unfold') &&
        $('.waxFrames h2, .waxSection h2').hasClass('folded'),
      "Section들이 잘 펴진다.");
  });

  test("WAX Score", function () {
    expect(1);

    ok($('.waxScore strong').text() === '67.8',
      "WAX Score가 집계되어야 한다.");
  });
}());
