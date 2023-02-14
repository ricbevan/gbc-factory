getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPurchaseOrders();
});

function getPurchaseOrders() {
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { groups { id title } } } ';
	
	mondayAPI(query, function(data) {
		
		let purchaseOrders = data['data']['boards'][0]['groups'];
		
		if (purchaseOrders.length == 0) {
			displayError('No purchase orders (getPurchaseOrders)');
			return false;
		}
		
		var html = '';
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			html += "<option value=\"" + purchaseOrder.id + "\">" + fixDate(purchaseOrder.title) + "</option>";
		}
		
		gbc('#goods-in-date').html(html).on('change', function(e) {
			getPurchaseOrder();
		});
		
		getPurchaseOrder();
	});
}

function getPurchaseOrder() {
	
	let purchaseOrderId = gbc('#goods-in-date').val();
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { groups(ids: "' + purchaseOrderId + '") { id items { id } } } } ';
	
	mondayAPI(query, function(data) {
		
		var purchaseOrderRadiatorIds = [];
		
		let radiatorIds = data['data']['boards'][0]['groups'][0]['items'];
		
		for (var i = 0; i < radiatorIds.length; i++) {
			let radiatorId = radiatorIds[i];
			
			purchaseOrderRadiatorIds.push(radiatorId.id);
		}
		
		purchaseOrderRadiatorIds = purchaseOrderRadiatorIds.join(',');
		
		getRadiators(purchaseOrderRadiatorIds);
	});
	
}

function getRadiators(purchaseOrderRadiatorIds) {
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { items(ids: [' + purchaseOrderRadiatorIds + ']) { id name column_values(ids:["' + columnId_Radiator_Colour + '","' + columnId_Radiator_Pallet_Incoming + '","'+ columnId_Radiator_Status + '"]) { text id } } } } ';
	
	mondayAPI(query, function(data) {
		
		var palletSummary = [];
		
		let purchaseOrders = data['data']['boards'][0]['items'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let palletNumber = getColumnText(purchaseOrder, columnId_Radiator_Pallet_Incoming);
			
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
			
			let palletNumber = pallet.palletNumber;
			
			html += '<div>';
			html += '<h3>';
			html += '<label>';
			html += '<input class="uk-checkbox" type="checkbox" id="pallet' + palletNumber + '"> ';
			html += palletNumber;
			html += '</label>';
			html += '</h3>';
			html += '<ul class="uk-list uk-list-striped">';
			
			let radiators = pallet.radiators;
			
			// sort radiators on pallet by colour, then number
			radiators.sort((a, b) => (
				(getColumnText(a, columnId_Radiator_Colour) + a.name) >
				(getColumnText(b, columnId_Radiator_Colour) + b.name)) ? 1 : -1);
			
			for (var j = 0; j < radiators.length; j++) {
				let radiator = radiators[j];
				
				let radiatorId = radiator.id;
				let radiatorName = radiator.name;
				let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
				let radiatorReceived = ((getColumnText(radiator, columnId_Radiator_Status) == 'Received') ? ' checked' : '');
				
				html += '<li>';
				html += '<label uk-tooltip="title: ' + radiatorId + '; delay: 1000; pos: right">';
				html += '<input class="uk-checkbox" type="checkbox" id="' + radiatorId + '" data-changed="false"' + radiatorReceived + '> ';
				html += '[' + radiatorColour + '] ' + radiatorName;
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
		
		gbc('#page ul input[type="checkbox"]').on('click', function(e) {
			e.target.dataset.changed = "true";
		});
	});
}

function selectAllOnPallet(pallet) {
	let palletCheckboxes = pallet.parentElement.parentElement.parentElement.querySelectorAll('ul input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#' + pallet.id)[0].checked;
	
	for (var i = 0; i < palletCheckboxes.length; i++) {
		let palletCheckbox = palletCheckboxes[i];
		
		palletCheckbox.checked = selectAllCheckbox;
		palletCheckbox.dataset.changed = "true";
	}
}

function saveRadiators() {
	
	var query = 'mutation {';
	
	gbc('#page ul input[type=checkbox][data-changed="true"]').each(function(radiator) {
		let radiatorId = radiator.id;
		let radiatorChecked = JSON.stringify('{"color0" : {"label":"' + (radiator.checked ? 'Received' : '') + '"} }');
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: 3852829643, column_values: ' + radiatorChecked + ') { id }';
	});
	
	query += ' }';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
	
}