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

var request = require('request');
var qs = require('querystring');
var jsdom = require('jsdom');

module.exports.getInternalUrl = function(params, callback) {
  request(params.id, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      callback(error);
      return
    }

    var window = jsdom.jsdom(body).parentWindow;
    var $ = require('jquery')(window);
    var scripts = $('script');
    var title = $('#eow-title').text();

    var ytplayer;
    // eslint-disable-next-line
    var yt = {};

    scripts.each(function() {
      // eslint-disable-next-line
      var text = $(this).text();
      if (text.indexOf('ytplayer') !== -1) {
        // eslint-disable-next-line
        ytplayer = eval(text + 'ytplayer');
      }
    });

    // eslint-disable-next-line
    var internalUrl = null;
    var sourcesString = ytplayer.config.args.url_encoded_fmt_stream_map.split(',');

    var urls = [];
    sourcesString.forEach(function(s) {
      s = qs.parse(s);
      urls.unshift({
        // eslint-disable-next-line
        url: '/api/video?id=' + qs.escape(s['url']),
        quality: s.quality,
        type: s.type
      });
    });

    callback(null, {
      urls: urls,
      title: title
    });
  });
};

module.exports.getVideoChunk = function(url, req, res) {
  req.pipe(request.get(url.id)).pipe(res);
};
