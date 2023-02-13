function logOn() {
	if (userId == null) {
		throw 'Not logged in'
	}
	var query = '{ users (ids: [' + userId + ']) { name } }';
	
	mondayAPI(query, function(data) {
		var loggedInUser = data['data']['users'];
		
		if (loggedInUser.length != 1) {
			throw 'No user with userID [' + userId + '] (logOn)';
		} else {
			userName = loggedInUser[0]['name'];
			document.querySelectorAll('#username')[0].setAttribute('uk-tooltip', 'title: Logged in as ' + userName + '; pos: bottom');
		}
	});
}

function mondayAPI(query, func) {
	showLoading();
	
	if (query == undefined) {
		throw 'No query provided (mondayAPI)';
	}
	
	if (func == undefined) {
		throw 'No function provided (mondayAPI)';
	}
	
	if (apiKey == undefined) {
		throw 'No api key provided (mondayAPI)';
	}
	
	fetch ("https://api.monday.com/v2", {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			'Authorization' : apiKey
		},
		body: JSON.stringify({
			'query' : query
		})
	})
	.then((resp) => resp.json())
	.then(function(data) {
		if (debuggingOn) {
			console.log(data);
		}
		
		if (data['errors'] !== undefined) {
			console.log(data['errors']);
			throw data['errors'] + ' (mondayAPI)';
			return false;
		}
		
		hideLoading();
		
		func(data)
	})
	.catch(function(error) {
		console.log(error);
		hideLoading();
		displayError(error + ' (mondayAPI)');
	});
}