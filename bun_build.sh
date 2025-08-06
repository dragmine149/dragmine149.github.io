#!/bin/sh
bun build --watch --outdir=./dist --minify --sourcemap=linked --splitting ./Scripts/inital.ts ./Scripts/code_copier.ts
