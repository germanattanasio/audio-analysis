/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
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
/* global $ */
'use strict';

var conceptState = {
  text: '',
  transcript: [],
  top_annotation_offset: -1,
  timeline_annotations: [],
  timeline_callback: null
};

var NUM_WORDS_TIMELINE = 8;

exports.update_transcript = function(transcripts) {
  var text = '';
  transcripts.forEach(function (transcript) {
    text += transcript.text;
  });

  if (text.length == 0 || text == conceptState.text) {
    return;
  }

  if (conceptState.top_annotation_offset <= 0) {
    update_transcript_content(transcripts, text, []);
  }

  $.post('/api/concepts', {
    text: text,
    knowledgeGraph: 1
  }).done(function(results) {
    conceptState.text = text;
    if (!results.concepts || results.concepts.length === 0) {
      return;
    }

    update_transcript_content(transcripts, text);
    update_timeline(transcripts, results.concepts);
  });
}

function update_transcript_content(transcript, text) {
  var html = '<span>';
  var t = 0;
  var tc = 0;
  for (var i = 0; i < text.length; i++) {
    html += text[i];
    tc++;
    if (tc >= transcript[t].text.length) {
      tc = 0;
      t++;
      html += '</span><span>';
    }
  }

  html += '<span class="transcript-current-sentence">&nbsp;</span>'
  $('.transcript--content').html(html);
}

function update_timeline(transcript, annotations) {
  if (annotations.length == 0) {
    return;
  }
  var new_annotations = [];
  for (var i = 0; i < annotations.length; i++) {
    new_annotations.unshift(annotations[i]);
  }
  for (var j = 0; j < new_annotations.length; j++) {
    new_annotations[j].count = j;
  }
  conceptState.timeline_annotations.push.apply(conceptState.timeline_annotations, new_annotations);
  conceptState.transcript = transcript;

  if (conceptState.timeline_callback == null) {
    update_timeline_content();
  }
}

var first = true;
function update_timeline_content() {
  window.clearTimeout(conceptState.timeline_callback);
  conceptState.timeline_callback = null;

  var annotation = conceptState.timeline_annotations.shift();
  var mention = get_transcript_with_offset(0, conceptState.transcript);
  var subtext = get_text_window(0, 1000, conceptState.text, NUM_WORDS_TIMELINE);

  var html = '<div class="timeline--content-block">';
  if (annotation.relevance > 0.7) {
    html += '<span class="timeline--content-high-icon"></span>';
  } else if (annotation.relevance > 0.5) {
    html += '<span class="timeline--content-middle-icon"></span>';
  } else {
    html += '<span class="timeline--content-low-icon"></span>';
  }
  if (first) {
    html += '<div class="timeline--content-inner-container timeline--very-first-content-inner-container">';
    first = false;
  } else {
    var c = $('.timeline--very-first-content-inner-container');
    if (c.length > 0) {
      c.removeClass('timeline--very-first-content-inner-container');
      c.addClass('timeline--last-content-inner-container');
    }
    html += '<div class="timeline--content-inner-container timeline--first-content-inner-container" style="display:none;">';
  }
  html += '<div class="timeline--content">';
  html += '<div class="timeline--content-title">';
  // Nation
  html += annotation.text;
  html += '</div>';
  html += '<div class="timeline--content-date">';
  // 2min 1s
  html += secondsToString(mention.timestamp);
  html += '</div>';
  html += '<div class="timeline--content-text">';
  // “I saw the effect of climate change per stand in our northern most state Alaska where...”
  html += '...' + subtext + '..';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  $('.timeline--first-content-inner-container').toggleClass('timeline--first-content-inner-container');
  $('.timeline--content-container').prepend(html);
  $('.timeline--first-content-inner-container').fadeIn('slow');

  if (conceptState.timeline_annotations.length > 0) {
    conceptState.timeline_callback = window.setTimeout(update_timeline_content, 2500);
  }
}

function secondsToString(sec) {
  var d = new Date(sec * 1000).toUTCString().split(' ')[4].split(':');
  var str = ''
  if (d[0] != 0) {
    str += parseInt(d[0]) + 'h ';
    str += d[1] + 'm ';
    str += d[2] + 's';
    return str;
  }
  if (d[1] != 0) {
    str += parseInt(d[1]) + 'm ';
  }
  str += d[2] + 's';
  return str;
}

function get_transcript_with_offset(offset, transcript) {
  var i = 0;
  var l = 0;
  for (i = 0; i < transcript.length; i++) {
    l += transcript[i].text.length;
    if (offset < l) {
      break
    }
  }
  return transcript[i];
}

function get_text_window(offset_begin, offset_end, text, n_words) {
  var s = text.split(' ');
  var l = 0,
    w = 0;
  for (w = 0; w < s.length; w++) {
    if (offset_begin <= l) {
      break
    }
    l += s[w].length + 1;
  }
  var begin = Math.max(0, w - n_words);
  var end = Math.min(s.length, w + n_words + 1);
  var subtext = "";
  var concept_len = offset_end - offset_begin;
  for (var i = begin; i < end; i++) {
    if (i == w) {
      subtext += '<span class="transcript-concept"><b>';
      var j = i + 1;
      while (s.slice(i, j).join(' ').length < concept_len && j < end) {
        j++;
      }
      subtext += s.slice(i, j).join(' ');
      subtext += '</b></span> ';
    } else {
      subtext += s[i] + ' '
    }
  }
  return subtext;
}
