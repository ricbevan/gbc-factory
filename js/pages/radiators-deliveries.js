getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getDates();
	getPallets();
	getDrivers();
});

function getDrivers() {
	let query = '{ boards(ids: 4013024988) { items { column_values(ids:["person"]) { id value text }} }}';
	
	mondayAPI(query, function(data) {
		let drivers = data['data']['boards'][0]['items'];
		var html = '';
		var selectedValue = '';
		
		for (var i = 0; i < drivers.length; i++) {
			
			let driver = drivers[i];
			
			let driverName = getColumnText(driver, 'person');
			let driverData = getColumnValue(driver, 'person');
			
			let driverId = JSON.parse(driverData)['personsAndTeams'][0]['id'];
			
			html += "<option value=\"" + driverId + "\">" + driverName + "</option>";
			
			if (driverId == userId) {
				selectedValue = driverId;
			}
		}
		
		gbc('#radiator-delivery-driver').html(html);
		
		if (selectedValue != '') {
			gbc('#radiator-delivery-driver').val(selectedValue);
		}
	});
}

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	const startDate = new Date("01/01/2023");
	const endDate = new Date(); // today
	
	let loopDate = new Date(endDate);
	
	while (loopDate >= startDate) {
		html += "<option value=\"" + loopDate.toISOString().slice(0, 10) + "\">" + fixDate(loopDate.toISOString().split('T')[0]) + "</option>";
		
		loopDate.setDate(loopDate.getDate() - 1);
	}
	
	gbc('#radiator-delivery-date').html(html).val(endDate.toISOString().slice(0, 10));
}

function getPallets() {
	
	let query = ' { items_by_column_values (board_id: ' + boardId_RadiatorPallet + ', column_id: "' + columnId_RadiatorPallet_Status + '", column_value: "At GBC") { id name } } ';
	
	mondayAPI(query, function(data) {
		
		let pallets = data['data']['items_by_column_values'];
		
		var html = '';
		html += '<ul class="uk-list uk-list-striped">';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let palletId = pallet.id;
			let palletName = pallet.name;
			
			html += '<li>';
			html += '<label>';
			html += '<input class="uk-checkbox" type="checkbox" id="' + palletId + '"> ';
			html += 'Pallet ' + palletName;
			html += '</label>'
			html += '</li>';
		}
		
		html += '</ul>';
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="radiators-delivery-save">Save</button></div>';
		
		gbc('#page').html(html);
		
		gbc('#radiators-delivery-save').on('click', function(e) {
			saveDelivery();
		});
		
	});
}

function saveDelivery() {
	let deliveryDate = gbc('#radiator-delivery-date').val();
	let deliveryDriver = gbc('#radiator-delivery-driver').val();
	let pallets = document.querySelectorAll('#page ul input[type=checkbox]:checked');
	
	if (pallets.length == 0) {
		UIkit.notification('No pallets selected', 'danger');
		return false;
	}
	
	var confirmMessage = 'Mark ' + pallets.length + ' pallet' + (pallets.length != 1 ? 's' : '') + ' as delivered on ' + fixDate(deliveryDate) + '? This will save immediately, but can take a minute to display.';
	
	if (confirm(confirmMessage) == true) {
		var query = 'mutation {';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			let palletId = pallet.id;
			
			var updates = JSON.stringify('{"' + columnId_RadiatorPallet_Status + '" : "Dispatched", "' + columnId_RadiatorPallet_DispatchedDate + '": {"date" : "' + deliveryDate + '"}, "' + columnId_RadiatorPallet_DeliveredBy + '": { "personsAndTeams" : [ { "id": ' + deliveryDriver + ', "kind" : "person" } ] } }');
			
			query += ' update' + palletId + ': change_multiple_column_values(item_id: ' + palletId + ', board_id: ' + boardId_RadiatorPallet + ', column_values: ' + updates + ') { id }';
		}
		
		query += ' }';
		
		mondayAPI(query, function(data) {
			UIkit.notification('Delivery saved', 'success');
			getPallets();
		});
	}
}