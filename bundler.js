await Bun.build({
  entrypoints: ['./Scripts/initial.ts', './Scripts/code_copier.ts'],
  outdir: './dist',
  sourcemap: 'linked',
  minify: true,
  publicPath: 'https://dragmine149.github.io/',
  footer: '// They said to make this an easter egg... What do i do?',
  splitting: true,
})

await Bun.build({
  entrypoints: ['./Scripts/storage.ts', './Scripts/verbose.mjs', './Scripts/verbose.css'],
  outdir: './external',
  // publicPath: 'https://dragmine149.github.io/',
  footer: '// Hey! Thanks for using this module. This is not minifed on purpose for that reason. Please, clone it if you want to use it minify it yourself.',
  // splitting: true,
  minify: false,
  sourcemap: 'linked',
})

// bun build --watch --outdir=./dist --minify --sourcemap=linked ./Scripts/inital.ts ./Scripts/code_copier.ts ./Scripts/DayNightCycle/background.ts --splitting
