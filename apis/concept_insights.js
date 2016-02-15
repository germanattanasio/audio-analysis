/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var watson = require('watson-developer-cloud');
var extend = require('util')._extend;
var async  = require('async');

var corpus_id = process.env.CORPUS_ID || '/corpora/public/TEDTalks';
var graph_id  = process.env.GRAPH_ID ||  '/graphs/wikipedia/en-20120601';

var conceptInsights = watson.concept_insights({
  username: '<username>',
  password: '<password>',
  version: 'v2'
});


/**
 * Builds an Async function that gets the relation scores
 * for multiple concepts asynchronously
 * @param  {[type]} doc The document
 * @return {[type]}     The document with the passages
 */
var getRelationScoresAsync = function(params) {
    return function (callback) {
	conceptInsights.graphs.getRelationScores(params, function(err, results) {
		if (err)
		    callback(err);
		else {
		    callback(null,results);
		}
	    });
    };
};

/**
 * Builds an Async function that get a document and call
 * "crop()" on it.
 * @param  {[type]} doc The document
 * @return {[type]}     The document with the passages
 */
var getPassagesAsync = function(doc) {
  return function (callback) {
    conceptInsights.corpora.getDocument(doc, function(err, fullDoc) {
      if (err)
        callback(err);
      else {
        doc = extend(doc, fullDoc);
        doc.explanation_tags.forEach(crop.bind(this, doc));
        delete doc.parts;
        callback(null, doc);
      }
    });
  };
};

/**
 * Crop the document text where the tag is.
 * @param  {Object} doc The document.
 * @param  {Object} tag The explanation tag.
 */
var crop = function(doc, tag){
  var textIndexes = tag.text_index;
  var documentText = doc.parts[tag.parts_index].data;

  var anchor = documentText.substring(textIndexes[0], textIndexes[1]);
  var left = Math.max(textIndexes[0] - 100, 0);
  var right = Math.min(textIndexes[1] + 100, documentText.length);

  var prefix = documentText.substring(left, textIndexes[0]);
  var suffix = documentText.substring(textIndexes[1], right);

  var firstSpace = prefix.indexOf(' ');
  if ((firstSpace !== -1) && (firstSpace + 1 < prefix.length))
      prefix = prefix.substring(firstSpace + 1);

  var lastSpace = suffix.lastIndexOf(' ');
  if (lastSpace !== -1)
    suffix = suffix.substring(0, lastSpace);

  tag.passage = '...' + prefix + '<b>' + anchor + '</b>' + suffix + '...';
};


module.exports = {

  labelSearch: function(params, callback) {
    var _params = extend({
      corpus: corpus_id,
      prefix: true,
      limit: 10,
      concepts: true
    }, params);
    conceptInsights.corpora.searchByLabel(_params,callback);
  },

  conceptualSearch: function(params, callback) {
    var _params = extend({ corpus: corpus_id, limit: 10 }, params);
    conceptInsights.corpora.getRelatedDocuments(_params, function(err, data) {
      if (err)
        return callback(err);
      else {
        async.parallel(data.results.map(getPassagesAsync), function(err, documentsWithPassages) {
          if (err)
            return callback(err);
          else {
            data.results = documentsWithPassages;
            callback(null, data);
          }
        });
      }
    });
  },

  relationScoresParallel: function(params, callback) {
    async.parallel(params.map(getRelationScoresAsync), callback);
  },

  relationScores: conceptInsights.graphs.getRelationScores.bind(conceptInsights.graphs),

  extractConceptMentions: function(params, callback) {
    var _params = extend({ graph: graph_id }, params);
    conceptInsights.graphs.annotateText(_params, callback);
  }

};
