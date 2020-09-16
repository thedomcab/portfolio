var numSteps = 100.0;
var boxElement, prevRation = 0.0;
var imageCount = 0;
var observer;
var loading = true;
var elements = "#header img, #main img, #main picture, #container .uparrow, #container .email-modal, #container .arrow";
elements += ", #footer img, #main .learn .img, #footer .contact, #main .refinementcontainer, #header #topBrandsCatFlyout, .pt_error .nohitssearch .search";
elements += ", .errorpagemessage .search, .generalerror .errorpage .search, .greenarrow, .step, .bluearrow2, .dontmiss, .ordersicon1, .bluearrow1, .rewardslogo";
elements += ", .loyalty-qmark, .silvercheck, .goldcheck, .platinumcheck, .diamondcheck, icon-img-holder, .image-holder, .accountlogo, .usercircle, .tiercircle, .lastordercircle";
elements += ", .addressicon, .paymenticon, .nottiervalue, .ordersicon, .lazy-background";
var nodeList = [];
var sublist = null;
var nodeIndex = 0;
var isFinish = false;
var isLast = null;
var imagePreloaded = [];
var imageLoaded = [];
var listrakFailure = false;
var isScriptsAdded = false;
var resolved = true;
window.connectionSpeed = 0;
window.addEventListener("DOMContentLoaded", function(evt){
	boxElement = document.querySelectorAll(elements);
	createObserver();
});
function createObserver() {
	var options = {
			root: null,
			rootMargin: '0px',
			threshold: buildThresholdList()
	};
	observer = new IntersectionObserver(handleIntersect, options);
	observer.POLL_INTERVAL = 100;
	for (var i = 0; i < boxElement.length; i++) { 
	    var element = boxElement[i];
	    observer.observe(element);
	  }
}
function buildThresholdList() {
	var thresholds = [];
	for (var i = 1.0; i <= numSteps; i++) {
		var ratio = i/numSteps;
		thresholds.push(ratio);
	}
	thresholds.push(0);
	return thresholds;
}

function handleIntersect(entries) {
	for (var i = 0; i < entries.length; i++) { 
	    var entry = entries[i];
	    // Are we in viewport?
	    if (entry.isIntersecting) {
	    	if(entry.target.tagName.toLowerCase() === 'img' || entry.target.tagName.toLowerCase() === 'picture') {
		       if (entry.target.dataset && entry.target.dataset.src || entry.target.getAttribute('data-src')) {
		    	   // Stop watching and load the image
                  preloadImage(entry.target);
                  observer.unobserve(entry.target);
		       } else if(entry.target.tagName.toLowerCase() === 'picture') {
                   var children = entry.target.querySelectorAll('source');
		    	   preloadPicture(children);
		    	   observer.unobserve(entry.target);
		       } else {
		    	   observer.unobserve(entry.target); 
		       }
	    	} else if (entry.target.tagName.toLowerCase() !== 'img') {
                entry.target.className += ((entry.target.className.length > 0) ? ' js-lazy-handled' : 'js-lazy-handled');
                observer.unobserve(entry.target);
	    	}
	    } else if (!isScriptsAdded) {
            buildScripts();
        }
	}
}
function buildScripts() {
    isScriptsAdded = true;
    var scripts = [];
    var scriptList = [];
    nodeList = document.querySelectorAll("script");
    var index =  0;
    for (; index < nodeList.length; index++) {
        var item = nodeList[index];
        if ((item.dataset && !item.dataset.src) || !item.getAttribute('data-src')) {
            continue;
        }
        scripts.push(item);
    }
    var start = -10;
    index = 0;
    var length = Math.floor(scripts.length / 10);
    for (; index < length; index++, start+=10) {
        scriptList.push(scripts.slice(start + 10, start + 20));
    }
    scriptList.push(scripts.slice(start + 10));
    preloadScripts(scriptList);
}
function preloadScripts(list) {
    var newlist = list.shift();
    if (newlist && newlist.length) {
        var script = newlist.shift();
        if (script) {
            if (resolved) {
                resolved = false;
                fetchScript((script.dataset && script.dataset.src) ? script.dataset.src : script.getAttribute('data-src'), script);
            }
            var timer = setInterval(function(){
                if (listrakFailure) {
                    var listObj = fetchList(newlist, list);
                    if (listObj) {
                        list = listObj["list"];
                        newlist = listObj["sublist"];
                    }
                }
                if (resolved && ((list && list.length) || (newlist && newlist.length))) {
                    script = null;
                    if (newlist && newlist.length) {
                        script = newlist.shift();
                    } else if (list && list.length) {
                        newlist = list.shift();
                        if (newlist && newlist.length) {
                            script = newlist.shift();
                        }
                    }
                   
                    if (script) {
                        resolved = false;
                        fetchScript((script.dataset && script.dataset.src) ? script.dataset.src : script.getAttribute('data-src'), script);
                    }  
                } else if (resolved) {
                    clearInterval(timer);
                }
            }, 100);
        }
    }
}
function fetchNonListrak(newlist, list) {
    do {
        var script = newlist[0];
        var src = (script.dataset && script.dataset.src) ? script.dataset.src : script.getAttribute('data-src');
        if (src.search(/ltk/) > -1) {
            var removed = newlist.shift();
            console && console.warn('Removed:', (removed.dataset && removed.dataset.src ? removed.dataset.src : removed.getAttribute('data-src')));
        }
    } while (newlist.length > 0 && src.search(/ltk/) > -1);
    if ((newlist.length  && src.search(/ltk/) < 0) || src.search(/ltk/) < 0) {
        return {"list": list, "sublist": newlist};
    } else if (list.length) {
        newlist = list.shift();
        if (newlist.length) {
            return fetchNonListrak(newlist, list);
        }
    }

    return null;
}
function fetchList(newlist, list) {
    if (newlist.length) {
        return fetchNonListrak(newlist, list);
     } else if (list.length) {
         newlist = list.shift();
         if (newlist.length) {
             return fetchNonListrak(newlist, list);
         }
     }

     return null;
}
function fetchScript(url, current) {
    getScript(url, current).then(function(response){
        resolved = true;
        console && console.warn('Response:', response, 'URL: ', url);
    }, function(error){
        console && console.error(error, 'URL: ', url);
        if (url.search(/cdn\.listrakbi\.com/) > -1) {
            listrakFailure = true;
        }
        resolved = true;
    });
    
}

