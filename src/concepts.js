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
    timeline_callback: null,
};

var NUM_TOP_CONCEPTS = 3;
var NUM_WORDS_TIMELINE = 8;

exports.update_transcript = function(transcript) {
    var text = "";
    for (var i = 0; i < transcript.length; i++) {
	text += transcript[i].text;
    }
    if (text.length == 0 || text == conceptState.text) {
	return;
    }

    if (conceptState.top_annotation_offset <= 0) {
	update_transcript_content(transcript, text, []);
    }

    $.post('/api/extractConceptMentions', {
	text: text
    })
    .done(function(results) {
	var concept_map = build_concept_map(results);
	conceptState.text = text;
	if (results.length == 0 || results.annotations.length == 0) {
	    return;
	}

	update_transcript_content(transcript, text, results.annotations);
	update_timeline(transcript, results.annotations);
	var top_concepts = get_top_concepts(concept_map);
	update_recommendations(top_concepts, results.annotations);
    });
}

function build_concept_map(results) {
    var concept_map = {};
    for (var i = 0; i < results.annotations.length; i++) {
	var current_statistics = {}
	if (!( results.annotations[i].concept.label in concept_map )) {
	    current_statistics["score"] = 0;
	    current_statistics["count"] = 0;
	    current_statistics["maxpos"] = -1;
	    current_statistics["label"] = results.annotations[i].concept.label;
	    current_statistics["id"] = results.annotations[i].concept.id;
	} else {
	    current_statistics = concept_map[ results.annotations[i].concept.label ];
	}

	current_statistics["score"] += p_to_llr(results.annotations[i].score)
	current_statistics["count"] += 1;
	current_statistics["maxpos"] = Math.max( current_statistics["maxpos"], results.annotations[i].text_index[0] );

	concept_map[ results.annotations[i].concept.label ] = current_statistics;
    }
    return concept_map;
}

exports.build_related_concept_map = function (results, avoid_concept_map) {
    var related_concepts={}
    for (var i = 0; i < results.results.length; i++) {
	for (var j = 0; j < results.results[i].explanation_tags.length; j++) {
	    var e = results.results[i].explanation_tags[j];
	    var c = e.concept;
	    if (c.label in avoid_concept_map) continue;
	    entry = {};
	    entry["score"] = e.score;
	    entry["label"] = c.label;
	    entry["id"] = c.id;
	    related_concepts[c.label] = entry;
	}
    }
    return related_concepts;
}

exports.build_related_document_map = function (results) {
    var related_docs={}
    for (var i = 0; i < results.results.length; i++) {
	d = results.results[i];
	entry = {};
	entry["score"] = d.score;
	entry["label"] = d.label;
	entry["id"] = d.id;
	related_docs[d.label] = entry;
    }
    return related_docs;
}

function update_transcript_content(transcript, text, annotations) {
    annotations.sort(function(a, b) {
	return a.text_index[0] - b.text_index[0];
    });

    var html = '<span>';
    var t = 0, tc = 0;
    var a = 0;
    for (var i = 0; i < text.length; i++) {
	if (a < annotations.length && i == annotations[a].text_index[0]) {
	    html += '<span class="transcript-concept"><b>';
	}
	if (a < annotations.length && i == annotations[a].text_index[1]) {
	    html += '</b></span>';
	    a++;
	}

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
    // reverse sort
    annotations.sort(function(a, b) {
	return b.text_index[0] - a.text_index[0];
    });

    if (annotations[0].text_index[0] <= conceptState.top_annotation_offset) {
	return;
    }

    var new_annotations = [];
    for (var i = 0; i < annotations.length; i++) {
	if (annotations[i].text_index[0] <= conceptState.top_annotation_offset) {
	    break
	}
	new_annotations.unshift(annotations[i]);
    }
    for (var i = 0; i < new_annotations.length; i++) {
	new_annotations[i].count = i;
    }
    conceptState.top_annotation_offset = annotations[0].text_index[0];
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
    var mention = get_transcript_with_offset(annotation.text_index[0], conceptState.transcript);
    var subtext = get_text_window(annotation.text_index[0], annotation.text_index[1], conceptState.text, NUM_WORDS_TIMELINE);

    var html = '<div class="timeline--content-block">';
    if (annotation.score > 0.7) {
	html += '<span class="timeline--content-high-icon"></span>';
    } else if (annotation.score > 0.3) {
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
    html += annotation.concept.label;
    html += '</div>';
    html += '<div class="timeline--content-date">';
    // 2min 1s
    html += secondsToString(mention.timestamp + annotation.count);
    html += '</div>';
    html += '<div class="timeline--content-text">';
    // “I saw the effect of climate change per stand in our northern most state Alaska where...”
    html += "..." + subtext + "..";
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
    var d = new Date(sec * 1000).toUTCString().split(" ")[4].split(":");
    var str = ""
    if (d[0] != 0) {
	str += parseInt(d[0]) + "h ";
	str += d[1] + "m ";
	str += d[2] + "s";
	return str;
    }
    if (d[1] != 0) {
	str += parseInt(d[1]) + "m ";
    }
    str += d[2] + "s";
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
    var s = text.split(" ");
    var l = 0, w = 0;
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
	    var j = i+1;
	    while (s.slice(i,j).join(' ').length < concept_len && j < end) {
		j++;
	    }
	    subtext += s.slice(i,j).join(' ');
	    subtext += '</b></span> ';
	} else {
	    subtext += s[i] + ' '
	}
    }
    return subtext;
}

