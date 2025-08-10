#!/bin/sh
bun build --outdir=./dist --minify --sourcemap=linked --splitting ./Scripts/initial.ts ./Scripts/code_copier.ts ./Scripts/debug.ts
bun build --outdir=./external ./Scripts/storage.ts
