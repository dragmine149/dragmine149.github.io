#!/bin/sh
bun build --watch --outdir=./dist --minify --sourcemap=linked ./Scripts/inital.ts ./Scripts/code_copier.ts
