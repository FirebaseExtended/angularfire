grunt build
grunt test:unit
if [ $TRAVIS_TAG ]; then
  grunt sauce:unit;
fi
