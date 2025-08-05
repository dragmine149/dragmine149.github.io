await Bun.build({
  entrypoints: ['./Scripts/inital.ts', './Scripts/code_copier.ts', './Scripts/DayNightCycle/background.ts'],
  outdir: './dist',
  sourcemap: 'linked',
  minify: true,
  // publicPath: 'https://dragmine149.github.io/',
  footer: '// They said to make this an easter egg... What do i do?'
})

// bun build --watch --outdir=./dist --minify --sourcemap=linked ./Scripts/inital.ts ./Scripts/code_copier.ts ./Scripts/DayNightCycle/background.ts
