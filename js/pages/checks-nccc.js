getStarted();
var ncccCheckId = '';

document.addEventListener("DOMContentLoaded", function() {
	getDates();
});

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	const startDate = new Date("2023-03-08");
	const endDate = new Date(); // today
	
	let loopDate = new Date(endDate);
	
	while (loopDate >= startDate) {
	  html += "<option value=\"" + loopDate.toISOString().slice(0, 10) + "\">" + loopDate.toLocaleDateString("en-GB") + "</option>";
	  
	  loopDate.setDate(loopDate.getDate() - 1);
	}
	
	gbc('#nccc-check-date').html(html).on('change', function(e) {
		getNcccChecks();
	});
	
	gbc('#nccc-check-date').val(endDate.toISOString().slice(0, 10));
	
	getNcccChecks();
}

function getNcccChecks() {
	gbc('#checks-loaded').hide();
	
	let checkDate = gbc('#nccc-check-date').val();
	
	let query = '{ items_by_column_values(board_id: 4073327836, column_id: "date", column_value: "' + checkDate + '") { id, name, column_values { id title value text type } } } ';
	
	mondayAPI(query, function(data) {
		
		let checks = data['data']['items_by_column_values'];
		
		if (checks.length == 0) {
			displayError('No NCCC checks available for ' + checkDate + ' (getNcccChecks)')
			return false;
		} else {
			checks = checks[0];
		}
		
		let checkId = checks.id;
		ncccCheckId = checkId;
		
		for (var i = 0; i < columns.length; i++) {
			let column = columns[i];
			
			let value = getColumnText(checks, column.monday);
			gbc('#' + column.office).val(value);
		}
		
		gbc('#checks-loaded').show();
		
		gbc('#save-nccc-checks').on('click', function(e) {
			saveNcccChecks();
		});
		
	});
}

function saveNcccChecks() {
	var updateJson = '"people": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	
	for (var i = 0; i < columns.length; i++) {
		let column = columns[i];
		
		let value = gbc('#' + column.office).val();
		
		if (column.required && value == '') {
			UIkit.notification(column.text + ' required', 'danger');
			return false;
		}
		
		
		updateJson += '"' + column.monday + '": "' + value + '", '
	}
	
	updateJson = JSON.stringify('{' + updateJson.slice(0, -2) + '}');
	
	var query = 'mutation { change_multiple_column_values(item_id: ' + ncccCheckId + ', board_id:4073327836, column_values: ' + updateJson + ') { id, name } }';
	
	mondayAPI(query, function(data) {
		getNcccChecks();
	});
}

const columns = [
	{ monday: 'numbers', office: 'tank-1-temperature', text: 'Tank 1 temperature', required: true },
	{ monday: 'numbers9', office: 'tank-1-solution', text: 'Tank 1 solution', required: true },
	{ monday: 'numbers1', office: 'tank-2-contamination', text: 'Tank 2 contamination', required: true },
	{ monday: 'numbers8', office: 'tank-3-contamination', text: 'Tank 3 contamination', required: true },
	{ monday: 'numbers2', office: 'tank-4-temperature', text: 'Tank 4 temperature', required: true },
	{ monday: 'numbers5', office: 'tank-4-solution', text: 'Tank 4 solution', required: true },
	{ monday: 'numbers21', office: 'metaclean-added', text: 'Metaclean added', required: false },
	{ monday: 'numbers89', office: 'phosguard-added', text: 'Phosguard added', required: false }
];