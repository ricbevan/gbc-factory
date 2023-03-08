getStarted();
var forkLiftCheckId = '';

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
	
	gbc('#fork-lift-check-date').html(html).on('change', function(e) {
		getForkLiftChecks();
	});
	
	gbc('#fork-lift-check-date').val(endDate.toISOString().slice(0, 10));
	
	getForkLiftChecks();
}

function getForkLiftChecks() {
	gbc('#checks-loaded').hide();
	
	let checkDate = gbc('#fork-lift-check-date').val();
	
	let query = '{ items_by_column_values(board_id: 4105630839, column_id: "date", column_value: "' + checkDate + '") { id, name, column_values { id title value text type } } } ';
	
	mondayAPI(query, function(data) {
		gbc('#fork-lift-defect').val('');
		gbc('#fork-lift-check-tickbox-container').html('');
		
		let checks = data['data']['items_by_column_values'];
		
		if (checks.length == 0) {
			UIkit.notification('No checks available for this day, please speak to the office', 'danger');
			return false;
		}
		
		var htmlDropDown = '<option disabled hidden selected>fork lift</option>';
		var htmlCheckBoxes = '<div class="uk-width-1-1"><label class="uk-text-bold"><input class="uk-checkbox" type="checkbox" id="select-all-fork-lift-checks"> Select all/none</label></div>';
		
		for (var i = 0; i < checks.length; i++) {
			let check = checks[i];
			
			var forkLiftId = "";
			
			for (var j = 0; j < check.column_values.length; j++) {
				let checkColumn = check.column_values[j];
				
				if (checkColumn.id == "connect_boards") {
					if (validJson(checkColumn.value)) {
						forkLiftId = JSON.parse(checkColumn.value)['linkedPulseIds'][0]["linkedPulseId"];
					}
				}
				
				if (forkLiftId == getLocalStorage('last-selected-fork-lift')) {
					vehicleCheckId = check.id;
					
					if (checkColumn.id == "text") {
						if (checkColumn.value != null) {
							gbc('#fork-lift-defect').val(checkColumn.text);
						}
					}
					
					if (checkColumn.type == "boolean") {
						var checked = ((checkColumn.text == "v") ? ' checked' : '');
						
						htmlCheckBoxes += '<div>';
						htmlCheckBoxes += '<label><input class="uk-checkbox" type="checkbox" id="' + checkColumn.id + '"' + checked + '> ' + checkColumn.title + '</label>';
						htmlCheckBoxes += '</div>';
					}
				}
			}
			
			htmlDropDown += "<option value=\"" + forkLiftId + "\" data-id=\"" + check.id + "\">" + fixNameWithBracket(check.name) + "</option>";
		}
		
		gbc('#fork-lift-check-fork-lift').html(htmlDropDown);
		gbc('#fork-lift-check-tickbox-container').html(htmlCheckBoxes);
		
		if (getLocalStorage('last-selected-fork-lift') != null) {
			gbc('#fork-lift-check-fork-lift').val(getLocalStorage('last-selected-fork-lift'));
		}
		
		gbc('#fork-lift-check-fork-lift').on('change', function(e) {
			selectForkLift();
		});
		
		gbc('#select-all-fork-lift-checks').on('change', function(e) {
			selectAll();
		});
		
		gbc('#save-fork-lift-checks').on('click', function(e) {
			saveForkLiftChecks();
		});
		
		gbc('#checks-loaded').show();
	});
}

function selectAll() {
	let checkboxes = document.querySelectorAll('input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#select-all-fork-lift-checks')[0].checked;
	
	for (var i = 0; i < checkboxes.length; i++) {
		// don't select check boxes for trailer checks
		if ((checkboxes[i].id != 'check63') && (checkboxes[i].id != 'check61') && (checkboxes[i].id != 'check21')) {
			checkboxes[i].checked = selectAllCheckbox;
		}
	}
}

function selectForkLift() {
	localStorage.setItem("last-selected-fork-lift", document.querySelectorAll('#fork-lift-check-fork-lift')[0].value);
	getForkLiftChecks();
}

function saveForkLiftChecks() {
	let checkboxes = document.querySelectorAll('input[type=checkbox]:not(#select-all-fork-lift-checks)');
	let defect = document.querySelectorAll('#fork-lift-defect')[0].value;
	
	var updateJson = '"people": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	updateJson += '"text": \"' + defect + '\", ';
	
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			updateJson += '"' + checkboxes[i].id +'": {"checked" : "true"}, ';
		} else {
			updateJson += '"' + checkboxes[i].id +'": null, ';
		}
	}
	
	updateJson = JSON.stringify('{' + updateJson.slice(0, -2) + '}');
	var query = 'mutation { change_multiple_column_values(item_id: ' + vehicleCheckId + ', board_id:4105630839, column_values: ' + updateJson + ') { id, name } }';
	
	mondayAPI(query, function(data) {
		getForkLiftChecks();
	});
}