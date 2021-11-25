/*jslint node: true */
"use strict";

function getModels(db, Schema) {
  var score = new Schema({
    url: String,
    title: String,
    times: {
      "type": Number,
      "default": 1
    },
    score: Number,
    updated_at: Date
  });
  db.model('Score', score);
  return db;
}

module.exports = getModels;
