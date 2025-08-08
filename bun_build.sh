#!/bin/sh
bun build --watch --outdir=./dist --minify --sourcemap=linked --splitting ./Scripts/initial.ts ./Scripts/code_copier.ts ./Scripts/debug.ts
