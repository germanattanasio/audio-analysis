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

var express         = require('express'),
    app             = express(),
    watson          = require('watson-developer-cloud'),
    youtube         = require('./apis/youtube'),
    conceptInsights = require('./apis/concept_insights');

// Bootstrap application settings
require('./config/express')(app);

var authService = watson.authorization({
  username: '<username>', // speech to text username
  password: '<password>', // speech to text password
  version: 'v1'
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/dashboard', function(req, res) {
  res.render('dashboard');
});

app.get('/old', function(req, res) {
  res.render('old');
});

app.get('/api/labelSearch', function(req, res, next) {
  conceptInsights.labelSearch(req.query, function(err, result){
    if (err)
      next(err);
    else
      res.json(result);
  });
});

app.get('/api/conceptualSearch', function(req, res, next) {
  conceptInsights.conceptualSearch(req.query, function(err, result){
    if (err)
      next(err);
    else
      res.json(result);
  });
});

app.get('/api/getRelationScoresParallel', function(req, res, next) {
  conceptInsights.relationScoresParallel(req.query.requests, function(err, result){
    if (err)
      next(err);
    else
      res.json(result);
  });
});

app.get('/api/getRelationScores', function(req, res, next) {
	conceptInsights.getRelationScores(req.query, function(err, results) {
		if (err)
	    next(err);
		else
	    res.json(results);
  });
});

app.post('/api/extractConceptMentions', function(req, res, next) {
  conceptInsights.extractConceptMentions(req.body, function(err, results) {
    if (err)
      next(err);
    else
      res.json(results);
  });
});

app.get('/api/video', function(req, res, next) {
  youtube.getVideoChunk(req.query, req, res, next);
});

app.get('/api/video_url', function(req, res, next) {
  youtube.getInternalUrl(req.query, function(err, url) {
	if (err)
    next(err);
	else
    res.json(url);
  });
});

// Get token using your credentials
app.post('/api/token', function(req, res, next) {
  authService.getToken({
    url: 'https://stream.watsonplatform.net/speech-to-text/api'
  }, function(err, token) {
	  if (err)
      next(err);
    else
      res.send(token);
  });
});

// error-handler application settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
