/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global $ */

'use strict';

var WatsonSpeechToText = require('watson-speech/speech-to-text'),
  showError = require('./showerror').showError,
  concepts = require('../concepts'),
  videoProps = {
    curUrl: '',
    playing: false,
    currentTime: 0,
    transcript: [],
  };

exports.initVideoPlay = function(ctx) {
  var running = false,
    video = $('#inlinevideo'),
    wipe = {
      'wipe': function() {}
    },
    params = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&'),
    video_id = '';

  for (var i = 0; i < params.length; i++) {
    if (params[i].indexOf('v=') ==== 0)
      video_id = params[i].substr(2);
  }

  $.get('/api/video_url?id=' + 'https://www.youtube.com/watch?v=' + video_id)
    .done(function(data) {
      videoProps.curURL = chooseSupportedFormat(data.urls);
      videoProps.title = data.title;
      videoProps.ctx = ctx;
      $('.video-session--video-title').html(videoProps.title);
      startVideoSpeechStream();
    })
    .fail(function() {
      console.log('Could not process video url');
    });

  // 2. This code loads the IFrame Player API code asynchronously.
  var tag = document.createElement('script');

  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

function toggleHowItWorks() {
  videoProps.howitworks = null;
  if ($('.transcript-current-sentence').html() === '&nbsp;') {
    return;
  }
  $('.how-it-works--loading').hide();
  $('.how-it-works--title').show();
  $('.recommendation--content-container').show();
  $('._dashboard--timeline').fadeIn('slow');
}

function startVideoSpeechStream() {
  $('._hidden--video').html('<video id="inlinevideo" hidden></video>');
  $('#inlinevideo').attr('src', videoProps.curURL + '#t=' + videoProps.currentTime);
  var myMediaElement = document.getElementById('inlinevideo');
  console.log('video: create media element source');
  videoProps.stream = WatsonSpeechToText.recognizeElement({
      element: myMediaElement,
      token: videoProps.ctx.token,
      muteSource: true
    })
    .pipe(new WatsonSpeechToText.FormatStream());
  videoProps.playing = true;

  $('<span class='transcript-current-sentence'>&nbsp;</span>').appendTo($('.transcript--content'));

  videoProps.howitworks = window.setTimeout(toggleHowItWorks, 5000);

  videoProps.stream.on('result', function(result) {
    // update the text for the current sentence with the default alternative.
    // there may be multiple alternatives but this example app ignores all but the first.
    $('.transcript-current-sentence').html(result.alternatives[0].transcript);
    $('.transcript--content')[0].scrollTop = $('.transcript--content')[0].scrollHeight;
    if (result.final) {
      // if we have the final text for that sentence, start a new one
      console.log({
        text: result.alternatives[0].transcript,
        timestamp: result.alternatives[0].timestamps[0][1] + videoProps.currentTime
      });
      videoProps.transcript.push({
        text: result.alternatives[0].transcript,
        timestamp: result.alternatives[0].timestamps[0][1] + videoProps.currentTime
      })

      concepts.update_transcript(videoProps.transcript);

      // $('<span class='transcript-current-sentence'>&nbsp;</span>').appendTo($('.transcript--content'));
    }
    if (videoProps.howitworks === null) {
      toggleHowItWorks();
    }
  });
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
window.onYouTubeIframeAPIReady = function() {
  var params = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  var video_id = ''
  for (var i = 0; i < params.length; i++) {
    if (params[i].indexOf('v=') === 0) {
      video_id = params[i].substr(2);
    }
  }
  player = new YT.Player('videoSession', {
    width: '100%',
    videoId: video_id,
    playerVars: {
      'controls': 0,
      'autoPlay': 1,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
  });
}

// 4. The API will call this function when the video player is ready.
window.onPlayerReady = function(event) {
  event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
window.onPlayerStateChange = function(event) {
  if (event.data === YT.PlayerState.PAUSED) {
    videoProps.stream.stop();
    console.log('PAUSED');
    videoProps.playing = false;
    videoProps.stream.stop();
    videoProps.currentTime = player.getCurrentTime();
  }
  if (event.data === YT.PlayerState.PLAYING && !videoProps.playing === true && videoProps.curURL.length > 0) {
    console.log('PLAYING');
    startVideoSpeechStream();
  }
}

window.stopVideo = function() {
  player.stopVideo();
}

function chooseSupportedFormat(urls) {
  var test = document.createElement('video');
  for (var i = 0; i < urls.length; i++) {
    var can = test.canPlayType(urls[i].type);
    if (can != null && can != undefined && can.length > 0) {
      $(test).remove();
      return urls[i].url;
    }
  }
  // Error? no supported type...
}
