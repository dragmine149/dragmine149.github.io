// Source: https://adventofcode.com/
// Triple click to select code blocks
window.addEventListener('click',
  /**
  * @param {Event} e
  * @param {Selection} s
  * @param {Range} r
  */
  function (e, s, r) {
    const isCode = e.target.nodeName === 'CODE';
    const isSpanInCode = e.target.nodeName === 'SPAN' && e.target.parentNode.nodeName === 'CODE';

    if ((isCode || isSpanInCode) && e.detail === 3) {
      const target = isSpanInCode ? e.target.parentNode : e.target;

      s = window.getSelection();
      s.removeAllRanges();
      r = document.createRange();
      r.selectNodeContents(target);
      s.addRange(r);
    }
  }
);

// Have to expand the copy function because otherwise it won't copy everything.
window.addEventListener('copy', function (event) {
  let selection = window.getSelection();
  if (selection.focusNode.nodeName === 'CODE') {
    event.clipboardData.setData("text/plain", selection.focusNode.innerText);
    event.preventDefault();
  }
});
