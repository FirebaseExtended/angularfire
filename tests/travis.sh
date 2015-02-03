#!/bin/bash
set -e
grunt build
grunt test:unit
grunt test:e2e
if [ $TRAVIS_TAG ]; then
  grunt sauce:unit;
fi
