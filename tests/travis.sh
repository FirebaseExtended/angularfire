grunt build
grunt test
if [ $SAUCE_ACCESS_KEY ]; then
  grunt sauce:unit
  #grunt sauce:e2e
fi
