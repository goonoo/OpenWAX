/*jshint undef: false */

(function () {
  "use strict";

  module('aria-label');

  var findSection = function (prefix) {
    return $(".waxSection").filter(function () {
      return $(this).find("h2").text().indexOf(prefix) === 0;
    }).eq(0);
  };

  var resultClasses = function ($items) {
    return _.map($items, function (el) {
      var $el = $(el);
      if ($el.hasClass('fail')) {
        return 'fail';
      }
      if ($el.hasClass('warning')) {
        return 'warning';
      }
      if ($el.hasClass('pass')) {
        return 'pass';
      }
      return 'none';
    });
  };

  test("14. Link purpose: aria-label이 있으면 링크 텍스트로 인정한다", function () {
    expect(5);

    var $items = findSection('14.').find('>table>tbody>tr');

    equal($items.length, 5,
      "a 요소 5개를 모두 집계해야 한다.");
    deepEqual(resultClasses($items),
      ['pass', 'fail', 'fail', 'pass', 'pass'],
      "aria-label만 있는 링크는 통과, 공백뿐인 aria-label과 빈 링크는 오류로 표시한다.");
    ok($items.eq(0).text().indexOf('aria-label: 닫기') > -1,
      "aria-label 값을 내용 열에 표시한다.");
    ok($items.eq(3).text().indexOf('장바구니') > -1 &&
        $items.eq(3).text().indexOf('aria-label: 장바구니로 이동') > -1,
      "텍스트와 aria-label을 함께 표시한다.");
    ok($items.eq(2).text().indexOf('aria-label') === -1,
      "aria-label이 없는 링크에는 aria-label을 표시하지 않는다.");
  });

  test("19. Labels: aria-label이 있으면 레이블로 인정한다", function () {
    expect(5);

    var $items = findSection('19.').find('>table>tbody>tr');

    equal($items.length, 8,
      "폼 요소 8개를 모두 집계해야 한다.");
    deepEqual(resultClasses($items),
      ['pass', 'fail', 'fail', 'pass', 'pass', 'pass', 'pass', 'fail'],
      "aria-label은 통과(title보다 우선), 비어있거나 공백뿐인 aria-label은 오류로 표시한다.");
    ok($items.eq(0).text().indexOf('aria-label: 검색어') > -1,
      "aria-label 값을 레이블 연결 열에 표시한다.");
    ok($items.eq(6).text().indexOf('명시 레이블') > -1 &&
        $items.eq(6).text().indexOf('aria-label') === -1,
      "label 요소만 있는 경우 기존처럼 label 텍스트만 표시한다.");
    ok($items.eq(1).text().indexOf('aria-label') === -1,
      "공백뿐인 aria-label은 표시하지 않는다.");
  });
}());
