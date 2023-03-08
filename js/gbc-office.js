var debuggingOn = false;
var userId;
var userName;
var apiKey;
var loadingCount = 0;

// Radiator pallet table
let boardId_RadiatorPallet = '3894008168';
let columnId_RadiatorPallet_Status = 'color';
let columnId_RadiatorPallet_Radiators = 'board_relation';
let columnId_RadiatorPallet_DispatchedDate = 'date';
let columnId_RadiatorPallet_DeliveredBy = 'multiple_person';

// Radiator table
let boardId_Radiator = '3852829643';
let columnId_Radiator_Status = 'color0';
let columnId_Radiator_Colour = 'color';
let columnId_Radiator_PalletOutgoing = 'board_relation7';
let columnId_Radiator_PalletIncoming = 'numeric3';
let columnId_Radiator_ReceivedDate = 'date';
let columnId_Radiator_DispatchDate = 'lookup8';

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

function alphanumeric(str) {
	return str.replace(/\W/g, '');
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

function fixDate(date) {
	var dateTime = '';
	var splitDateTime = date.split(' ');
	
	if (splitDateTime.length > 1) { // store the current AM or PM
		dateTime = ' ' + splitDateTime[1];
	}
	
	var splitDate = splitDateTime[0].split('-');
	
	if (splitDate.length == 3) {
		return splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0] + dateTime;
	} else {
		return date;
	}
}

function fixName(name) {
	var splitName = name.split(' ');
	
	if (splitName.length > 1) {
		return splitName[0];
	} else {
		return name;
	}
}

function fixNameWithBracket(name) {
	var splitName = name.split(' (');
	
	if (splitName.length > 1) {
		return splitName[0];
	} else {
		return name;
	}
}

function getColumnRow(arr, column) {
	let temp = findInArray(arr['column_values'], 'id', column);
	return temp;
}

function getColumnText(arr, column) {
	return getColumnRow(arr, column)['text'];
}

function getColumnValue(arr, column) {
	return getColumnRow(arr, column)['value'];
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