function getScript(url, current){
    return new Promise(function(resolve, reject){
        current.onload = function() {
            resolve("Load - Successful");
        };
        current.onreadystatechange = function() {
            resolve("Ready State Changed - Successful");
        }
        current.onerror = function() {
            reject(Error("Error - Network Error"));
        };
       current.src = url;
    });
}

function preloadImage(image) {
  var src = (image.dataset) ? image.dataset.src : (image.getAttribute('data-src') ? image.getAttribute('data-src') : null);
  if (!src) {
    return;
  }
  
  src = src.indexOf("http://") > -1 ? "https://" + src.substring(src.indexOf("http://") + "http://".length) : src; 
  return fetchImage(src).then(function(response) {
      console && console.warn('Response:', response); 
      applyImage(image, src); 
    }, function(error){
        console && console.error(error);
    });
}

function preloadPicture(sources) {
	for (var i = 0; i < sources.length; i++) {
		var srcset = (sources[i].dataset) ? sources[i].dataset.srcset : (sources[i].getAttribute('data-srcset') ? sources[i].getAttribute("data-srcset") : null);
		if (!srcset) {
			continue;
        }
        applySource(sources[i], srcset);
	}
}
function fetchImage(url) {
	  return new Promise(function(resolve, reject) {
	    var image = new Image();
	    image.onload = function() {resolve(url);}
        image.onerror = function() {reject("Image Load Failed: " + url);}
        image.src = url;
	  });
}

function fetchPicture(url) {
    return new Promise(function(resolve, reject) {
      var image = new Image();
      image.src = url;
      image.onload = resolve;
      image.onerror = reject;
    });
}
function applyImage(img, src) {
	  // Prevent this from being lazy loaded a second time.
	  img.className += ((img.className.length > 0 && img.className.search(/js-lazy-handled/) < 0) ? ' js-lazy-handled' : (img.className.search(/js-lazy-handled/) < 0 ? 'js-lazy-handled' : ''));
	  img.src = src;
	  var block = findParentBlock(img);
	  block.className += ((img.className.length > 0  && img.className.search(/fade-in/) < 0) ? ' fade-in' : (img.className.search(/fade-in/) < 0 ? 'fade-in' : ''));
}

function applySource(source, srcset) {
    var picture = source.parentElement;
    source.srcset = srcset;
    if (picture.className.search(/js-lazy-handled/) < 0) {
        picture.className += ((picture.className.length > 0 && picture.className.search(/js-lazy-handled/) < 0) ? ' js-lazy-handled' : (picture.className.search(/js-lazy-handled/) < 0 ? 'js-lazy-handled' : ''));
    }
    parent = findParentBlock(picture);
	if (picture.className.indexOf('fade-in') < 0) {
		picture.className += ((picture.className.length > 0 && picture.className.search(/fade-in/) < 0) ? ' fade-in' : (picture.className.search(/fade-in/) < 0 ? 'fade-in' : ''));
	}
}
function findParentBlock(img) {
	var element = img.parentElement;
	var display = (getComputedStyle(element, null)) ? getComputedStyle(element, null).getPropertyValue("display") : element.currentStyle.display;
	
	while (display === 'inline') {
		element = element.parentElement;
		display = (getComputedStyle(element, null)) ? getComputedStyle(element, null).getPropertyValue("display") : element.currentStyle.display;
	}
	return element;
}