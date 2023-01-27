var boxId;

getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getSites();
	
	gbc('#box-search').on('click', function(e) {
		loadBox(document.querySelectorAll('#box-number')[0].value);
	});
	
	gbc('#box-number').on('keyup',  function(e) {
		if (e.keyCode === 13) {
			loadBox(document.querySelectorAll('#box-number')[0].value);
		}
	});
	
	gbc('#coat-job').on('click', function(e) {
		coatJob();
	});
});

function loadBox(boxNumber) {
	let query = '{ items_by_column_values(' +
		'board_id: 297756491, column_id:"name", column_value:"' + boxNumber + '"' +
		') { id, column_values { id title value text } } }';
	
	gbc('#edit-box').attr('href', 'box-management.html#' + boxNumber);
	
	mondayAPI(query, function(data) {
		
		gbc('#box-jobs').attr('data-assigned-jobs', '');
		
		let box = data['data']['items_by_column_values'][0];
		
		if (box.length == 0) {
			UIkit.notification('No box with this number, please speak to the office', 'danger');
			return false;
		}
		
		if (box.length > 1) {
			UIkit.notification('Multiple boxes with this number, please speak to the office', 'danger');
			return false;
		}
		
		boxId = box.id; // save for use in other functions
		
		gbc('#box-data').show();
		gbc('#add-box').show()
		gbc('#edit-box').show();
		
		let boxColumns = box['column_values'];
		
		for (var i = 0; i < boxColumns.length; i++) {
			let boxColumn = boxColumns[i];
			
			if (boxColumn.id == 'connect_boards05') { // get jobs
				if (validJson(boxColumn.value)) {
					let jobs = JSON.parse(boxColumn.value)['linkedPulseIds'];
					var jobIds = '';
					
					for (let i = 0; i < jobs.length; i++) {
						jobIds += jobs[i].linkedPulseId + ',';
					}
					
					gbc('#box-jobs').attr('data-assigned-jobs', jobIds);
				}
			}
			
			if (boxColumn.id == 'connect_boards8') { // hide relevant 'move box to' button(s)
				if (validJson(boxColumn.value)) {
					let site = JSON.parse(boxColumn.value)['linkedPulseIds'][0]['linkedPulseId'];
					
					let siteButtons = document.querySelectorAll('#move-box button');
					
					for (let i = 0; i < siteButtons.length; i++) {
						siteButtons[i].removeAttribute('hidden');
						
						if (siteButtons[i].getAttribute('data-site-id') == site) {
							siteButtons[i].setAttribute('hidden', true);
						}
					}
				}
			}
			
			if (boxColumn.id == 'numbers8') { // get remaining powder and style boxes
				let remaining = parseInt(boxColumn.text);
				
				for (let i = 0; i <= 25; i++) {
					var style = 'default';
					if (remaining == i) { style = 'primary'; }
					else if (remaining > i) { style = 'secondary'; }
					
					gbc('#box-' + i).removeClass('uk-button-default').removeClass('uk-button-primary').removeClass('uk-button-secondary')
						.addClass('uk-button-' + style).on('click', function(e) {
							updateBoxWeight(this);
						});
				}
			}
			
			for (var j = 0; j < powderManagementColumns.length; j++) {
				let powderManagementColumn = powderManagementColumns[j];
				
				if (boxColumn.id == powderManagementColumn.monday) { // get static box data e.g. supplier, finish, etc.
					gbc('#' + powderManagementColumn.office).text(boxColumn.text);
				}
			}
		}
		
		gbc('#box-data').removeAttr('hidden');
	});
}

function getSites() {
	let query = '{ boards(ids:2592644328) { items { id name } } }';
	
	mondayAPI(query, function(data) {
		var html = '';
		
		let sites = data['data']['boards'][0]['items'];
		
		for (var i = 0; i < sites.length; i++) {
			let site = sites[i];
			
			html += '<button class="uk-button uk-button-primary uk-button-small uk-margin-small-right" data-site-id="' + site.id + '">Move box to ' + site.name + '</button>';
		}
		
		gbc('#move-box').html(html);
		
		gbc('#move-box button').on('click', function(e) {
			moveBox(this);
		});
	});
}

function moveBox(locationButton) {
	let siteId = locationButton.getAttribute('data-site-id');
	let siteIdJson = JSON.stringify('{"connect_boards8" : {"item_ids" : [' + siteId + ']}}');
	
	let query = 'mutation { change_multiple_column_values(item_id: ' + boxId + ', board_id:297756491, column_values: ' + siteIdJson + ') { id, name } }';

	mondayAPI(query, function(data) {
		let box = data['data']['change_multiple_column_values'];
		let boxNumber = box.name;
		loadBox(boxNumber);
	});
}

function updateBoxWeight(weightButton) {
	let weight = weightButton.id.slice(4);
	let updateJson = JSON.stringify('{"numbers8" : "' + weight + '"}');
	
	let query = 'mutation { change_multiple_column_values(item_id: ' + boxId + ', board_id:297756491, column_values: ' + updateJson + ') { id, name } }';
	
	mondayAPI(query, function(data) {
		let box = data['data']['change_multiple_column_values'];
		let boxNumber = box.name;
		loadBox(boxNumber);
	});
}

function coatJob() {
	let jobNumber = document.querySelectorAll('#job-number')[0].value;
	
	let query = '{ items_by_column_values ' +
	'(board_id: 608197264, column_id: "name", column_value: "' + jobNumber + '") ' +
	'{ id } }';
	
	mondayAPI(query, function(data) {
		var job = data['data']['items_by_column_values'];
		
		if (job.length == 0) {
			UIkit.notification('No job with this number, please speak to the office', 'danger');
			return false;
		}
		
		job = data['data']['items_by_column_values'][0];
		
		if (job.length > 1) {
			UIkit.notification('Multiple jobs with this number, please speak to the office', 'danger');
			return false;
		}
		
		// get jobs already assigned
		let jobsAlreadyAssigned = gbc('#box-jobs').attr('data-assigned-jobs');
		
		// add jobs already assigned to new job
		let newJobs = jobsAlreadyAssigned + job.id;
		
		let updateJson = JSON.stringify('{"connect_boards05" : {"item_ids" : [' + newJobs + ']}}');
		let query = 'mutation { change_multiple_column_values(item_id: ' + boxId + ', board_id:297756491, column_values: ' + updateJson + ') { id, name } }';
		
		mondayAPI(query, function(data) {
			let box = data['data']['change_multiple_column_values'];
			let boxNumber = box.name;
			loadBox(boxNumber);
		});
	});
}

const powderManagementColumns = [
	{ monday: 'connect_boards', office: 'powder-supplier' },
	{ monday: 'text', office: 'powder-batch' },
	{ monday: 'connect_boards8', office: 'powder-location' },
	{ monday: 'connect_boards05', office: 'box-jobs' }
];