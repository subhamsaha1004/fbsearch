(function(window, undefined){
	// General utilities
	var doc = window.document,
			$ = function(selector){
				var result = doc.querySelectorAll(selector);
				return (result.length > 1) ? result : result[0];
			};

	// Custom event handling module
	var CustomEventHandler = (function () {
	  var _handlers = {}, addEvent, removeEvent, triggerEvent;

	  // Enhancing node prototype with on method
	  Node.prototype.on =  function(type, func, async, index, delegate) {
	  	// calls native addeventlistener first
	  	this.addEventListener(type, function(e) {
	  		func.call(this, e, index);
	  		if(delegate) {
	  			if(delegate.stopPropagation){
		  			e.stopPropagation();
		  		} else if (delegate.preventDefault) {
		  			e.preventDefault();
		  		}
	  		}
	  	}, async);

	  	// code for custom event handling, maintaining a list of listeners
	  	var el = (index) ? (this.toString() + index) : this;
	  	_handlers[el] = _handlers[el] || {};
      _handlers[el][type] = _handlers[el][type] || [];
      _handlers[el][type].push(func);
	  };
	  // Similar approach for off method for removing listeners
		Node.prototype.off =  function(type, func, async, index) {
	  	this.removeEventListener(type, function(e) {
	  		func.call(this, e, index);
	  	}, async);

	  	var el = (index) ? (this.toString() + index) : this;
	  	[].forEach.call(_handlers[el][type], function (fun, index) {
        if (fun === func) {
          _handlers[el] = _handlers[el] || {};
          _handlers[el][type] = _handlers[el][type] || [];
          _handlers[el][type][index] = undefined;
        }
      });
	  };

	  // On and Off added for Nodelists
		NodeList.prototype.on = function(type, func, async, delegate) {
			[].forEach.call(this, function(node, index) {
				node.on(type, func, async, index, delegate);
			});
		};
		NodeList.prototype.off = function(type, func, async) {
			[].forEach.call(this, function(node, index) {
				node.off(type, func, async, index);
			});
		};
	  
	  // addEvent
	  addEvent = function (el, evt, fn, delegate) {
      el.on(evt, fn, false, delegate);
    };

	  // removeEvent
	  removeEvent = function (el, evt, fn) {
      el.off(evt, fn, false);
    };

	  // triggerEvent
	  triggerEvent = function (el, evt) {
	  	var args = [].slice.call(arguments, 2);

	    _handlers[el] = _handlers[el] || {};
	    _handlers[el][evt] = _handlers[el][evt] || [];

	    for (var _i = 0, _l = _handlers[el][evt].length; _i < _l; _i += 1) {
	      _handlers[el][evt][_i].apply(el, args);
	    }
	  };
	  
	  // returnning an object that provides the api for interaction with the custom handler
	  return {
	    add: addEvent,
	    remove: removeEvent,
	    trigger: triggerEvent,
	    _handlers: _handlers
	  };
	}());

	/** App related code starts here **/

	// Initializing the dropdown
	var Dropdown = (function() {
		var label = $('.label'),
		    dropDown = $('.dropDown');

		var init = function() {
			// Handling the events and creating the dropdown
			CustomEventHandler.add(label, 'click', function(e) {
				var list = this.getAttribute('data-dropdown');
				$('#' + list).classList.toggle('dispInlineBlock');
			});

			CustomEventHandler.add(dropDown, 'click', function(e, index) {
				var targetLi = e.target;

				$('.label[data-dropdown="' + this.id + '"] .text').innerHTML = targetLi.textContent;
				this.classList.remove('dispInlineBlock');
				[].forEach.call(this.querySelectorAll('.activeLi'), function(li) {
					li.classList.remove('activeLi');
				});
				targetLi.classList.add('activeLi');

				var el = (index) ? (this.toString() + index) : this;
				CustomEventHandler.trigger(el, 'listChange', targetLi); // triggering listchange event for suscribers to achieve some task
			});
		};

		// rerturning object to provide an api for interacting with the module
		return {
			init: init,
			label: label,
			dropDown: dropDown
		}
	}());

	Dropdown.init(); // Initializing the dropdowns

	// code for Facebook Search
	var resultWrapper = $('.results');

	// FB searcg module, contains all the code for calling the api and populating the dom
	FBSearch = (function() {
		var url = "https://graph.facebook.com/";
				xhr = (function() {
					if (window.XMLHttpRequest) { // latest browsers
					  return new XMLHttpRequest();
					} else if (window.ActiveXObject) { // IE 8 and older
					  return new ActiveXObject("Microsoft.XMLHTTP");
					}
				}()),
				input = $('#search'),
				btn = $('#searchBtn'),
				message = $('.message'),
				index = 1;
				template = null;

		// wires up the event listeners, fetches the template for future use
		var init = function() {
			// Attaching the event handlers
			CustomEventHandler.add($('#searchForm'), 'submit', function(e) {
			}, { stopPropagation: true, preventDefault: true });

			// button click fires the ajax search
			CustomEventHandler.add(btn, 'click', function(e) {
				if(!this.classList.contains('disabled')) {
					this.classList.add('disabled');
					this.value = "Searching...";
					search(this);
				}
			}, { stopPropagation: true, preventDefault: true });

			// fetching the template
			var templateScript = $("#template");
			template = templateScript.innerHTML;
			templateScript.parentNode.removeChild(templateScript);
		};

		// builds the actual html from the template, very simple use case, useful for this purpose
		var buildHTML = function(tpl, data) {
			tpl = tpl
				.replace(/\{\{index\}\}/, index)
				.replace(/\{\{linkTitle\}\}/g, data.link || "No Information")
				.replace(/\{\{about\}\}/, data.about || "No Information")
				.replace(/\{\{category\}\}/, data.category || "No Information")
				.replace(/\{\{imgSrc\}\}/, (data.cover) ? data.cover.source : "No Information")
				.replace(/\{\{description\}\}/, data.description || "No Information")
				.replace(/\{\{founded\}\}/, data.founded || "No Information")
				.replace(/\{\{website\}\}/g, data.website || "No Information")
				.replace(/\{\{likes\}\}/, data.likes || "No Information");

			index++;

			return tpl;
		}

		// actual search functionality goes here
		var search = function(btn) {
			var term = input.value; // term to be searched for

			geturl = url + term; // get url like https://graph.facebook.com/pepsi
			xhr.open('GET', geturl, true);

			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					if(xhr.status == 200) {
						var data = JSON.parse(xhr.responseText);
						var html = template;
						html = buildHTML(html, data); // get the compiled html from the template

						reArrange("-1"); // make it descending order
						resultWrapper.innerHTML = (index == 2) ? html : (html + resultWrapper.innerHTML); // append to the dom

						// show a message
						message.classList.add('dispBlock');
						var timer = setTimeout(function() {
							message.classList.remove('dispBlock');
							clearTimeout(timer);
						}, 1500);

						// trigger listchange for the filters to initiate functionality
						[].forEach.call(Dropdown.dropDown, function(eachDropDown, index) {
							var el = (index) ? (eachDropDown.toString() + index) : eachDropDown;
							var targetLi = eachDropDown.querySelector('.activeLi');
							CustomEventHandler.trigger(el, 'listChange', targetLi);
						});
					}

					btn.classList.remove('disabled');
					btn.value = "Search";
				}
			};

			xhr.onerror = function() {
				// Error handling code here
			};

			xhr.send(null);
		};

		return {
			url: url,
			init: init,
			template: template
		}
	}());

	FBSearch.init(); // Initializing the Facebbook seracg module, getting it ready to search

	// Filtering functionality
	var resultCache = [];

	function populateCache() {
		resultCache = [];
		var results = $('.result');
		if(results) {
			[].forEach.call(results, function(result) {
				resultCache.push(result);
			});
		}
	}

	// Sorting ascending or descending
	function reArrange(sortorder) {
		var currSortOrder = resultWrapper.getAttribute('data-sortorder');

		if(currSortOrder !== sortorder) {
			populateCache();
			if(resultCache.length) {
				resultCache.reverse();
				resultWrapper.innerHTML = "";
				var frag = doc.createDocumentFragment();
				resultCache.forEach(function(result) {
					frag.appendChild(result);
				});
				resultWrapper.appendChild(frag);
				resultWrapper.setAttribute('data-sortorder', sortorder);
			}
		}
	}

	// Show/hide the results according to the favorite filter
	function filterFavourite(result, favorite) {
		result.classList.remove('dispNone');
		var selectedSpan = result.querySelector('.favorite[data-favourite="' + (favorite*-1) + '"]');
		if(selectedSpan) {
			selectedSpan.parentNode.parentNode.classList.add('dispNone');
		}
	}

	// Event handler for the results
	CustomEventHandler.add(resultWrapper, 'click', function(e) {
		var target = e.target;

		if(target.classList.contains('favorite')){
			target.classList.toggle('selected');
			target.setAttribute('data-favourite', target.getAttribute('data-favourite') * -1);
		} else if(target.classList.contains('rightArrow')) {
			target.classList.toggle('downArrow');
			var result = target.parentNode.parentNode;
			var details = result.querySelector('.details');
			details.classList.toggle('dispBlock');
		}
	});

	// Event handler for the filters, handles all filtering activity
	CustomEventHandler.add(Dropdown.dropDown, 'listChange', function(target) {
		var favorite = target.getAttribute('data-favourite');
		var sortorder = target.getAttribute('data-sortorder');

		// triggers the favorite filter
		if(favorite) {
			var results = $('.result');
			if(results) {
				if([].slice.call(results).length > 1) {
					[].forEach.call(results, function(result) {
						filterFavourite(result, favorite);
					});
				} else {
					filterFavourite(results, favorite);
				}
			}
		}

		// triggers the sort
		if(sortorder) {
			reArrange(sortorder);
		}
		
	});

}(this));