function get_top_concepts(concept_map) {
    var concept_array = [];
    for (var k in concept_map) {
	concept_array.push(concept_map[k]);
    }

    concept_array.sort(function(a, b){
	return b.score - a.score;
    });

    return concept_array.slice(0, NUM_TOP_CONCEPTS);
}

function update_recommendations(concepts, all_annotations) {
    if (concepts.length < NUM_TOP_CONCEPTS) {
	return;
    }
    var ids = [];
    for (var i = 0; i < concepts.length; i++) {
	ids.push(concepts[i].id);
    }
    $.get('/api/conceptualSearch', {
	ids: ids,
	limit: 2,
	documents_fields: JSON.stringify({
	    user_fields: 1
	})
    })
    .done(function(results) {
	if (results.results == undefined || results.results.length == 0) {
	    return;
	}
	var html = '';
	for (var i = 0 ; i < 2 && i < results.results.length; i++) {
	    var recommended_concepts = pick_related_concepts(results.results[i].explanation_tags, concepts, all_annotations);

	    html += '<div class="recommendation--container">';
	    html += '<div class="recommendation--TED">';
	    html += '<div class="recommendation--TED-thumb">';
	    var thumb = results.results[i].user_fields.thumbnail;
	    thumb = thumb.slice(0,thumb.indexOf('?')) + '?quality=20&w=70'
	    html += '<a class="ted-link" href="' + results.results[i].user_fields.url + '">' + '<img src="'+thumb+'" style="width: 4.1em;">' + '</a>';
	    html += '</div>';
	    html += '<div class="recommendation--TED-title-author">';
	    html += '<div class="recommendation--TED-title">';
            html += '<a class="ted-link" href="' + results.results[i].user_fields.url + '">' + results.results[i].user_fields.title + '</a>';
            html += '</div>';
            html += '<div class="recommendation--TED-author">';
            html += results.results[i].user_fields.speaker;
            html += '</div>';
	    html += '</div>';
	    html += '</div>';

	    html += '<div class="recommendation--concept-container">';
	    for (var j = 0 ; j < recommended_concepts.length; j++) {
		html += '<div class="recommendation--concept">';
		html += recommended_concepts[j].label;
		html += '</div>';
	    }
	    html += '</div>';
	    html += '</div>';
	}
	$('.recommendation--container').remove();
	$('.recommendation--content-container').append(html);
	$('._dashboard--recommendation').fadeIn('slow');
    });
}

