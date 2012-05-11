#!/bin/bash
zip -r app.xpi . -i \*.html -i \*.xul -i \*.js -i \*.properties -i \*.dtd -i \*.css -i \*.png -i \*.manifest -i \*.rdf -x test\* -x sample\* -x template\*
