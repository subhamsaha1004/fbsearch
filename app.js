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

	  Node.prototype.on =  function(type, func, async, index) {
	  	this.addEventListener(type, function(e) {
	  		func.call(this, e, index);
	  	}, async);
	  	var el = (index) ? (this.toString() + index) : this;
	  	_handlers[el] = _handlers[el] || {};
      _handlers[el][type] = _handlers[el][type] || [];
      _handlers[el][type].push(func);
	  };
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

		NodeList.prototype.on = function(type, func, async) {
			[].forEach.call(this, function(node, index) {
				node.on(type, func, async, index);
			});
		};
		NodeList.prototype.off = function(type, func, async) {
			[].forEach.call(this, function(node, index) {
				node.off(type, func, async, index);
			});
		};
	  
	  // addEvent
	  addEvent = function (el, evt, fn) {
      el.on(evt, fn, false);
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
	  
	  return {
	    add: addEvent,
	    remove: removeEvent,
	    trigger: triggerEvent,
	    _handlers: _handlers
	  };
	}());

	// App related code starts here

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

				var el = (index) ? (this.toString() + index) : this;
				CustomEventHandler.trigger(el, 'listChange', targetLi);
			});
		};

		return {
			init: init,
			label: label,
			dropDown: dropDown
		}
	}());

	Dropdown.init();

	// Facebook Search
	FBSearch = (function() {
		var url = "https://graph.facebook.com/";
				xhr = new XMLHttpRequest(),
				input = $('#search'),
				btn = $('#searchBtn');

		var init = function() {
			$('#searchForm').addEventListener('submit', function(e) {
				return false;
			}, false);

			btn.addEventListener('click', function(e) {
				search();
				return false;
			}, false);
		}

		var search = function() {
			var term = input.value;

			geturl = url + term;
			xhr.open('get', geturl, false);
			xhr.onreadystatechange = function(response) {
				console.log(response);
				if(response.status == 200 && response.readyState == 4) {
					var data = JSON.parse(response);
					console.log(data);
				}
			};

			xhr.onerror = function(response) {
				var error = JSON.parse(response);
				console.log(error);
			};

			xhr.send();
		};

		return {
			url: url,
			init: init
		}
	}());

	FBSearch.init();

	// Filtering functionality
	var results = $('.result'),
			resultWrapper = $('.results'),
			resultCache = [];

	[].forEach.call(results, function(result) {
		resultCache.push(result);
	});

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

	CustomEventHandler.add(Dropdown.dropDown, 'listChange', function(target) {
		var favorite = target.getAttribute('data-favourite');
		var sortorder = target.getAttribute('data-sortorder');

		if(favorite) {
			[].forEach.call(results, function(result) {
				result.classList.remove('dispNone');
				var selectedSpan = result.querySelector('.favorite[data-favourite="' + (favorite*-1) + '"]');
				if(selectedSpan) {
					selectedSpan.parentNode.parentNode.classList.add('dispNone');
				}
			});
		}

		if(sortorder) {
			console.log(sortorder);
			resultCache.reverse();
			resultWrapper.innerHTML = "";
			var frag = doc.createDocumentFragment();
			resultCache.forEach(function(result) {
				frag.appendChild(result);
			});
			resultWrapper.appendChild(frag);
		}
		
	});

}(this));