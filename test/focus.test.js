/*jshint undef: false */

(function () {
  "use strict";

  module('row click focus');

  // 어떤 테스트도 클릭하기 전의 인라인 outline (브라우저별 표기 순서 차이를 피하려고 직접 읽어 둔다)
  var ORIGINAL_SELECT_OUTLINE = document.getElementById('select-disabled').style.getPropertyValue('outline');

  var findRow = function (targetId) {
    var target = document.getElementById(targetId);
    return _.find($(".waxSection").filter(function () {
      return $(this).find("h2").text().indexOf('19.') === 0;
    }).find('>table>tbody>tr').get(), function (tr) {
      return tr['data-el'] === target;
    });
  };

  test("should_focus_element_when_enabled_row_clicked", function () {
    expect(3);

    var input = document.getElementById('input-enabled');
    var row = findRow('input-enabled');

    ok(!!row, "input-enabled를 가리키는 결과 행이 있어야 한다.");
    row.click();
    strictEqual(document.activeElement, input,
      "활성 요소는 포커스를 받는다.");
    equal(input.style.getPropertyValue('outline-style'), '',
      "포커스가 성공하면 강조 테두리를 붙이지 않는다.");
  });

  test("should_highlight_element_when_disabled_row_clicked", function () {
    expect(4);

    var select = document.getElementById('select-disabled');
    var row = findRow('select-disabled');

    ok(!!row, "select-disabled를 가리키는 결과 행이 있어야 한다.");
    row.click();
    notStrictEqual(document.activeElement, select,
      "disabled 요소는 포커스를 받을 수 없다.");
    equal(select.style.getPropertyValue('outline-style'), 'solid',
      "포커스를 받지 못하면 강조 테두리를 붙인다.");
    equal(select.style.getPropertyPriority('outline'), 'important',
      "페이지 CSS에 덮이지 않도록 !important로 붙인다.");
  });

  asyncTest("should_restore_original_outline_after_highlight_duration", function () {
    expect(4);

    var select = document.getElementById('select-disabled');
    achecker.Wax.highlightDuration = 30;

    findRow('select-disabled').click();
    findRow('select-disabled').click();  // 강조 중에 다시 클릭해도 원래 값을 잃지 않아야 한다
    equal(select.style.getPropertyValue('outline-style'), 'solid',
      "강조 중에는 테두리가 유지된다.");

    setTimeout(function () {
      equal(select.style.getPropertyValue('outline-style'), 'dotted',
        "시간이 지나면 원래 테두리 스타일(dotted)로 돌아간다.");
      equal(select.style.getPropertyValue('outline'), ORIGINAL_SELECT_OUTLINE,
        "원래 인라인 outline 값과 같아야 한다.");
      equal(select.style.getPropertyPriority('outline'), '',
        "원래 없던 !important는 남기지 않는다.");
      start();
    }, 120);
  });
}());
