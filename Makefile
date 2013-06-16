
default: minify

test: minify
	casperjs test tests/

minify:
	uglifyjs angularFire.js -o angularfire.min.js -m -c