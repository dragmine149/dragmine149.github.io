#!/bin/sh
for file in `find . -path ./Assets -prune -o -name "*.html" -type f`; do
  exclude='src="https:\/\/'
  find='src="'
  target='src="Branches\/Projects\/'
  sed -i -e "/$exclude/! s/$find/$target/g" $file
done
for file in `find . -path ./Assets -prune -o -name "*.html" -type f`; do
  exclude='href="https:\/\/'
  find='href="'
  target='href="Branches\/Projects\/'
  sed -i -e "/$exclude/! s/$find/$target/g" $file
done
