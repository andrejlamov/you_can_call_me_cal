.PHONY: all

all: d3.v3.min.js moment.min.js

d3.v3.min.js:
	curl -O http://d3js.org/d3.v3.min.js

moment.min.js:
	curl -O http://momentjs.com/downloads/moment.min.js