function pick_related_concepts(candidate_tags, top_concepts, all_annotations) {
    var recommended_concepts = [];

    for (var i = 0; i < candidate_tags.length; i++) {
	var found = false;
	for (var j = 0; j < all_annotations.length; j++) {
	    if (candidate_tags[i].concept.id == all_annotations[j].concept.id) {
		found = true;
		break;
	    }
	}
	if (found == false) {
	    recommended_concepts.push(candidate_tags[i].concept);
	}
	if (recommended_concepts.length >= NUM_TOP_CONCEPTS) {
	    break
	}
    }
    recommended_concepts.push.apply(recommended_concepts, top_concepts);
    return recommended_concepts.slice(0, NUM_TOP_CONCEPTS);
}

function truncate(t,threshold) {
    if (threshold ==null)
	threshold = 30;
    if (t.length > threshold-3)
	return  t.substring(0,threshold-3)+"...";
    return t;
}

function llr_to_p(llr) {
    return Math.exp(llr)/(1.0 + Math.exp(llr))
}

function p_to_llr(p) {
    return Math.log(p/(1.0-p))
}

function radius_from_score(score) {
    return 15.0*Math.max(0.0,score - 0.4);
}

exports.initContainer = function (svgContainer) {
    var titles = svgContainer
	.append("text")
	.attr("y",yoffset+20)
	.attr("x",30)
	.text("Ordered by recency")
	.attr("class","titles")
	.style("fill","#d74108")
	.style("font-weight",600);
    svgContainer.append("text")
	.attr("y",yoffset+20)
	.attr("x",300)
	.text("Ordered by confidence")
	.attr("class","titles")
	.style("fill","#d74108")
	.style("font-weight",600);
    svgContainer.append("text")
	.attr("y",yoffset+20)
	.attr("x",570)
	.text("Predictions of relevant concepts")
	.attr("class","titles")
	.style("fill","#d74108")
	.style("font-weight",600);
    svgContainer.append("text")
	.attr("y",20)
	.attr("x",30)
	.text("Predictions of interesting TED talks")
	.attr("class","titles")
	.style("fill","#d74108")
	.style("font-weight",600);

}


var nodes;
var links;
var force;
var yoffset= 120;


/*
function init_force(svg) {
    var width = 960,
	height = 500;

    force = d3.layout.force()
	.size([width, height])
	.nodes([]) // initialize with no nodes
	.linkDistance(30)
	.charge(-500)
	.on("tick", tick);


    //    svg.on("mousemove", mousemove)
    //	.on("mousedown", mousedown);

    svg.append("rect")
	.attr("width", width)
	.attr("height", height);

    nodes = force.nodes(),
	links = force.links(),
	node = svg.selectAll(".node"),
	link = svg.selectAll(".link");

    var cursor = svg.append("circle")
	.attr("r", 30)
	.attr("transform", "translate(-100,-100)")
	.attr("class", "cursor");

    restart();

    function tick() {
	node.attr("cx", function(d) { return d.x; })
	    .attr("cy", function(d) { return d.y; });
    }

    function restart() {

	node = node.data(nodes);

	node.enter().insert("circle", ".cursor")
	    .attr("class", "node")
	    .attr("r", 5)
	    .call(force.drag);

	force.start();
    }








    /*
    function tick() {
	var node = svg.selectAll(".node")
	node.attr("cx", function(d) { return d.x; })
	    .attr("cy", function(d) { return d.y; });
    }

    function restart() {
	var node = svg.selectAll(".node")
	node = node.data(nodes);

	node.enter().insert("circle", ".cursor")
	    .attr("class", "node")
	    .attr("r", 5)
	    .call(force.drag);

	force.start();
    }

    restart()*/
    /*
    svg.on("mousemove", mousemove)
	.on("mousedown", mousedown);

    svg.append("rect")
	.attr("width", width)
	.attr("height", height);

    nodes = force.nodes(),
	links = force.links(),
	node = svg.selectAll(".node"),
	link = svg.selectAll(".link");

    var cursor = svg.append("circle")
	.attr("r", 30)
	.attr("transform", "translate(-100,-100)")
	.attr("class", "cursor");

    restart();

    function mousemove() {
	cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
    }

    function mousedown() {
	var point = d3.mouse(this),
	    node = {x: point[0], y: point[1]},
	    n = nodes.push(node);

	    // add links to any nearby nodes
	    nodes.forEach(function(target) {
		    var x = target.x - node.x,
			y = target.y - node.y;
		    if (Math.sqrt(x * x + y * y) < 30) {
			links.push({source: node, target: target});
		    }
		});

	    restart();
    }

    function tick() {
	link.attr("x1", function(d) { return d.source.x; })
	    .attr("y1", function(d) { return d.source.y; })
	    .attr("x2", function(d) { return d.target.x; })
	    .attr("y2", function(d) { return d.target.y; });

	node.attr("cx", function(d) { return d.x; })
	    .attr("cy", function(d) { return d.y; });
    }

    function restart() {
	link = link.data(links);

	link.enter().insert("line", ".node")
	.attr("class", "link");

	node = node.data(nodes);

	node.enter().insert("circle", ".cursor")
	    .attr("class", "node")
	    .attr("r", 5)
	    .call(force.drag);

	force.start();
    }
}
*/

