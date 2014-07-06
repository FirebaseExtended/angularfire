grunt test;
if [ $SAUCE_ACCESS_KEY ]; then
  grunt sauce:unit
  grunt build
  grunt sauce:e2e
fi
