/*jshint node: true */
"use strict";

var step = require('step');
var express = require('express');
var app = express();
var db = require('mongoose');
require('./lib/func.js');
require('./lib/models')(db, db.Schema);
db.connect('mongodb://localhost/openwax');

var main = function (req, res, next) {
  var Score = db.model('Score');

  step(
    function readRecentScores() {
      Score.find().sort('-updated_at').limit(5).exec(this);
    },
    function render(err, scores) {
      if (err) {
        next(err);
        return;
      }

      res.render('main', {
        title: '',
        scores: scores
      });
    }
  );
};

var log = function (req, res, next) {
  var Score = db.model('Score');

  var url = req.param('url');
  var score = parseInt(req.param('score'), 10);
  var title = req.param('title');

  step(
    function readOldData() {
      Score.findOne({url: url}, this);
    },
    function createOrUpdateData(err, data) {
      if (err) {
        next(err);
        return;
      }

      if (data) {
        data.times++;
        data.save(this);
      } else {
        data = new Score();
        data.url = url;
        data.times = 1;
      }
      data.title = title;
      data.score = score;
      data.updated_at = new Date();
      data.save(this);
    },
    function finalize(err) {
      if (err) {
        next(err);
        return;
      }

      next();
    }
  );
};

var render1x1Gif = function (req, res) {
  var imgHex = '47494638396101000100800000dbdfef00000021f90401000000002c00000000010001000002024401003b';
  var imgBuffer = new Buffer(imgHex, 'hex');
  res.setHeader('Content-Type', 'image/gif');
  res.end(imgBuffer, 'binary');
};

var search = function (req, res, next) {
  var Score = db.model('Score');
  var q = req.param('q');

  step(
    function getScoresFromQ() {
      if (q) {
        Score.find({'url': new RegExp(q)}).sort('-updated_at').exec(this);
      } else {
        this(null, []);
      }
    },
    function calcSumAndAvg(e, list) {
      var sum = 0,
        avg = 0,
        i, l = list.length;

      if (e) {
        next(e);
        return;
      }

      for (i = 0; i < l; i++) {
        sum += list[i].score;
      }

      avg = l === 0 ? 0 : parseInt(sum / l * 10, 10) / 10;

      this(list, sum, avg);
    },
    function render(list, sum, avg) {
      res.render('search', {
        title: '검색',
        q: q,
        count: list.length,
        list: list,
        avg: avg
      });
    }
  );
};

app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.engine('html', require('ejs-locals'));

app.get('/', main);
app.get('/log', log, render1x1Gif);
app.get('/search', search);

app.listen(8117);
