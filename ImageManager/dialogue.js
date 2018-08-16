/** The base URL to the computer communication app. */
const baseurl = "http://localhost:1996/";

(function($) {
  'use strict';

  /** An element used to overlay a highligh on selected images. */
  var overlay;
  /** The dialog used to download images through. */
  var dialogue;
  /** The domain the dialogue is running in. */
  var domain;
  /** The username found on the page for the artist. */
  var username;

	overlay = $("<div class='overlay'></div>").appendTo('body');
  $(document).on("keydown", function (e) { getImage(e); });

  /**
   * Keypress event to handle CTRL+S. Fetches an image and opens a dialog with it.
   * @param e {Event} Event information about the keypress.
   */
	function getImage(e) {
		if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
			e.preventDefault();
      switch (window.location.host) {
        case "twitter.com":
          domain = "Twitter";
          getTwitterImage();
          break;
        case "tumblr.com":
          domain = "Tumblr";
          getTumblrImage();
          break;
        case "pixiv.net":
          domain = "Pixiv";
          getPixivImage();
          break;
        case "furaffinity.net":
          domain = "FA";
          getFAImage();
          break;
      }
		}

    /** Select images from a Twitter webpage. */
		function getTwitterImage() {
			// is an image opened?
			var ctr = $(".Gallery-media:visible");
			if (!ctr.length) {
				// if not, get a list of all visible photos
				if (document.getElementsByClassName("permalink-container").length) {
					ctr = $(".permalink-container .AdaptiveMedia-photoContainer:visible:onScreen");
				} else {
					ctr = $(".AdaptiveMedia-photoContainer:visible:onScreen");
				}
			}
			// if there is only one image, save that. else figure out which to use
			if (ctr.length > 1) {
				$.when(pickImage(ctr)).then(function(ctr) {openDialogue(ctr)});
			} else if (ctr.length == 1) {
				openDialogue(ctr);
			}
		}

    /** Select images from a Tumblr webpage. */
		function getTumblrImage() {
    }

    /** Select images from a Pixiv webpage. */
    function getPixivImage() {
    }

    /** Select images from a FurAffinity webpage. */
    function getFAImage() {
    }
	}

  /**
   * Highlight an element from a list and wait for a selection to be made.
   * @param {Element[]} list A list of HTML elements to cycle through.
   * @returns {JQueryPromise} Resolves to the selected element once a choice is made.
   */
	function pickImage(list) {
		var dfd = $.Deferred();
		var i = 0;
		var activeImg = $(list[i]);
		overlay.css('visibility', 'visible');
		highlight(activeImg);
		$(document).on('keydown.selectImg', function(e) {
			if (e.keyCode == 13) {
				// enter - select image
				e.preventDefault();
				overlay.css('visibility', 'hidden');
				$(this).off('keydown.selectImg');
				dfd.resolve(activeImg);
			} else if (e.keyCode == 9) {
				// tab - switch highlighted image
				e.preventDefault();
				i = (i + 1) % list.length;
				activeImg = $(list[i]);
				highlight(activeImg);
			} else if (e.keyCode == 27 || (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))) {
				// esc or ctrl+s - exit save
				overlay.css('visibility', 'hidden');
				$(this).off('keydown.selectImg');
				dfd.reject();
				getImage(e);
			}
		});
		return dfd.promise();

    /**
     * Add an overlay border to the selected element.
     * @param {Element} img The element to add the border to.
     */
		function highlight(img) {
			overlay.offset(img.offset());
			overlay.css({
				'height': img.height() + "px",
				'width': img.width() + "px",
				'boxShadow': "0 0 10px 6px #5AF",
				'pointerEvents': "none",
				'zIndex': "3000"
			});
		}
	}

  /**
   * Gather information from around the image to initialize a dialog with.
   * @param {Element} container The container of the element to pull information relative to.
   */
	function openDialogue(container) {
    var url, author, title;
    switch (domain) {
      case "Twitter":
        author = $(container).closest('.content, .permalink-tweet, .Gallery-content').find('.username b').first().text();
        title = "";
        url = $(container).find('img')[0].src;
        if (url.split(':').length > 2) { url = url.substr(0, url.lastIndexOf(':')); }
        url += ":orig";
        break;
      case "Tumblr":
        break;
      case "Pixiv":
        break;
      case "FA":
        break;
    }
    username = author;

		toDataURL(url, function(img) {
			$("#save-form").off('dialogopen').on('dialogopen', function() {
        var $this = $(this);
        $this.find("#imgFilename").val("");
				$this.find('#imgPreview').attr('src', img).parent().attr('href', url);
				$this.find('#imgArtist').text(author)
				$this.find('#imgTitle').val(title);
        $this.find('#imgTags').val("");
        getAuthor(author);
			});
			dialogue.dialog('open');
		})
	}



	//-- Modal dialogue base ------------------------------------------------------------------------------------
	$('body').append(`
		<div id='dialogContainer' class='jui'></div>
		<div id='save-form'>
			<h2>Artist found: <span id='imgArtist' contenteditable='true' spellcheck='false'>(unknown artist)</span></h2><br/>
			<table style='width:100%;height: 90%;'><tr style='vertical-align:top'>
			  <td style='padding-right:3%'><a target='_blank'><img id='imgPreview' style='max-width:100%;max-height:275px;'></a></td>
			  <td><div class='fields'>
			    <div><div><h4>Filename:</h4></div><div><input id='imgFilename' autofocus/></div></div>
			    <div><div><h4>Title:</h4></div>   <div><input id='imgTitle'/></div></div>
			    <div><div><h4>Tags:</h4></div>    <div><input id='imgTags' /></div></div>
          <div style='flex-grow:1'><div><h4>Folder:</h4></div>  <div id='imgFolder'></div></div>
          <div><div class='icons'></div></div>
			  </div></td>
			</tr></table>
		</div>
	`);

	dialogue = $("#save-form").dialog({
		autoOpen: false,
		height: 500,
		width: 600,
		modal: true,
		title: "Save Image",
		closeText: '',
		buttons: {
			Save: function() { saveFile(); dialogue.dialog("close"); },
			Cancel: function() { dialogue.dialog("close"); }
		},
		appendTo: '#dialogContainer'
	});

  /** Write exif data from the dialogue to the image and download to the user's computer. */
	function saveFile() {
		// write exif data
		var img = $('#imgPreview').attr('src');
		var exif = {};
		exif[piexif.ImageIFD.XPTitle] = toBytes(document.getElementById('imgTitle').value);
		exif[piexif.ImageIFD.XPAuthor] = toBytes($("#imgArtist").text());
		exif[piexif.ImageIFD.XPKeywords] = toBytes(document.getElementById('imgTags').value);
		img = piexif.insert(piexif.dump({"0th": exif}), img);
		
		// download image
    var filename = document.getElementById('imgFilename').value || new Date().getTime();
    if (!filename.endsWith('.jpg')) { filename += '.jpg'; }
    callComp("download", true, {
      data: img,
      folder: $("#imgFolder .folder[data-selected]").last().attr('data-folder'),
      filename: filename
    });
  }

  /** When the filename changes, make sure it doesn't already exist. */
  dialogue.find("#imgFilename").on("keyup paste", function () {
    callComp("doesFileExist", false, { filepath: "" + this.value + ".jpg" }, function (fileExists) {
      var label = dialogue.find("#imgFilename").parent().prev().children();
      if (fileExists) { label.addClass("error").attr("title", "File already exists."); }
      else { label.removeClass("error").attr("title", ""); }
    })
  });

  /** When the artist changes, re-fetch their information. */
  dialogue.find("#imgArtist").on("blur", function () {
    getAuthor(this.innerText);
  })


	//-- Communication functions ---------------------------------------------------------------------------
  /**
   * Call a function on the computer communication app.
   * @param {string} handler The handler to call.
   * @param {boolean} isPost True for POST, false for GET.
   * @param {Function} callback A function to call once a response is received.
   */
  function callComp(handler, isPost, data, callback) {
    $.ajax({
      url: baseurl + handler,
      type: isPost? "POST" : "GET",
      data: data,
      success: function (msg) {
        if (callback) callback(msg);
      },
      error: function (xhr, status, error) {
        console.error("AJAX error: " + status)
      }
    })
  }

  /**
   * Get an author's information and populate related fields.
   * @param {string} name The name of the author to fetch.
   * @param {Function} callback A function to call after the author is obtained.
   */
  function getAuthor(name, callback) {
    callComp("fetchArtist", false, { name: name }, function (msg) {
      var $icons = dialogue.find(".icons");
      $icons.empty();
      if (msg) {
        if (domain == "Pixiv") {
          // pixiv artist; check if pixiv id needs to be added
        } else if (msg[domain].indexOf(name) == -1) {
          // artist exists in database, but this page isn't registered for them
          if (confirm("Add artist '" + username + "' to the database under '" + name + "'?")) {
            msg[domain].push(username);
            if (msg.Nicknames.indexOf(username) == -1) msg.Nicknames.push(username);
            callComp("updateArtist", true, { "artist": msg, "update": true });
          }
        }
        var str = "<a tabindex='-1' target='_blank' class='{0}' title='{1}' href='{2}'>"
        for (var i = 0; i < msg.Tumblr.length; i++)
          $icons.append(str.format("tumblr", msg.Tumblr[i], "http://" + msg.Tumblr[i] + ".tumblr.com"));
        for (var i = 0; i < msg.Twitter.length; i++)
          $icons.append(str.format("twitter", msg.Twitter[i], "https://www.twitter.com/" + msg.Twitter[i]));
        for (var i = 0; i < msg.Pixiv.length; i++)
          $icons.append(str.format("pixiv", msg.Pixiv[i], "https://www.pixiv.net/member.php?id=" + msg.Pixiv[i]));
        for (var i = 0; i < msg.FA.length; i++)
          $icons.append(str.format("furaffinity", msg.FA[i], "https://www.furaffinity.net/user/" + msg.FA[i]));

      } else {
        // brand new artist; add to database

      }
      openPath("", msg? msg.Folder:"", function (html) {
        dialogue.find("#imgFolder").html(html);
      });
      if (callback) { callback(msg); }
    })
  }

  /**
   * Recursive function to build a folder structure from a specified base.
   * @param {string} base The base path to the folder you want to start opening from.
   * @param {string} filepath The folder currently being opened.
   * @param {Function} callback A function to call back once the children are received.
   * @param {string} child The name of an opened child, if there is one. Keep initially blank.
   * @param {Element} children All the subdirectories of the child, if there are any. Keep initially blank.
   */
  function openPath(base, filepath, callback, child, children) {
    callComp("GetFolders", false, { folder: base + filepath }, function (msg) {
      var elems = [];
      var f = filepath.substring(filepath.lastIndexOf("\\") + 1);
      if (typeof child == "undefined") { child = f; }
      for (var i = 0; i < msg.length; i++) {
        var c = msg[i].substring(msg[i].lastIndexOf("\\") + 1);
        var elem = $("<div class='folder' data-folder='" + msg[i] + "' tabindex='-1' ><span>" + c + "</span></div>")
        if (c == child) { elem.append(children); elem.attr("data-selected", true); }
        elems.push(elem);
      }
      if (filepath != "") {
        openPath(base, filepath.substring(0, filepath.lastIndexOf("\\")), function (e) {
          callback(e);
        }, f, elems);
      } else {
        callback(elems);
      }
    });
  }

  dialogue.on("click", ".folder", function (e) {
    e.stopPropagation();
    let $this = $(this);
    if ($this.attr("data-selected")) {
      $this.children().remove(".folder");
      $this.removeAttr("data-selected");
    } else {
      dialogue.find("#imgFolder div[data-selected]").removeAttr("data-selected");
      $this.parentsUntil("#imgFolder").addBack().attr("data-selected", true);
      if ($this.children().length <= 1) {
        openPath($this.attr("data-folder") + "\\", "", function (html) {
          $this.append(html);
        })
      }
    }
  });

  /** Handle the arrow keys with the folder selection */
  dialogue.on("keydown", ".folder", function (e) {
    var $this = $(this);
    if (e.which < 37 || e.which > 40) { return; }
    switch (e.which) {
      case 37:  // left
        $this.attr("data-selected", true).click();
        break;
      case 38:  // up
        if (!$this.attr("data-selected") && $this.parent('.folder')[0]) { $this = $this.parent('.folder'); }
        var prev = $this.prev('.folder')[0];
        if (prev) { if ($(prev).children()[1]) { prev = $(prev).children().last()[0]; } }
        if (!prev) { prev = $this.parent('.folder')[0] || $this[0]; }
        $(prev).removeAttr("data-selected").click().focus();
        break;
      case 39:  // right
        $this.removeAttr("data-selected").click();
        break;
      case 40:  // down
        var next = $this.children('.folder')[0] || $this.next()[0];
        if (!next || (!$this.attr("data-selected") && $this.parent('.folder')[0])) { next = $this.parent().next()[0]; }
        if (!next) { next = this; }
        $(next).removeAttr("data-selected").click().focus()
        break;
    }
    e.preventDefault();
    e.stopPropagation();
  })

	//-- Helper functions ----------------------------------------------------------------------------------
  /**
   * Onscreen selector. Only returns true for elements which are at least halfway onscreen.
   * @param {Element} elem The HTML element to check.
   * @return {boolean} True if the element is at least halfway onscreen.
   */
	$.expr[":"].onScreen = function(elem) {
		var $window = $(window)
		var viewport_top = $window.scrollTop()
		var viewport_height = $window.height()
    var viewport_bottom = viewport_top + viewport_height

    var $elem = $(elem)
    var height = $elem.height()
		var top = $elem.offset().top
		var middle = top + height/2;
		var bottom = top + height
		return (top >= viewport_top && middle < viewport_bottom) ||
					 (middle > viewport_top && bottom <= viewport_bottom) ||
					 (height > viewport_height && top <= viewport_top && bottom >= viewport_bottom)
	};

  /**
   * Converts an image to data URI.
   * @param {string} url The URL to the image to convert.
   * @param {Function} callback A function to call back once the image is converted.
   */
	function toDataURL(url, callback){
		var xhr = new XMLHttpRequest();
		xhr.open('get', url);
		xhr.responseType = 'blob';
		xhr.onload = function(){
			var fr = new FileReader();
			fr.onload = function(){
				callback(this.result);
			};
			fr.readAsDataURL(xhr.response);
		};
    xhr.send();
	};

  /**
   * Convert a string to UTF-16 byte data.
   * @param {string} str The string to convert.
   * @returns {number[]} The string as an array of byte data.
   */
	function toBytes(str) {
		var data = [];
		var code = 0;
		for (var i = 0; i < str.length; i++){
			code = str.charCodeAt(i);
			data.push(code & 0xFF);
			data.push((code >> 8) & 0xFF);
		}
		return data;
  }

  if (!String.prototype.format) {
    /** Format string function. */
    String.prototype.format = function () {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
          ;
      });
    };
  }
})(jQuery);
