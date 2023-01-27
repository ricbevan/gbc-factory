var debuggingOn = false;
var userId;
var apiKey;
var loadingCount = 0;

function getLocalStorage(key) {
	if (key == undefined) {
		throw 'No key provided (getLocalStorage)';
	}
	
	return localStorage.getItem(key);
}

function setLocalStorage(key, val) {
	if (key == undefined) {
		throw 'No key provided (setLocalStorage)';
	}
	
	if (val == undefined) {
		throw 'No val provided (setLocalStorage)';
	}
	
	localStorage.setItem(key, val);
}

function loadLocalVariables() {
	userId = getLocalStorage('User ID');
	apiKey = getLocalStorage('API Key');
}

function displayError(errorMessage) {
	gbc('#loading').hide();
	gbc('#error').show();
	gbc('#error p').html('<b>Please speak to the office</b><br />' + errorMessage);
	gbc('#page').hide();
}

function findInArray(arr, prop, val) {
	if (val == undefined) {
		return arr[prop];
	} else {
		return arr.find(x => x[prop] === val);
	}
}

function hideLoading() {
	loadingCount -= 1;
	
	if (loadingCount == 0) {
		gbc('#loading').hide();
	}
}

function showLoading() {
	loadingCount += 1;
	
	gbc('#loading').show();
}

function validJson(str) {
	if ((str == null) || (str == '{}') || (str == undefined)) {
		return false
	}
	
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	
	return true;
}

function getStarted() {
	try {
		loadLocalVariables();
		
		// if user requests page not index and isn't logged in, redirect them to the index page
		if ((userId == '') || (userId == null) || (userId == undefined)) {
			let page = window.location.pathname.split('/').pop().replace('.html', '');
			
			if (page != 'index') {
				window.location.replace('index.html');
			}
		}
		
		logOn();
	} catch (e) {
		displayError(e);
	}
}