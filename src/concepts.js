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

var STATE = {
  text: '',
  transcripts: [],
  topConceptOffset: -1,
  concepts: [],
  displayedConcepts: [],
  timelineCallback: null
};

/**
 * Updates the transcription and timeline.
 * Called by Speech to Text everytime there is a new transcription
 * @param {Object} [transcripts] - The transcriptions.
 * @param {string} [transcripts.text] - The transcription text.
 * @param {string} [transcripts.timestamp] - The last timestamp for a given sentence.
 * @returns {function} updateTranscript function
 *
 */
exports.updateTranscript = function(transcripts) {
  var text = transcripts.map(function(transcript) {
    return transcript.text;
  }).join(' ');

  if (text.length == 0 || text === STATE.text) {
    return;
  }

  if (STATE.topConceptOffset <= 0) {
    updateTranscriptContent(transcripts, text);
  }

  $.post('/api/concepts', {
    text: text,
    knowledgeGraph: 1
  }).done(function(results) {
    STATE.text = text;
    if (!results.concepts || results.concepts.length === 0) {
      return;
    }

    updateTranscriptContent(transcripts);
    updateTimeline(transcripts, results.concepts);
  });
}

function updateTranscriptContent(transcripts) {
  var html = '<span>' + transcripts.map(function(transcript) {
    return transcript.text
  }).join('</span><span>') + '</span>';

  html += '<span class="transcript-current-sentence">&nbsp;</span>'
  $('.transcript--content').html(html);
}

function updateTimeline(transcripts, concepts) {
  if (concepts.length === 0) {
    return;
  }
  var textConcepts = STATE.concepts.map(function(ta) {
    return ta.text;
  });

  var newConcepts = concepts.filter(function(concept) {
    return textConcepts.indexOf(concept.text) === -1;
  });

  STATE.displayedConcepts = STATE.displayedConcepts.concat(newConcepts);
  STATE.concepts = STATE.concepts.concat(newConcepts);

  if (STATE.timelineCallback == null) {
    updateTimelineContent();
  }
}

var first = true;
function updateTimelineContent() {
  window.clearTimeout(STATE.timelineCallback);
  STATE.timelineCallback = null;

  var concept = STATE.displayedConcepts.shift();
  if (concept == null)
    return;

  console.log('concept: ', concept);
  var relevance = parseFloat(concept.relevance);
  var html = '<div class="timeline--content-block">';
  if (relevance > 0.9) {
    html += '<span class="timeline--content-high-icon"></span>';
  } else if (relevance > 0.7) {
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
  html += concept.text;
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  $('.timeline--first-content-inner-container').toggleClass('timeline--first-content-inner-container');
  $('.timeline--content-container').prepend(html);
  $('.timeline--first-content-inner-container').fadeIn('slow');

  if (STATE.displayedConcepts.length > 0) {
    STATE.timelineCallback = window.setTimeout(updateTimelineContent, 2000);
  }
}
