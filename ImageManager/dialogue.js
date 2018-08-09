/** The base URL to the computer communication app. */
const baseurl = "http://localhost:1996/"

/** An element used to overlay a highligh on selected images. */
var overlay;
/** The dialog used to download images through. */
var dialogue;

(function($) {
	'use strict';
	overlay = $("<div class='overlay'></div>").appendTo('body');
  $(document).on("keydown", function (e) { getImage(e); });

  /**
   * Keypress event to handle CTRL+S. Fetches an image and opens a dialog with it.
   * @param e {Event} Event information about the keypress.
   */
	function getImage(e) {
		if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
			e.preventDefault();
			switch (window.location.origin) {
				case "https://twitter.com":
					getTwitterImage();
					break;
				case "":
					break;
      }
      switch (window.location.host) {
        case "twitter.com":
          getTwitterImage();
          break;
        case "tumblr.com":
          getTumblrImage();
          break;
        case "pixiv.net":
          getPixivImage();
          break;
        case "furaffinity.net":
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
    switch (window.location.host) {
      case "twitter.com":
        author = $(container).closest('.content, .permalink-tweet, .Gallery-content').find('.username b').first().text();
        title = "";
        url = $(container).find('img')[0].src;
        if (url.split(':').length > 2) { url = url.substr(0, url.lastIndexOf(':')); }
        url += ":orig";
        break;
      case "tumblr.com":
        break;
      case "pixiv.net":
        break;
      case "furaffinity.net":
        break;
    }

		toDataURL(url, function(img) {
			$("#save-form").off('dialogopen').on('dialogopen', function() {
				var $this = $(this);
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
			<h2>Artist found: <span id='imgArtist' contenteditable='true'>(unknown artist)</span></h2><br/>
			<table style='width:100%;height: 85%;'><tr style='vertical-align:top'>
			  <td style='padding-right:3%'><a target='_blank'><img id='imgPreview' style='max-width:100%;max-height:275px;'></a></td>
			  <td><div class='fields'>
			    <div><div><h4>Filename:</h4></div><div><input id='imgFilename' autofocus/></div></div>
			    <div><div><h4>Title:</h4></div>   <div><input id='imgTitle'/></div></div>
			    <div><div><h4>Tags:</h4></div>    <div><input id='imgTags' /></div></div>
          <div><div><h4>Folder:</h4></div>  <div></div></div>
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

  dialogue.find("")

  /**
   * Write exif data from the dialogue to the image and download to the user's computer.
   */
	function saveFile() {
		// write exif data
		var img = $('#imgPreview').attr('src');
		var exif = {};
		exif[piexif.ImageIFD.XPTitle] = toBytes(document.getElementById('imgTitle').value);
		exif[piexif.ImageIFD.XPAuthor] = toBytes($("#imgArtist").text());
		exif[piexif.ImageIFD.XPKeywords] = toBytes(document.getElementById('imgTags').value);
		img = piexif.insert(piexif.dump({"0th": exif}), img);
		
		// download image
    callComp("download", true, {
      data: img,
      folder: "",
      filename: (document.getElementById('imgFilename').value || "file") + ".jpg"
    });
	}


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
      for (var i = 0; i < msg.tumblr.length; i++) { $icons.append("<a target='_blank' class='tumblr' href='http://" + msg.tumblr[i] + ".tumblr.com'>"); }
      for (var i = 0; i < msg.twitter.length; i++) { $icons.append("<a target='_blank' class='twitter' href='https://www.twitter.com/" + msg.twitter[i] + "'>"); }
      for (var i = 0; i < msg.pixiv.length; i++) { $icons.append("<a target='_blank' class='pixiv' href='https://www.pixiv.net/member.php?id=" + msg.pixiv[i] + "'>"); }
      for (var i = 0; i < msg.fa.length; i++) { $icons.append("<a target='_blank' class='furaffinity' href='https://www.furaffinity.net/user/" + msg.fa[i] + "'>"); }
      if (callback) { callback(author); }
    })
  }


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

})(jQuery);
