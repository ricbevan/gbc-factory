var purchaseOrderSummary = []; // holds all radiator ids in a purchase order

getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPurchaseOrders();
});

function getPurchaseOrders() {
	
	let query = ' { boards(ids:3852829643) { id name groups { id title items { id } } } } ';
	
	mondayAPI(query, function(data) {
		
		let purchaseOrders = data['data']['boards'][0]['groups'];
		
		if (purchaseOrders.length == 0) {
			displayError('No purchase orders (getPurchaseOrders)');
			return false;
		}
		
		var html = '';
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			html += "<option value=\"" + purchaseOrder.id + "\">" + purchaseOrder.title + "</option>";
			
			// store all radiator IDs in a purchase order for use later
			var radiatorDateIds = [];
			
			for (var j = 0; j < purchaseOrder.items.length; j++) {
				radiatorDateIds.push(purchaseOrder.items[j].id);
			}
			
			purchaseOrderSummary.push({id : purchaseOrder.id, name: purchaseOrder.title, radiatorIds: radiatorDateIds});
		}
		
		gbc('#goods-in-date').html(html).on('change', function(e) {
			getPurchaseOrder();
		});
		
		getPurchaseOrder();
	});
}

function getPurchaseOrder() {
	
	let purchaseOrderDate = gbc('#goods-in-date').val();
	
	// get all radiator IDs from the selected purchase order and retrieve
	let radiatorIds = findInArray(purchaseOrderSummary, 'id', purchaseOrderDate).radiatorIds.join(',');
	
	let query = ' { boards(ids:3852829643) { items(ids: [' + radiatorIds + ']) { id name column_values { title text id } } } } ';
	
	mondayAPI(query, function(data) {
		
		var palletSummary = [];
		
		let purchaseOrders = data['data']['boards'][0]['items'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let palletNumber = findInArray(purchaseOrder.column_values, 'title', 'Pallet').text;
			
			let palletSummaryPallet = findInArray(palletSummary, 'palletNumber', palletNumber);
			let palletAlreadyInPalletSummary = (palletSummaryPallet == undefined);
			
			if (palletAlreadyInPalletSummary) {
				palletSummary.push({ 'palletNumber': palletNumber, 'radiators': [purchaseOrder] })
			} else {
				palletSummaryPallet.radiators.push(purchaseOrder)
			}
		}
		
		// sort array by pallet number
		palletSummary.sort((a, b) => (a.palletNumber > b.palletNumber) ? 1 : -1);
		
		var html = '';
		
		for (var i = 0; i < palletSummary.length; i++) {
			let pallet = palletSummary[i];
			
			html += '<div>';
			html += '<h3>';
			html += '<label>';
			html += '<input class="uk-checkbox" type="checkbox" id="pallet' + pallet.palletNumber + '"> ';
			html += pallet.palletNumber;
			html += '</label>';
			html += '</h3>';
			html += '<ul class="uk-list uk-list-striped">';
			
			let palletRadiators = pallet.radiators;
			
			// sort radiators on pallet by colour, then number
			palletRadiators.sort((a, b) => (
				(findInArray(a.column_values, 'title', 'Colour').text + a.name) > 
				(findInArray(b.column_values, 'title', 'Colour').text + b.name)) ? 1 : -1);
			
			for (var j = 0; j < palletRadiators.length; j++) {
				let palletRadiator = palletRadiators[j];
				
				let radiatorColour = findInArray(palletRadiator.column_values, 'title', 'Colour').text;
				let radiatorReceived = ((findInArray(palletRadiator.column_values, 'title', 'Received').text == 'v') ? ' checked' : '');
				
				html += '<li>';
				html += '<label>';
				html += '<input class="uk-checkbox" type="checkbox" id="' + palletRadiator.id + '"' + radiatorReceived + '> ';
				html += '[' + radiatorColour + '] ' + palletRadiator.name;
				html += '</label>'
				html += '</li>';
			}
				
			html += '</ul>';
			html += '</div>';
		}
		
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-in-save">Save</button></div>';
		
		gbc('#page').html(html).show();
		
		gbc('#goods-in-save').on('click', function(e) {
			saveRadiators();
		});
		
		gbc('#page h3 input').on('change', function(e) {
			selectAllOnPallet(this);
		});
	});
}

function selectAllOnPallet(pallet) {
	let palletCheckboxes = pallet.parentElement.parentElement.parentElement.querySelectorAll('ul input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#' + pallet.id)[0].checked;
	
	for (var i = 0; i < palletCheckboxes.length; i++) {
		palletCheckboxes[i].checked = selectAllCheckbox;
	}
}

function saveRadiators() {
	let checkboxes = document.querySelectorAll('#page ul input[type=checkbox]');
	
	var query = 'mutation {';
	
	for (var i = 0; i < checkboxes.length; i++) {
		let radiator = checkboxes[i];
		let radiatorId = radiator.id;
		let radiatorChecked = JSON.stringify('{"boolean" : ' + (radiator.checked ? '{"checked" : "true"}' : 'null') + '}');
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: 3852829643, column_values: ' + radiatorChecked + ') { id }'
	}
	
	query += ' }';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
}