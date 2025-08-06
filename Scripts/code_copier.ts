// Source: https://adventofcode.com/ (use inspector to find this!)
// Triple click to select code blocks, slightly modified to be more readable and extends to more situations.
window.addEventListener('click',
  function (event: MouseEvent) {
    const isCode = (event.target as HTMLElement | null)?.nodeName === 'CODE';
    const isSpanInCode = (event.target as HTMLElement | null)?.nodeName === 'SPAN' && (event.target as HTMLElement | null)?.parentNode?.nodeName === 'CODE';

    if ((isCode || isSpanInCode) && event.detail === 3) {
      const target = isSpanInCode ? (event.target as HTMLElement | null)?.parentNode as HTMLElement : event.target as HTMLElement;

      let selection = window.getSelection();
      selection?.removeAllRanges();
      let range = document.createRange();
      range.selectNodeContents(target);
      selection?.addRange(range);
    }
  }
);

// Have to expand the copy function because otherwise it won't copy everything.
window.addEventListener('copy', function (event) {
  let selection = window.getSelection();
  if (selection == null) return;

  if (selection.focusNode?.nodeName === 'CODE') {
    event.clipboardData?.setData("text/plain", (selection.focusNode as HTMLElement).innerText);
    event.preventDefault();
  }
});
