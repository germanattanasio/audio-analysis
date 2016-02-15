(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a) return a(o, !0);
        if (i) return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {
        exports: {}
      };
      t[o][0].call(l.exports, function(e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }
  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s
})({
  1: [function(require, module, exports) {
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

    'use strict';

    $(document).ready(function() {
      $('.video-picking--input-btn').on("click", function() {
        var input = $(".video-picking--input").val()
        var myRe = /.*www\.youtube\.com\/watch?.*v=(.*)$/;
        var myArray = myRe.exec(input);
        if (myArray == null || myArray.length != 2) {
          /* let's try for a second type of link from youtube */
          myRe = /.*youtu\.be\/(.*)/;
          myArray = myRe.exec(input)
        }
        if (myArray == null || myArray.length != 2) {
          // error
          return;
        }
        window.location.assign('/dashboard?v=' + myArray[1]);
      });
    });

  }, {}]
}, {}, [1]);
