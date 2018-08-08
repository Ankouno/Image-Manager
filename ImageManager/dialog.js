var overlay;
var dialog;

(function($) {
	'use strict';
	overlay = $("<div class='overlay'></div>").appendTo('body');

	$(document).on("keydown", function(e) {getImage(e);});
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
			if (window.location.host == "twitter.com") {
				getTwitterImage();
			} else if (window.location.origin == "") {
				getTumblrImage();
			}
		}

		function getTwitterImage() {
			// is an image open?
			var ctr = $(".Gallery-media:visible");
			if (!ctr.length) {
				// if not, get a list of all visible photos
				if (document.getElementsByClassName("permalink-container").length) {
					ctr = $(".permalink-container .AdaptiveMedia-photoContainer:visible:onScreen");
				} else {
					ctr = $(".AdaptiveMedia-photoContainer:visible:onScreen");
				}
			}

			// if there is only one image, save that.
			// else figure out which to use
			if (ctr.length > 1) {
				$.when(pickImage(ctr)).then(function(ctr) {openDialogue(ctr)});
			} else if (ctr.length == 1) {
				openDialogue(ctr);
			}
		}

		function getTumblrImage() {
		}
	}

	function pickImage(list) {
		var dfd = $.Deferred();
		var i = 0;
		var activeImg = $(list[i]);
		overlay.css('visibility', 'visible');
		highlight(activeImg);
		$(document).on('keydown.selectImg', function(e) {
			if (e.keyCode == 13) {
				// enter
				e.preventDefault();
				overlay.css('visibility', 'hidden');
				$(this).off('keydown.selectImg');
				dfd.resolve(activeImg);
			} else if (e.keyCode == 9) {
				// tab
				e.preventDefault();
				i = (i + 1) % list.length;
				activeImg = $(list[i]);
				highlight(activeImg);
			} else if (e.keyCode == 27 || (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))) {
				// esc or ctrl+s
				overlay.css('visibility', 'hidden');
				$(this).off('keydown.selectImg');
				dfd.reject();
				getImage(e);
			}
		});
		return dfd.promise();

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

	function openDialogue(container) {
		var url, author, title;
		if (window.location.host == "twitter.com") {
			author = $(container).closest('.content, .permalink-tweet, .Gallery-content').find('.username b').first().text();
			title = "";
			url = $(container).find('img')[0].src;
			if (url.split(':').length > 2) { url = url.substr(0, url.lastIndexOf(':')); }
			url += ":orig";
		}
		toDataURL(url, function(img) {
			$("#save-form").off('dialogopen').on('dialogopen', function() {
				var $this = $(this);
				$this.find('#imgPreview').attr('src', img).parent().attr('href', url);
				$this.find('#imgArtist').text(author)
				$this.find('#imgTitle').val(title);
				$this.find('#imgTags').val("");
			});
			dialog.dialog('open');
		})
	}



	//-- Modal dialogue ------------------------------------------------------------------------------------
	$('body').append(`
		<div id='dialogContainer' class='jui'></div>
		<div id='save-form'>
			<h2 style='color:gray'>Artist found: <span id='imgArtist' contenteditable='true' style='display:inline-block;padding:0 3px'>aaaaa</span></h2><br/>
			<table style='width:100%'><tr style='vertical-align:top'>
			<td style='width:50%;padding-right:3%'><a target='_blank'><img id='imgPreview' style='max-width:100%;max-height:275px;'></a></td>
			<td style='width:50%'><table>
				<tr><td style='padding-right:5px; text-align: right'><h4 style='color:gray;'>Filename:</h4></td><td><input id='imgFilename' autofocus style='padding:2px 4px 0px;font-size: 10pt'/></td></tr>
				<tr><td style='padding-right:5px; text-align: right'><h4 style='color:gray;'>Title:</h4></td><td><input id='imgTitle' style='padding:2px 4px 0px;font-size: 10pt'/></td></tr>
				<tr><td style='padding-right:5px; text-align: right'><h4 style='color:gray;'>Tags:</h4></td> <td><input id='imgTags' style='padding:2px 4px 0px;font-size: 10pt'></h4></td></tr>
			</table>
			</tr></table>
		</div>
	`);

	dialog = $("#save-form").dialog({
		autoOpen: false,
		height: 500,
		width: 600,
		modal: true,
		title: "Save Image",
		closeText: '',
		buttons: {
			"Save": function() { saveFile(); dialog.dialog("close"); },
			Cancel: function() { dialog.dialog("close"); }
		},
		appendTo: '#dialogContainer'
	});

	function saveFile() {
		// write exif data
		var img = $('#imgPreview').attr('src');
		var exif = {};
		exif[piexif.ImageIFD.XPTitle] = toBytes(document.getElementById('imgTitle').value);
		exif[piexif.ImageIFD.XPAuthor] = toBytes($("#imgArtist").text());
		exif[piexif.ImageIFD.XPKeywords] = toBytes(document.getElementById('imgTags').value);
		img = piexif.insert(piexif.dump({"0th": exif}), img);
		
		// download image
		chrome.runtime.sendMessage({
			img:      img,
			filename: (document.getElementById('imgFilename').value || "file") + ".jpg",
			folder:   "test/",
			url:      window.location.host
		})
	}



	//-- Helper functions ----------------------------------------------------------------------------------
	// Onscreen selector. Only picks images which are at least halfway onscreen.
	$.expr[":"].onScreen = function(elem) {
		var $window = $(window)
		var viewport_top = $window.scrollTop()
		var viewport_height = $window.height()
		var viewport_bottom = viewport_top + viewport_height
		var $elem = $(elem)
		var top = $elem.offset().top
		var height = $elem.height()
		var middle = top + height/2;
		var bottom = top + height

		return (top >= viewport_top && middle < viewport_bottom) ||
					 (middle > viewport_top && bottom <= viewport_bottom) ||
					 (height > viewport_height && top <= viewport_top && bottom >= viewport_bottom)
	};

	// Convert image src to data uri.
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

	// Convert string to U-16 bytedata.
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
