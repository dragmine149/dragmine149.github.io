// Source: https://adventofcode.com/
// Triple click to select code blocks
window.addEventListener('click',
  /**
  * @param {Event} event
  * @param {Selection} selection
  * @param {Range} range
  */
  function (event, selection, range) {
    const isCode = event.target.nodeName === 'CODE';
    const isSpanInCode = event.target.nodeName === 'SPAN' && event.target.parentNode.nodeName === 'CODE';

    if ((isCode || isSpanInCode) && event.detail === 3) {
      const target = isSpanInCode ? event.target.parentNode : event.target;

      selection = window.getSelection();
      selection.removeAllRanges();
      range = document.createRange();
      range.selectNodeContents(target);
      selection.addRange(range);
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
