var jobId = '';

getStarted();

document.addEventListener("DOMContentLoaded", function() {	
	gbc('#job-search').on('click', function(e) {
		let jobNumber = gbc('#job-number').val();
		loadJob(jobNumber);
	});
	
	gbc('#job-number').on('keyup', function(e) {
		if (e.keyCode === 13) {
			let jobNumber = gbc('#job-number').val();
			loadJob(jobNumber);
		}
	});
	
	gbc('#job-powder-save').on('click', function(e) {
		savePowder();
	});
});

function loadJob(jobNumber) {
	if (jobNumber == '') {
		UIkit.notification('Please enter a job number', 'danger');
		return false;
	}
	
	let query = '{ items_by_column_values ' +
		'(board_id: 608197264, column_id: "name", column_value: "' + jobNumber + '") ' +
		'{ id, name, column_values { id, text, value }, updates(limit: 10) { body } } }';
	
	jobId = '';
	
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
		
		jobId = job.id;
		
		gbc('#job-roles').attr('hidden', true);
		gbc('#colour-and-manufacturer').val('');
		
		let jobColumns = job['column_values'];
		
		var itemUpdates = job['updates'];
		var itemUpdateString = '';
		
		for (i = 0; i < itemUpdates.length; i++) {
		  itemUpdateString += itemUpdates[i]['body'];
		}
		
		gbc('#previous-colour-and-manufacturers').html(itemUpdateString);
		
		gbc('#job-updates').html(itemUpdateString);
		
		// loop through each column in Monday, and for each, see if it's a column we need
		for (var i = 0; i < jobColumns.length; i++) {
			for (var j = 0; j < jobCompletionColumns.length; j++) {
				let jobColumn = jobColumns[i];
				let jobCompletionColumn = jobCompletionColumns[j];
				
				if (jobColumn.id == jobCompletionColumn.monday) {
					
					var people = '-';
					var icon = 'icon: plus-circle; ratio: 2';
					var colour = 'default';
					var amIAssigned = false;
					var assigned = [];
					
					if (jobColumn.value != null) {
						if (validJson(jobColumn.value)) {
							assigned = JSON.parse(jobColumn.value)['personsAndTeams'];
							
							if (assigned.length > 0) {
								amIAssigned = !(assigned.find(x => x.id == userId) === undefined);
								
								if (amIAssigned) {
									icon = 'icon: minus-circle; ratio: 2';
									colour = 'primary';
								}
							}
						}
					}
					
					if (amIAssigned) { // if I'm assigned, remove me from the list, otherwise add me to the list
						var removeIndex = assigned.map(function(item) { return item.id; }).indexOf(userId);
						assigned.splice(removeIndex, 1);
					} else {
						assigned.push({id: userId, kind: 'person'});
					}
					
					if (jobColumn.text != '') {
						people = jobColumn.text;
					}
					
					gbc('#' + jobCompletionColumn.office + ' p').text(people);
					gbc('#' + jobCompletionColumn.office).removeClass('uk-card-primary').removeClass('uk-card-default').addClass('uk-card-' + colour).addClass('gbc-box-link');
					gbc('#' + jobCompletionColumn.office + ' span').attr('uk-icon', icon);
					
					gbc('#' + jobCompletionColumn.office).attr('data-assigned', JSON.stringify(assigned)).attr('data-job-id', jobId).attr('data-column-id', jobColumn.id);
					
					gbc('#' + jobCompletionColumn.office).on('click', function(e) {
						updateJob(this);
					});
				}
			}
		}
		
		gbc('#job-roles').removeAttr('hidden');
	});
}

function updateJob(roleButton) {
	
	let assigned = roleButton.getAttribute('data-assigned');
	let jobId = roleButton.getAttribute('data-job-id');
	let columnId = roleButton.getAttribute('data-column-id');
	
	var assignedJson = JSON.stringify('{"clear_all": true}');
	
	if (assigned != '[]') { // if there are people, set the correct json
		assignedJson = JSON.stringify('{"personsAndTeams":' + assigned + '}');
	}
	
	let query = 'mutation { change_column_value ' +
		'(board_id: 608197264, item_id: ' + jobId + ', column_id: "' + columnId + '", value: ' + assignedJson + ') ' +
		'{ id, name } }';

	mondayAPI(query, function(data) {
		let job = data['data']['change_column_value'];
		let jobNumber = job.name;
		loadJob(jobNumber);
	});
}

function savePowder() {
	let powder = gbc('#colour-and-manufacturer').val();
	
	if (powder == '') {
		UIkit.notification('Please enter the colour and manufacturer', 'warning');
	} else {
		let query = 'mutation { create_update (item_id: ' + jobId +
			', body: "<p>' + userName + ': ' + powder + '</p>") { id } }';
		
		mondayAPI(query, function(data) {
			
			let query2 = ' { boards(ids:608197264) { items(ids:' + jobId + ') { name } } }';
			
			mondayAPI(query2, function(data2) {
				let jobNumber = data2['data']['boards'][0]['items'][0]['name'];
				loadJob(jobNumber);
			});
			
			UIkit.notification('Colour and manufacturer saved', 'success');
		});
	}
}

const jobCompletionColumns = [
	{ monday: 'people00', office: 'goods-in' },
	{ monday: 'people0', office: 'blaster' },
	{ monday: 'people8', office: 'colour' },
	{ monday: 'people', office: 'coater' },
	{ monday: 'people4', office: 'goods-out' },
	{ monday: 'people3', office: 'aluminium' }
];