
pkg_name := trisquel
git_branch := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: test publish

install:
	npm install

eslint:
	$(shell npm bin)/eslint src

test: install eslint
	$(shell npm bin)/mocha tests

build: test
	$(shell npm bin)/rollup -f umd -n trisquel src/template.js --output dist/trisquel.js
	$(shell npm bin)/uglifyjs dist/trisquel.js -o dist/trisquel.min.js -c -m

npm.publish: export PKG_VERSION=$(shell npm version patch && node -e "console.log(require('./package.json').version);")
npm.publish:
	# git push origin $(git_branch)
	git push --tags
	npm publish
	@echo "published ${PKG_VERSION}"

github.release: export RELEASE_URL=$(shell curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${GITHUB_TOKEN}" \
	-d '{"tag_name": "${PKG_VERSION}", "target_commitish": "$(git_branch)", "name": "${PKG_VERSION}", "body": "", "draft": false, "prerelease": false}' \
	-w '%{url_effective}' "https://api.github.com/repos/kiltjs/$(pkg_name)/releases" )
github.release:
	@echo ${RELEASE_URL}
	@true

release: build npm.publish github.release
