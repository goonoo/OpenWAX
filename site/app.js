/*jshint node: true */
"use strict";

var step = require('step');
var express = require('express');
var app = express();
var locale = require("locale");
var I18n = require('i18n-2');


var main = function (req, res, next) {
  step(
    function render(err, scores) {
      if (err) {
        next(err);
        return;
      }

      res.render('main', {
        title: '',
      });
    }
  );
};

app.configure(function () {
  // see i18n-2-5.patch. Should be applied until
  // https://github.com/jeresig/i18n-node-2/pull/5
  // get merged or resolved
  /*
  app.use(function register_i18n(req, res, next) {
    req.i18n = i18n;
    I18n.registerMethods(res.locals, req);
    i18n.setLocaleFromQuery(req);
    i18n.prefLocale = i18n.preferredLocale();
    next();
  });
  */
  I18n.expressBind(app, {
    locales: ['en', 'ko'],
    directory: __dirname + "/locales"
  });

  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(function (req, res, next) {
    var supported = new locale.Locales(['en', 'ko']);
    var locales = new locale.Locales(req.headers["accept-language"]);
    var best = locales.best(supported);
    req.i18n.setLocale(best ? best.language : 'en');
    next();
  });
  app.use(app.router);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.engine('html', require('ejs-locals'));
});

app.get('/', main);

app.listen((process.argv && process.argv[2] && parseInt(process.argv[2], 10)) || 8117);
