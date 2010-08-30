/// <reference path="jquery-1.2.6-vsdoc.js" />
(function($) {

    $.fn.annotateImage = function(options) {
        ///	<summary>
        ///		Creates annotations on the given image.
        ///     Images are loaded from the "getUrl" propety passed into the options.
        ///	</summary>
        var opts = $.extend({}, $.fn.annotateImage.defaults, options);
        var image = this;

        this.image = this;
        this.mode = 'view';

        // Assign defaults
        this.getUrl = opts.getUrl;
        this.saveUrl = opts.saveUrl;
        this.deleteUrl = opts.deleteUrl;
        this.deleteUrl = opts.deleteUrl;
        this.editable = opts.editable;
        this.useAjax = opts.useAjax;
        this.tags = opts.tags;
        this.notes = opts.notes;
        this.labels = opts.labels;
        this.csrf = opts.csrf;
        this.cssaclass = opts.cssaclass;

        // Add the canvas
        this.canvas = $('<div class="image-annotate-canvas g-thumbnail"><div class="image-annotate-view"></div><div class="image-annotate-edit"><div class="image-annotate-edit-area"></div></div></div>');
        this.canvas.children('.image-annotate-edit').hide();
        this.canvas.children('.image-annotate-view').hide();
        this.image.after(this.canvas);

        // Give the canvas and the container their size and background
        this.canvas.height(this.height());
        this.canvas.width(this.width());
        this.canvas.css('background-image', 'url("' + this.attr('src') + '")');
        this.canvas.children('.image-annotate-view, .image-annotate-edit').height(this.height());
        this.canvas.children('.image-annotate-view, .image-annotate-edit').width(this.width());

        // Add the behavior: hide/show the notes when hovering the picture
        this.canvas.hover(function() {
            if ($(this).children('.image-annotate-edit').css('display') == 'none') {
                $(this).children('.image-annotate-view').show();
            }
        }, function() {
            $(this).children('.image-annotate-view').hide();
            $(this).children('.image-annotate-note').hide();
        });

        this.canvas.children('.image-annotate-view').hover(function() {
            $(this).show();
        }, function() {
            $(this).hide();
            $(this).children('.image-annotate-note').hide();
        });

        // load the notes
        if (this.useAjax) {
            $.fn.annotateImage.ajaxLoad(this);
        } else {
            $.fn.annotateImage.load(this, this.labels, this.editable, this.csrf, this.deleteUrl, this.tags, this.saveUrl, this.cssaclass);
        }

        // Add the "Add a note" button
        if ($('#g-photoannotation-link').length != 0) {
            this.button = $('#g-photoannotation-link');
            this.button.click(function() {
                $.fn.annotateImage.add(image, opts.tags, opts.labels, opts.saveUrl, opts.csrf);
            });
            //this.canvas.after(this.button);
        }

        // Hide the original
        this.hide();

        return this;
    };

    /**
    * Plugin Defaults
    **/
    $.fn.annotateImage.defaults = {
        getUrl: 'your-get.rails',
        saveUrl: 'your-save.rails',
        deleteUrl: 'your-delete.rails',
        editable: true,
        useAjax: true,
        tags: new Array(),
        notes: new Array()
    };

    $.fn.annotateImage.clear = function(image) {
        ///	<summary>
        ///		Clears all existing annotations from the image.
        ///	</summary>    
        for (var i = 0; i < image.notes.length; i++) {
            image.notes[image.notes[i]].destroy();
        }
        image.notes = new Array();
    };

    $.fn.annotateImage.ajaxLoad = function(image) {
        ///	<summary>
        ///		Loads the annotations from the "getUrl" property passed in on the
        ///     options object.
        ///	</summary>
        $.getJSON(image.getUrl + '?ticks=' + $.fn.annotateImage.getTicks(), function(data) {
            image.notes = data;
            $.fn.annotateImage.load(image);
        });
    };

    $.fn.annotateImage.load = function(image, labels, editable, csrf, deleteUrl, tags, saveUrl, cssaclass) {
        ///	<summary>
        ///		Loads the annotations from the notes property passed in on the
        ///     options object.
        ///	</summary>
        for (var i = 0; i < image.notes.length; i++) {
            image.notes[image.notes[i]] = new $.fn.annotateView(image, image.notes[i], tags, labels, editable, csrf, deleteUrl, saveUrl, cssaclass);
        }
    };

    $.fn.annotateImage.getTicks = function() {
        ///	<summary>
        ///		Gets a count og the ticks for the current date.
        ///     This is used to ensure that URLs are always unique and not cached by the browser.
        ///	</summary>        
        var now = new Date();
        return now.getTime();
    };

    $.fn.annotateImage.add = function(image, tags, labels, saveUrl, csrf) {
        ///	<summary>
        ///		Adds a note to the image.
        ///	</summary>        
        if (image.mode == 'view') {
            image.mode = 'edit';

            // Create/prepare the editable note elements
            var editable = new $.fn.annotateEdit(image, null, tags, labels, saveUrl, csrf);

            $.fn.annotateImage.createSaveButton(editable, image);
            $.fn.annotateImage.createCancelButton(editable, image);
        }
    };

    $.fn.annotateImage.createSaveButton = function(editable, image, note) {
        ///	<summary>
        ///		Creates a Save button on the editable note.
        ///	</summary>
        var ok = $('<a class="image-annotate-edit-ok g-button ui-corner-all ui-icon-left ui-state-default">OK</a>');

        ok.click(function() {
            var form = $('#image-annotate-edit-form form');
            var text = $('#image-annotate-text').val();
            $.fn.annotateImage.appendPosition(form, editable)
            image.mode = 'view';

            form.submit();

            editable.destroy();
       });
        editable.form.append(ok);
    };

    $.fn.annotateImage.createCancelButton = function(editable, image) {
        ///	<summary>
        ///		Creates a Cancel button on the editable note.
        ///	</summary>
        var cancel = $('<a class="image-annotate-edit-close g-button ui-corner-all ui-icon-left ui-state-default">Cancel</a>');
        cancel.click(function() {
            editable.destroy();
            image.mode = 'view';
            location.reload();
        });
        editable.form.append(cancel);
    };

    $.fn.annotateImage.saveAsHtml = function(image, target) {
        var element = $(target);
        var html = "";
        for (var i = 0; i < image.notes.length; i++) {
            html += $.fn.annotateImage.createHiddenField("text_" + i, image.notes[i].text);
            html += $.fn.annotateImage.createHiddenField("top_" + i, image.notes[i].top);
            html += $.fn.annotateImage.createHiddenField("left_" + i, image.notes[i].left);
            html += $.fn.annotateImage.createHiddenField("height_" + i, image.notes[i].height);
            html += $.fn.annotateImage.createHiddenField("width_" + i, image.notes[i].width);
        }
        element.html(html);
    };

    $.fn.annotateImage.createHiddenField = function(name, value) {
        return '&lt;input type="hidden" name="' + name + '" value="' + value + '" /&gt;<br />';
    };

    $.fn.annotateEdit = function(image, note, tags, labels, saveUrl, csrf) {
        ///	<summary>
        ///		Defines an editable annotation area.
        ///	</summary>
        this.image = image;

        if (note) {
            this.note = note;
        } else {
            var newNote = new Object();
            newNote.noteid = "new";
            newNote.top = 30;
            newNote.left = 30;
            newNote.width = 30;
            newNote.height = 30;
            newNote.text = "";
            newNote.description = "";
            newNote.notetype = "";
            this.note = newNote;
        }

        // Set area
        var area = image.canvas.children('.image-annotate-edit').children('.image-annotate-edit-area');
        this.area = area;
        this.area.css('height', this.note.height + 'px');
        this.area.css('width', this.note.width + 'px');
        this.area.css('left', this.note.left + 'px');
        this.area.css('top', this.note.top + 'px');

        // Show the edition canvas and hide the view canvas
        image.canvas.children('.image-annotate-view').hide();
        image.canvas.children('.image-annotate-edit').show();

        // Add the note (which we'll load with the form afterwards)
        var selectedtag = "";
        if (this.note.text == "" || this.note.notetype == "note")
        {
          selectedtag = " selected=\"selected\"";
        }
        var tagdropdown = labels[0] + '<select id="tagsList" class="dropdown" name="tagsList"><option value="-1"' + selectedtag + '>No Tag</option>';
        if (tags)
        {
          for (var tag in tags)
          {
            var tagval = tags[tag];
            selectedtag = "";
            if (tagval.name == this.note.text && this.note.notetype == "face") {
              selectedtag = " selected=\"selected\"";
            }
            tagdropdown += '<option value="' + tagval.id + '"' + selectedtag + '>' + tagval.name + '</option>';
          }
        }
        tagdropdown += '</select>';
        var notetitle = "";
        if (this.note.notetype == "note") {
          notetitle = this.note.text;
        }
        var form = $('<div id="image-annotate-edit-form"><form action="' + saveUrl + '" method="post"><input type="hidden" name="csrf" value="' + csrf + '" /><input type="hidden" name="noteid" value="' + this.note.noteid + '" /><input type="hidden" name="notetype" value="' + this.note.notetype + '" />' + tagdropdown + labels[1] + '<textarea id="image-annotate-text" name="text" rows="3" cols="30">' + notetitle + '</textarea>' + labels[2] + '<textarea id="image-annotate-desc" name="desc" rows="3" cols="30">' + this.note.description + '</textarea></form></div>');
        this.form = form;

        $('body').append(this.form);
        this.form.css('left', this.area.offset().left + 'px');
        this.form.css('top', (parseInt(this.area.offset().top) + parseInt(this.area.height()) + 7) + 'px');

        // Set the area as a draggable/resizable element contained in the image canvas.
        // Would be better to use the containment option for resizable but buggy
        area.resizable({
            handles: 'all',

            stop: function(e, ui) {
                form.css('left', area.offset().left + 'px');
                form.css('top', (parseInt(area.offset().top) + parseInt(area.height()) + 2) + 'px');
            }
        })
        .draggable({
            containment: image.canvas,
            drag: function(e, ui) {
                form.css('left', area.offset().left + 'px');
                form.css('top', (parseInt(area.offset().top) + parseInt(area.height()) + 2) + 'px');
            },
            stop: function(e, ui) {
                form.css('left', area.offset().left + 'px');
                form.css('top', (parseInt(area.offset().top) + parseInt(area.height()) + 2) + 'px');
            }
        });
        return this;
    };

    $.fn.annotateEdit.prototype.destroy = function() {
        ///	<summary>
        ///		Destroys an editable annotation area.
        ///	</summary>        
        this.image.canvas.children('.image-annotate-edit').hide();
        this.area.resizable('destroy');
        this.area.draggable('destroy');
        this.area.css('height', '');
        this.area.css('width', '');
        this.area.css('left', '');
        this.area.css('top', '');
        this.form.remove();
    }

    $.fn.annotateView = function(image, note, tags, labels, editable, csrf, deleteUrl, saveUrl, cssaclass) {
        ///	<summary>
        ///		Defines a annotation area.
        ///	</summary>
        this.image = image;

        this.note = note;

        // Add the area
        this.area = $('<div class="image-annotate-area' + (this.note.editable ? ' image-annotate-area-editable' : '') + '"><div></div></div>');
        image.canvas.children('.image-annotate-view').prepend(this.area);
        
        if (editable) {
          this.delarea = $('<div id="photoannotation-del-' + this.note.noteid + '" class="image-annotate-area photoannotation-del-button"><div><form method="post" action="' + deleteUrl + '"><input type="hidden" name="notetype" value="' + this.note.notetype + '" /><input type="hidden" name="noteid" value="' + this.note.noteid + '" /><input type="hidden" name="csrf" value="' + csrf + '" /></form></div></div>');
          this.editarea = $('<div id="photoannotation-edit-' + this.note.noteid + '" class="image-annotate-area photoannotation-edit-button"><div></div></div>');
          image.canvas.children('.image-annotate-view').prepend(this.delarea);
          image.canvas.children('.image-annotate-view').prepend(this.editarea);
          this.delarea.bind('click',function () {
            if (confirm(labels[3])) {
              var alink = $(cssaclass);
              alink.unbind();
              alink.attr ('href', '#');
              alink.removeAttr ('rel');
              var delform = $(this).children('div').children('form');
              delform.submit();
            }
          })
          var form = this;
          this.editarea.bind('click',function () {
            var alink = $(cssaclass);
            alink.unbind();
            alink.attr ('href', '#');
            alink.removeAttr ('rel');
            form.edit(tags, labels, saveUrl, csrf);
          })
          this.delarea.hide();
          this.editarea.hide();
        }
        
        // Add the note
        var notedescription = "";
        if (note.description != "") {
          notedescription = "<br />" + note.description;
        }
        this.form = $('<div class="image-annotate-note">' + note.text + notedescription + '</div>');
        this.form.hide();
        image.canvas.children('.image-annotate-view').append(this.form);
        this.form.children('span.actions').hide();

        // Set the position and size of the note
        this.setPosition();

        // Add the behavior: hide/display the note when hovering the area
        var annotation = this;
        this.area.hover(function() {
            annotation.show();
            if (annotation.delarea != undefined) {
              annotation.delarea.show();
              annotation.editarea.show();
            }
        }, function() {
            annotation.hide();
            if (annotation.delarea != undefined) {
              annotation.delarea.hide();
              annotation.editarea.hide();
            }
        });

        if (editable) {
          this.delarea.hover(function() {
              annotation.delarea.show();
              annotation.editarea.show();
          }, function() {
              annotation.delarea.hide();
              annotation.editarea.hide();
          });
          this.editarea.hover(function() {
              annotation.delarea.show();
              annotation.editarea.show();
          }, function() {
              annotation.delarea.hide();
              annotation.editarea.hide();
          });
        }
        // Edit a note feature
        if (note.url != "" && note.url != null) {
            this.area.bind('click',function () {
              var alink = $(cssaclass);
              alink.unbind();
              alink.attr ('href', '#');
              alink.removeAttr ('rel');
              window.location = note.url;
            })
        }
    };

    $.fn.annotateView.prototype.setPosition = function() {
        ///	<summary>
        ///		Sets the position of an annotation.
        ///	</summary>
        this.area.children('div').height((parseInt(this.note.height) - 2) + 'px');
        this.area.children('div').width((parseInt(this.note.width) - 2) + 'px');
        this.area.css('left', (this.note.left) + 'px');
        this.area.css('top', (this.note.top) + 'px');
        this.form.css('left', (this.note.left) + 'px');
        this.form.css('top', (parseInt(this.note.top) + parseInt(this.note.height) + 7) + 'px');
        
        if (this.delarea != undefined) {
          this.delarea.children('div').height('14px');
          this.delarea.children('div').width('14px');
          this.delarea.css('left', (this.note.left + parseInt(this.note.width)) + 'px');
          this.delarea.css('top', (this.note.top) + 'px');
          this.editarea.children('div').height('14px');
          this.editarea.children('div').width('14px');
          this.editarea.css('left', (this.note.left + parseInt(this.note.width)) + 'px');
          this.editarea.css('top', (this.note.top + 16) + 'px');
        }
    };

    $.fn.annotateView.prototype.show = function() {
        ///	<summary>
        ///		Highlights the annotation
        ///	</summary>
        this.form.fadeIn(250);
        if (!this.note.editable) {
            this.area.addClass('image-annotate-area-hover');
        } else {
            this.area.addClass('image-annotate-area-editable-hover');
        }
    };

    $.fn.annotateView.prototype.hide = function() {
        ///	<summary>
        ///		Removes the highlight from the annotation.
        ///	</summary>      
        this.form.fadeOut(250);
        this.area.removeClass('image-annotate-area-hover');
        this.area.removeClass('image-annotate-area-editable-hover');
    };

    $.fn.annotateView.prototype.destroy = function() {
        ///	<summary>
        ///		Destroys the annotation.
        ///	</summary>      
        this.area.remove();
        this.form.remove();
    }

    $.fn.annotateView.prototype.edit = function(tags, labels, saveUrl, csrf) {
        ///	<summary>
        ///		Edits the annotation.
        ///	</summary>      
        if (this.image.mode == 'view') {
            this.image.mode = 'edit';
            var annotation = this;

            // Create/prepare the editable note elements
            var editable = new $.fn.annotateEdit(this.image, this.note, tags, labels, saveUrl, csrf);
            $.fn.annotateImage.createSaveButton(editable, this.image, annotation);
            $.fn.annotateImage.createCancelButton(editable, this.image);
        }
    };

    $.fn.annotateImage.appendPosition = function(form, editable) {
        ///	<summary>
        ///		Appends the annotations coordinates to the given form that is posted to the server.
        ///	</summary>
        var areaFields = $('<input type="hidden" value="' + editable.area.height() + '" name="height"/>' +
                           '<input type="hidden" value="' + editable.area.width() + '" name="width"/>' +
                           '<input type="hidden" value="' + editable.area.position().top + '" name="top"/>' +
                           '<input type="hidden" value="' + editable.area.position().left + '" name="left"/>' +
                           '<input type="hidden" value="' + editable.note.id + '" name="id"/>');
        form.append(areaFields);
    }

    $.fn.annotateView.prototype.resetPosition = function(editable, text) {
        ///	<summary>
        ///		Sets the position of an annotation.
        ///	</summary>
        this.form.html(text);
        this.form.hide();

        // Resize
        this.area.children('div').height(editable.area.height() + 'px');
        this.area.children('div').width((editable.area.width() - 2) + 'px');
        this.area.css('left', (editable.area.position().left) + 'px');
        this.area.css('top', (editable.area.position().top) + 'px');
        this.form.css('left', (editable.area.position().left) + 'px');
        this.form.css('top', (parseInt(editable.area.position().top) + parseInt(editable.area.height()) + 7) + 'px');

        // Save new position to note
        this.note.top = editable.area.position().top;
        this.note.left = editable.area.position().left;
        this.note.height = editable.area.height();
        this.note.width = editable.area.width();
        this.note.text = text;
        this.note.id = editable.note.id;
        this.editable = true;
    };

})(jQuery);
