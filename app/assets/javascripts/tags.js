/* -*- coding: utf-8 -*- */
/* global cforum, Mustache */

cforum.tags = {
  events: $({}),
  views: {
    tag: "<li class=\"tag\" style=\"display:none\"><input name=\"tags[]\" type=\"hidden\" value=\"{{tag}}\"><i class=\"icon-del-tag del-tag\"> </i> {{tag}}</li>",
    tagSuggestion: "<li class=\"tag\" style=\"display:none\" data-tag=\"{{tag}}\"><i class=\"icon-tag-ok del-tag\"> </i> {{tag}}</li>"
  },

  autocomplete_timeout: null,
  suggestionsTimeout: null,
  maxTags: 4,

  autocomplete: function() {
    cforum.tags.autocomplete_timeout = null;

    var $tag_input = $("#replaced_tag_input");

    if($tag_input.val().length >= 2) {
      $.get(
        cforum.baseUrl + '/' + cforum.currentForum.slug + '/tags/autocomplete.json',
        's=' + encodeURIComponent($tag_input.val()),
        function(data) {
          if(data.length > 0) {
            var val = $tag_input.val();
            var val_l = $.trim(val.toLowerCase());

            for(var i = 0; i < data.length; ++i) {
              if(val_l == data[i].toLowerCase()) {
                return;
              }
            }

            var tag = data[0];

            $tag_input.val(val + tag.substring(val.length));
            $tag_input.selection(val.length, tag.length);
          }
        }
      );

    }
  },

  suggestions: function(text) {
    var tokens = text.split(/[^a-z0-9äöüß-]+/i);
    var words = {};

    for(var i = 0; i < tokens.length; ++i) {
      if(tokens[i].match(/^[a-z0-9äöüß-]+$/i) && tokens[i].length > 2) {
        words[tokens[i].toLowerCase()] = 1;
      }
    }

    return Object.keys(words);
  },

  suggestTags: function() {
    var node = $(document.getElementById('cf_thread_message_content') ?
                 "#cf_thread_message_content" : "#cf_message_content");
    var mcnt;

    if(node.val()) {
      mcnt = node.val();
    }
    else {
      mcnt = node.text();
    }

    if(!mcnt) {
      return;
    }

    var suggestions = cforum.tags.suggestions(mcnt);

    $.get(
      cforum.baseUrl + cforum.currentForum.slug + '/tags.json',
      'tags=' + encodeURIComponent(suggestions.join(",")),
      function(data) {
        var tag_list = $("#tags-suggestions");
        tag_list.html("");

        for(var i = 0; i < data.length && i < cforum.tags.maxTags; ++i) {
          if(!cforum.tags.hasTag(data[i].tag_name)) {
            cforum.tags.appendTag(data[i].tag_name, tag_list,
                                  cforum.tags.views.tagSuggestion);
          }
        }

      }
    );
  },

  addTagSuggestion: function(ev) {
    ev.preventDefault();
    var tag = $(ev.target).closest("li").attr("data-tag");

    if($("#tags-list .tag").length >= cforum.tags.maxTags) {
      return;
    }

    if(!cforum.tags.hasTag(tag)) {
      cforum.tags.appendTag(tag);
      cforum.tags.events.trigger('tags:add-tag', [tag]);
    }
  },

  hasTag: function(name) {
    var tags = $("#tags-list input[type=hidden]");

    for(var i = 0; i < tags.length; ++i) {
      if($(tags[i]).val().toLowerCase() == name) {
        return true;
      }
    }

    return false;
  },

  addTag: function(ev) {
    ev.preventDefault();
    var $this = $(this);

    if($.trim($this.val()) && $this.val() != ',' && $("#tags-list .tag").length < cforum.tags.maxTags) {
      var val = $.trim($this.val().replace(/[, ].*/, '').toLowerCase());

      if(!cforum.tags.hasTag(val)) {
        cforum.tags.appendTag(val);
        cforum.tags.events.trigger('tags:add-tag', val);
      }

      var v = $this.val();
      $this.val(v.indexOf(String.fromCharCode(ev.keyCode)) == -1 ? '' : v.replace(/.*[, ]?/, ''));
    }

  },

  appendTag: function(tag, list, view) {
    if(!list) {
      list = $("#tags-list");
    }

    if(!view) {
      view = cforum.tags.views.tag;
    }

    list.append(Mustache.render(view, {tag: tag}));
    list.find(".tag").last().fadeIn('fast');
  },

  removeTag: function(ev) {
    var $this = $(ev.target);
    var tag = $this.text();

    if($this.hasClass('del-tag')) {
      ev.preventDefault();
      $this.closest("li.tag").fadeOut('fast', function() {
        $(this).remove();
        cforum.tags.events.trigger('tags:remove', tag);
      });
    }
  },

  initTags: function() {
    var el = $("#tags-input");

    if(el.length == 0) {
      return;
    }

    var tags = el.val().split(",").map(function(x) { return $.trim(x); }).filter(function(x) {
      if(x) {
        return true;
      }

      return false;
    });

    cforum.tags.suggestTags();
    for(var i = 0; i < tags.length; ++i) {
      cforum.tags.appendTag(tags[i]);
    }

    $("<input type=\"text\" id=\"replaced_tag_input\" class=\"tags-input\">").insertBefore(el);
    el.remove();
    el = $("#replaced_tag_input");

    el.on('keyup', cforum.tags.handleTagsKeyUp);
    el.on('focusout', cforum.tags.addTag);
    $("#tags-list").on('click', cforum.tags.removeTag);

    $(document.getElementById('cf_thread_message_content') ?
      "#cf_thread_message_content" :
      "#cf_message_content").on('keyup', cforum.tags.handleSuggestionsKeyUp);

    $("#tags-suggestions").on('click', cforum.tags.addTagSuggestion);

    el.autocomplete({
      source: cforum.baseUrl + '/' + cforum.currentForum.slug + '/tags/autocomplete.json',
      minLength: 0,
      select: function(event, ui) {
        $("#replaced_tag_input").val(ui.item.label);
        cforum.tags.addTag.call($("#replaced_tag_input"), event);
      }
    });

    cforum.tags.events.on('tags:add-tag', cforum.tags.checkForInvalidTag);
    cforum.tags.events.on('tags:remove', cforum.tags.hideInvalidWarnings);
  },

  handleTagsKeyUp: function(ev) {
    if(ev.keyCode == 188 || ev.keyCode == 32) {
      cforum.tags.addTag.call($("#replaced_tag_input"), ev);
    }
  },

  checkForInvalidTag: function(event, tag) {
    $.get(cforum.baseUrl + '/' + cforum.currentForum.slug + '/tags.json',
          'tags=' + encodeURIComponent(tag),
          function(data) {
            // if we don't get back json this might be an error
            if(typeof data == 'object') {
              if(data.length === 0) {
                var el = $("#replaced_tag_input").closest(".cntrls").find(".errors");

                if(el.length === 0) {
                  $("#replaced_tag_input").
                    closest(".cntrls").append("<div class=\"errors\"><div></div></div>");
                  el = $("#replaced_tag_input").closest(".cntrls").find(".errors");
                }

                el.find("div").fadeOut("fast", function() {
                  el.html("<div class=\"cf-error\" style=\"display:none\">Dieser Tag existiert nicht. Bitte wählen Sie einen anderen.</div>");
                  el.find("div").fadeIn("fast");
                });
              }
              else {
                $("#replaced_tag_input").
                  closest(".cntrls").
                  find(".errors div").
                  fadeOut("fast", function() { $(this).remove(); });
              }
            }
          });
  },

  hideInvalidWarnings: function(ev, tag) {
    $("#replaced_tag_input").
      closest(".cntrls").
      find(".errors div").
      fadeOut("fast", function() { $(this).remove(); });
  }
};


/* eof */
