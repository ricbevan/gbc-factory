var vehicleCheckId = '';

getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getDates();
});

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	const startDate = new Date("01/01/2023");
	const endDate = new Date(); // today
	
	let loopDate = new Date(endDate);
	
	while (loopDate >= startDate) {
	  html += "<option value=\"" + loopDate.toISOString().slice(0, 10) + "\">" + loopDate.toLocaleDateString("en-GB") + "</option>";
	  
	  loopDate.setDate(loopDate.getDate() - 1);
	}
	
	gbc('#vehicle-check-date').html(html).on('change', function(e) {
		getVehicleChecks();
	});
	
	gbc('#vehicle-check-date').val(endDate.toISOString().slice(0, 10));
	
	getVehicleChecks();
}

function getVehicleChecks() {
	gbc('#checks-loaded').hide();
	
	let checkDate = gbc('#vehicle-check-date').val();
	
	let query = '{ items_by_column_values(board_id: 1409326975, column_id: "date", column_value: "' + checkDate + '") { id, name, column_values { id title value text type } } } ';
	
	mondayAPI(query, function(data) {
		gbc('#vehicle-mileage').val('');
		gbc('#vehicle-defect').val('');
		gbc('#vehicle-check-tickbox-container').html('');
		
		let checks = data['data']['items_by_column_values'];
		
		if (checks.length == 0) {
			UIkit.notification('No checks available for this day, please speak to the office', 'danger');
			return false;
		}
		
		var htmlDropDown = '<option disabled hidden selected>vehicle</option>';
		var htmlCheckBoxes = '<div class="uk-width-1-1"><label class="uk-text-bold"><input class="uk-checkbox" type="checkbox" id="select-all-vehicle-checks"> Select all/none</label></div>';
		
		for (var i = 0; i < checks.length; i++) {
			let check = checks[i];
			
			var vehicleId = "";
			
			for (var j = 0; j < check.column_values.length; j++) {
				let checkColumn = check.column_values[j];
				
				if (checkColumn.id == "connect_boards") {
					if (validJson(checkColumn.value)) {
						vehicleId = JSON.parse(checkColumn.value)['linkedPulseIds'][0]["linkedPulseId"];
					}
				}
				
				if (vehicleId == getLocalStorage('last-selected-vehicle')) {
					vehicleCheckId = check.id;
					
					if (checkColumn.id == "numbers") {
						if (checkColumn.value != null) {
							gbc('#vehicle-mileage').val(String(checkColumn.value).split('"').join(''));
						}
					}
					
					if (checkColumn.id == "text") {
						if (checkColumn.value != null) {
							gbc('#vehicle-defect').val(checkColumn.text);
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
			
			htmlDropDown += "<option value=\"" + vehicleId + "\" data-id=\"" + check.id + "\">" + fixNameWithBracket(check.name) + "</option>";
		}
		
		htmlCheckBoxes += '<div class="uk-width-1-1"><p>* refer to vehicle and trailer combinations</div>';
		
		gbc('#vehicle-check-vehicle').html(htmlDropDown);
		gbc('#vehicle-check-tickbox-container').html(htmlCheckBoxes);
		
		if (getLocalStorage('last-selected-vehicle') != null) {
			gbc('#vehicle-check-vehicle').val(getLocalStorage('last-selected-vehicle'));
		}
		
		gbc('#vehicle-check-vehicle').on('change', function(e) {
			selectVehicle();
		});
		
		gbc('#select-all-vehicle-checks').on('change', function(e) {
			selectAll();
		});
		
		gbc('#save-vehicle-checks').on('click', function(e) {
			saveVehicleChecks();
		});
		
		gbc('#checks-loaded').show();
	});
}

function selectAll() {
	let checkboxes = document.querySelectorAll('input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#select-all-vehicle-checks')[0].checked;
	
	for (var i = 0; i < checkboxes.length; i++) {
		// don't select check boxes for trailer checks
		if ((checkboxes[i].id != 'check63') && (checkboxes[i].id != 'check61') && (checkboxes[i].id != 'check21')) {
			checkboxes[i].checked = selectAllCheckbox;
		}
	}
}

function selectVehicle() {
	localStorage.setItem("last-selected-vehicle", document.querySelectorAll('#vehicle-check-vehicle')[0].value);
	getVehicleChecks();
}

function saveVehicleChecks() {
	let mileage = document.querySelectorAll('#vehicle-mileage')[0].value;
	
	if (mileage == "") {
		UIkit.notification('Mileage required', 'danger');
		return false;
	}
	
	let checkboxes = document.querySelectorAll('input[type=checkbox]:not(#select-all-vehicle-checks)');
	let defect = document.querySelectorAll('#vehicle-defect')[0].value;
	
	var updateJson = '"numbers":' + mileage + ', ';
	updateJson += '"people2": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	updateJson += '"text": \"' + defect + '\", ';
	
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			updateJson += '"' + checkboxes[i].id +'": {"checked" : "true"}, ';
		} else {
			updateJson += '"' + checkboxes[i].id +'": null, ';
		}
	}
	
	updateJson = JSON.stringify('{' + updateJson.slice(0, -2) + '}');
	var query = 'mutation { change_multiple_column_values(item_id: ' + vehicleCheckId + ', board_id:1409326975, column_values: ' + updateJson + ') { id, name } }';
	
	mondayAPI(query, function(data) {
		console.log(data);
		getVehicleChecks();
	});
}