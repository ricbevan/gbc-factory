	var gbc = (function () {
	
		'use strict';
		
		var Constructor = function (selector) {
			if (!selector) return;
			this.elems = document.querySelectorAll(selector);
		};
		
		Constructor.prototype.each = function (callback) {
			if (!callback || typeof callback !== 'function') return;
			for (var i = 0; i < this.elems.length; i++) {
				callback(this.elems[i], i);
			}
			return this;
		};
		
		Constructor.prototype.addClass = function (className) {
			this.each(function (item) {
				item.classList.add(className);
			});
			return this;
		};
		
		Constructor.prototype.attr = function (attr, val) {
			if (val === undefined) {
				return this.elems[0].getAttribute(attr);
			}
			this.each(function (item) {
				item.setAttribute(attr, val);
			});
			return this;
		};
		
		Constructor.prototype.count = function () {
			return this.elems.length;
		};
		
		Constructor.prototype.css = function (type, style) {
			this.each(function (item) {
				item.style[type] = style;
			});
			return this;
		};
		
		Constructor.prototype.disable = function () {
			this.each(function (item) {
				item.setAttribute('disabled', true);
			});
			return this;
		};
		
		Constructor.prototype.enable = function () {
			this.each(function (item) {
				item.removeAttribute('disabled');
			});
			return this;
		};
		
		Constructor.prototype.hide = function () {
			this.each(function (item) {
				item.setAttribute('hidden', 'hidden');
				item.style.visibility = 'hidden';
			});
			return this;
		};
		
		Constructor.prototype.html = function (html) {
			if (html === undefined) {
				return this.elems[0].innerHTML;
			}
			this.each(function (item) {
				item.innerHTML = html;
			});
			return this;
		};
		
		Constructor.prototype.on = function (type, callback) {
			if (!callback || !type || typeof callback !== 'function') return;
			this.each(function (item) {
				item['on' + type] = callback;
			});
			return this;
		}
		
		Constructor.prototype.removeAttr = function (attr) {
			this.each(function (item) {
				item.removeAttribute(attr);
			});
			return this;
		};
		
		Constructor.prototype.removeClass = function (className) {
			this.each(function (item) {
				item.classList.remove(className);
			});
			return this;
		};
		
		Constructor.prototype.show = function () {
			this.each(function (item) {
				item.removeAttribute('hidden');
				item.style.visibility = 'visible';
			});
			return this;
		};
		
		Constructor.prototype.text = function (text) {
			if (text === undefined) {
				return this.elems[0].innerText;
			}
			
			this.each(function (item) {
				item.innerText = text;
			});
			return this;
		};
		
		Constructor.prototype.trigger = function (type) {
			this.each(function (item) {
				item.dispatchEvent(new Event(type));
			});
			return this;
		};
		
		Constructor.prototype.url = function (url) {
			this.each(function (item) {
				item.href = url;
			});
			return this;
		};
		
		Constructor.prototype.val = function (val) {
			if (val === undefined) {
				return this.elems[0].value;
			}
			
			this.each(function (item) {
				item.value = val;
			});
			return this;
		};
		
		var instantiate = function (selector) {
			return new Constructor(selector);
		};
	
	return instantiate;
	
})();