exports.add_related_documents_to_container = function (related_documents, svgContainer) {
    // generate an array from the dictionary
    var documents = [];
    for(var label in related_documents) {
	documents.push(related_documents[label]);
    }

    // sort the concepts by score
    documents.sort(function(a,b) {  return a.score < b.score ? 1 : a.score > b.score ? -1 : 0 });

    // get them ready for consumption by svg
    var data = [];
    for(var j=0; j < documents.length; j++) {
	data.push({ "id" : documents[j].id,"score" : documents[j].score, "label" : documents[j].label, "y" : 40+j*20, "x" : 30});
    }

    var text = svgContainer.selectAll(".related_document_list")
	.data(data,function(d) { return d.id } );
    text.enter().append("text")
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","related_document_list")
	.text( function(d) { return d.label } );
    text.transition()
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","related_document_list")
	.text( function(d) { return d.label } );
    text.exit().remove();


};

exports.add_related_concepts_to_container = function (concept_map, svgContainer) {
    // generate an array from the dictionary
    var concepts = [];
    for(var label in concept_map) {
	concepts.push(concept_map[label]);
    }

    // sort the concepts by score
    concepts.sort(function(a,b) {  return a.score < b.score ? 1 : a.score > b.score ? -1 : 0 });

    // get them ready for consumption by svg
    var data = [];
    for(var j=0; j < concepts.length; j++) {
	data.push({ "id" : "byscore_"+concepts[j].label,"score" : concepts[j].score, "label" : concepts[j].label, "y" : yoffset+40+j*20, "x" : 570});
    }

    var text = svgContainer.selectAll(".related_concept_list")
	.data(data,function(d) { return d.id } );
    text.enter().append("text")
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","related_concept_list")
	.text( function(d) { return truncate(d.label,50) } );
    text.transition()
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","related_concept_list")
	.text( function(d) { return truncate(d.label,50) } );
    text.exit().remove();

}


function quotable_quote(concept_map, svgContainer) {
    // generate an array from the dictionary
    var concepts = [];
    for(var label in concept_map) {
	concepts.push(concept_map[label]);
    }

    if (concepts.length == 0)
	return;

    // sort the concepts by position
    concepts.sort(function(a,b) {  return a.maxpos < b.maxpos ? 1 : a.maxpos > b.maxpos ? -1 : 0 });


}


