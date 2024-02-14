getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getDates();
	getPallets();
});

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	let query = ' {  boards(ids:4206918313) { items_page(limit: 500, query_params: { order_by: { column_id:"date6", direction:desc } }) { items { id name column_values(ids:["date6"]) { id text } } } } } ';
	
	mondayAPI2(query, function(data) {
		let deliveries = data['data']['boards'][0]['items_page']['items'];
		var html = '';
		
		deliveries.sort((a, b) => (
		(getColumnText(a, 'date6') + a.name) <
		(getColumnText(b, 'date6') + b.name)) ? 1 : -1);
		
		for (var i = 0; i < deliveries.length; i++) {
			
			let delivery = deliveries[i];
			
			let deliveryId = delivery.id;
			let deliveryAmPm = delivery.name;
			let deliveryDate = getColumnText(delivery, 'date6');
			
			html += "<option value=\"" + deliveryId + "\">" + deliveryDate + " " + deliveryAmPm + "</option>";
		}
		
		gbc('#radiator-delivery-date').html(html).on('change', function(e) {
			getDelivery();
		});
		
		getDelivery();
	});
}

function getDelivery() {
  
	let delivery = gbc('#radiator-delivery-date').val();
	gbc('#page2').hide();
	
	let query = ' { boards(ids:4206918313) { items_page(limit: 500, query_params: { ids: [' + delivery + '] }) { items { id name column_values(ids:["date6","hour","signature","board_relation","people"]) { id text value ... on BoardRelationValue { display_value } } } } } } ';
	
	mondayAPI2(query, function(data) {
	
		var delivery = data['data']['boards'][0]['items_page']['items'][0];
		
		let deliveryId = delivery.id;
		let deliveryAmPm = delivery.name;
		let deliveryDate = getColumnText(delivery, 'date6');
		let deliveryTime = getColumnText(delivery, 'hour');
		let deliverySignature = decodeURIComponent(getColumnText(delivery, 'signature'));
		var deliveryPallets2 = '';
		var deliveryPallets = '';
		
		if (getColumnText2(delivery, 'board_relation') != null) {
			deliveryPallets2 = getColumnText2(delivery, 'board_relation').split(', ');
		}
		
		if (getColumnValue(delivery, 'board_relation') != null) {
			deliveryPallets = JSON.parse(getColumnValue(delivery, 'board_relation'));
		}
		
		if (deliveryPallets != null) {
			deliveryPallets = deliveryPallets['linkedPulseIds'];
			
			if (deliveryPallets != undefined) {
				if (deliveryPallets.length > 0) {
					var html = '<ul class="uk-list uk-list-striped">';
					
					for (var i = 0; i < deliveryPallets.length; i++) {
						let deliveryPallet = deliveryPallets[i];
						
						let deliveryPalletId = deliveryPallet['linkedPulseId'];
						let deliveryPalletName = deliveryPallets2[i];
						
						html += '<li>';
						html += 'Pallet <a href="radiators-all-pallets.html#' + deliveryPalletId + '">' + deliveryPalletName + '</a>';
						html += '</li>';
					}
					
					html += '</ul>';
					
					gbc('#page2').html(html).show();
				}
			}
		}
		
		gbc('#page input').disable();
		
		if (deliverySignature == '') { // disable check boxes if delivery is signed for
			gbc('#page input').enable();
		}
	
	});
}

function getPallets() {
	
	let query = ' { items_page_by_column_values (limit: 500, board_id: ' + boardId_RadiatorPallet + ', columns: [{column_id: "' + columnId_RadiatorPallet_Status + '", column_values: ["At GBC"]}]) { items { id name column_values(ids:["' + columnId_RadiatorPallet_Radiators + '"]) { id ... on BoardRelationValue { display_value } } } } } ';
	
	mondayAPI2(query, function(data) {
		
		let pallets = data['data']['items_page_by_column_values']['items'];
		
		var html = '';
		html += '<ul class="uk-list uk-list-striped">';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let palletId = pallet.id;
			let palletName = pallet.name;
			let palletRadiators = getColumnText2(pallet, columnId_RadiatorPallet_Radiators);
			let palletRadiatorCount = (((palletRadiators == '') || (palletRadiators == null)) ? 0 : palletRadiators.split(',').length);
			let palletRadiatorCountText = palletRadiatorCount + ' rad' + ((palletRadiatorCount == 1) ? '' : 's');
			
			html += '<li>';
			html += '<label>';
			html += '<input class="uk-checkbox" type="checkbox" id="' + palletId + '"> ';
			html += 'Pallet <a href="radiators-goods-out.html#' + palletId + '">' + palletName + '</a> [' + palletRadiatorCountText + ']';
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
	let pallets = document.querySelectorAll('#page ul input[type=checkbox]:checked');
	
	if (pallets.length == 0) {
		UIkit.notification('No pallets selected', 'danger');
		return false;
	}
	
	var confirmMessage = 'Mark ' + pallets.length + ' pallet' + (pallets.length != 1 ? 's' : '') + ' on delivery? This will save immediately, but can take a minute to display.';
	
	if (confirm(confirmMessage) == true) {
		var query = 'mutation {';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			let palletId = pallet.id;
		
			var updates = JSON.stringify('{"' + columnId_RadiatorPallet_Status + '" : "Dispatched", "connect_boards" : {"item_ids": [' + deliveryDate + ']} }');
			
			query += ' update' + palletId + ': change_multiple_column_values(item_id: ' + palletId + ', board_id:  ' + boardId_RadiatorPallet + ', column_values: ' + updates + ') { id }';
			
			markPalletRadiatorsDispatched(palletId);
		}
		
		query += ' }';
		
		mondayAPI2(query, function(data) {
			UIkit.notification('Delivery saved', 'success');
			getPallets();
		});
	}
}

function markPalletRadiatorsDispatched(palletId) {
	
	let query = ' { boards(ids:' + boardId_RadiatorPallet + ') { items_page(limit: 500, query_params: { ids: [' + palletId + '] }) { items { column_values(ids:["' + columnId_RadiatorPallet_Radiators + '"]) { id value } } } } } ';
	
	mondayAPI2(query, function(data) {
		let pallet = data['data']['boards'][0]['items_page']['items'][0];
		
		let palletRadiatorIds = getColumnValue(pallet, columnId_RadiatorPallet_Radiators);
		
		var radiatorIds = JSON.parse(palletRadiatorIds);
		
		if (radiatorIds != null) {
			if ('linkedPulseIds' in radiatorIds) {
			
				radiatorIds = radiatorIds['linkedPulseIds'];
				
				radiatorIdArr = [];
				
				for (var i = 0; i < radiatorIds.length; i++) {
					var radiatorId = radiatorIds[i];
					radiatorId = radiatorId['linkedPulseId'];
					
					let updates = JSON.stringify('{"' + columnId_Radiator_Status + '" : "Dispatched" }');
					let query = ' update' + radiatorId + 'Rads: change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + boardId_Radiator + ', column_values: ' + updates + ') { id } ';
					
					radiatorIdArr.push(query);
				}
				
				palletRadiatorUpdate = radiatorIdArr;
				
				var query2 = 'mutation {';
				query2 += palletRadiatorUpdate.join(' ');
				query2 += ' } ';
				
				mondayAPI2(query2, function(data) {
					
				});
			}
		}
	});
}