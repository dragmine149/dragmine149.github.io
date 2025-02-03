function markedImprovedImage() {
  const renderer = {
    image(tokens) {
      return `
      <div class="img">
        <img src="${tokens.href}", alt="${tokens.text}">
      </div>
      `
    }
  }
  return {
    renderer
  }
}
