test-all:
	@./node_modules/.bin/mocha -t 10000 -R spec

.PHONY: test-all