const validSites = ['twitter.com']
const baseFolder = "Pictures/";

// passthrough variables because chrome can't seem to communicate this?...
var pathFolder = "";
var currentURL = "";
var filename = "";

chrome.downloads.onDeterminingFilename.addListener(
	function(item, suggest) {
		if (item.mime == 'image/jpeg' && validSites.indexOf(currentURL) != -1) {
			// switch to artist folder
			suggest({filename: baseFolder + pathFolder + filename});
		}
	})

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		pathFolder = request.folder;
		currentURL = request.url;
		filename = request.filename;
		chrome.downloads.download({
			'url': request.img,
		})
	});