exports.add_concepts_to_container = function (concept_map, svgContainer) {
    // generate an array from the dictionary
    var concepts = [];
    for(var label in concept_map) {
	concepts.push(concept_map[label]);
    }

    if (concepts.length == 0)
	return;

    /**************** disable the force layout until we have better distances between concepts
    // get the nodes and the links from the force layout
    var force_nodes=force.nodes();
    var links=force.links();


    // obtain a list of the concept ids that currently force layout
    // also compute a map view of these concepts
    var existing_cids = [];
    var map_nodes = {};
    for(var j=0; j < force_nodes.length; j++) {
	existing_cids.push( force_nodes[j].id );
	map_nodes[force_nodes[j].id] = 1;
    }

    // scan the new incoming list of concepts, to figure out if there are new concepts in there
    for(var j=0; j < concepts.length; j++) {
	var reference_concept = concepts[j];

	if (reference_concept.id in map_nodes)
	    continue;    // if the concept is already in the force layout, skip

	// otherwise, push the concept into the data structure that the force layout uses for tracking them
	force_nodes.push({ "score" : llr_to_p(reference_concept.score), "id" : reference_concept.id , "label" : reference_concept.label });
	existing_cids.push(concepts[j].id);   // update the list of concept ids that are known to be in the force layout

	/* we know that a new concept has arrived; we now compute its closeness to the existing nodes
	$.get('/api/getRelationScores', { concepts: existing_cids, id : reference_concept.id   })
	    .done(function(results) {
		    console.log(results);
		    for(var k=0; k < results.scores.length; k++) {
			if (!( reference_concept.id === results.scores[k].concept)) {
			    var l = { source: reference_concept.id, target: results.scores[k].concept, strength: Math.max(0.1,2*(results.scores[k].score-0.5))};
			    console.log(l);
			    links.push(l);
			}

		    }
		});


    };
    */

    // sort the concepts by position
    concepts.sort(function(a,b) {  return a.maxpos < b.maxpos ? 1 : a.maxpos > b.maxpos ? -1 : 0 });

    // get them ready for consumption by svg
    var data = [];
    for(var j=0; j < concepts.length; j++) {
	data.push({ "id" : "byscore_"+concepts[j].label,"score" : llr_to_p(concepts[j].score), "label" : concepts[j].label, "y" : yoffset+40+j*20, "x" : 30});
    }

    // sort the concepts by score
    concepts.sort(function(a,b) {  return a.score < b.score ? 1 : a.score > b.score ? -1 : 0 });
    //    force.start()

    // get them ready for consumption by svg
    for(var j=0; j < concepts.length; j++) {
	data.push({ "id": "byrecency_"+concepts[j].label,"score" : llr_to_p(concepts[j].score), "label" : concepts[j].label, "y" : yoffset+40+j*20, "x" : 300});
    }


    //    node.exit().remove();

/**************** disable force layout until distance between concepts improves
		    force.nodes(force_nodes, function(d) { return d.id })
			.on("tick",tick);

		    //		    if (links.length > 0)
		    //		force.links(links);

		    var n = force.nodes();
		    force.start();
		    n = force.nodes();
		    var node = svgContainer.selectAll(".node")
			.data(force_nodes,function(d) { return d.id } );

		    node.enter()
			.append("circle")
			.attr("r",5)
			.attr("class", "node");

		    var ttt = svgContainer.selectAll(".ttt")
			.data(force_nodes,function(d) { return d.id } );

		    ttt.enter()
			.append("text")
			.attr("text-anchor","middle")
			.text( function(d) { return d.label } )
			.attr("class", "ttt");

		    function tick() {
			node.attr("cx", function(d) { return d.x; })
			    .attr("cy", function(d) { return d.y; });

			ttt.attr("x", function(d) { return d.x; })
			    .attr("y", function(d) { return d.y; });
		    }
   */


    var text = svgContainer.selectAll(".concept_list")
	.data(data,function(d) { return d.id } );
    text.enter().append("text")
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","concept_list")
	.text( function(d) { return truncate(d.label) } );
    text.transition()
	.attr("y", function(d) { return d.y })
	.attr("x", function(d) { return d.x })
	.attr("alignment-baseline","middle")
	.attr("class","concept_list")
	.text( function(d) { return truncate(d.label) } );
    text.exit().remove();

    var scale =  d3.scale.linear().domain([0.4, 1.0]).range(["red","LightGreen"]);

    var circles = svgContainer.selectAll(".score_circle")
	.data(data,function(d) {
		return d.id
	    } );

    circles.enter().append("circle")
	.attr("cy", function(d) { return d.y })
	.attr("cx", function(d) { return d.x - 15 })
	.attr("r",function(d) { return radius_from_score(d.score) })
	.attr("class","score_circle")
	.style("fill",function(d) {return scale(d.score); });

    circles.transition()
	.attr("cy", function(d) { return d.y })
	.attr("cx", function(d) { return d.x - 15 })
	.attr("r",function(d) { return radius_from_score(d.score) })
	.style("fill",function(d) {return scale(d.score); });

    circles.exit()
	.transition()
	.attr("r",0)
	.remove()
	     //							.attr("writing-mode","tb-rl")
}
