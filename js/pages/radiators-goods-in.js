getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPurchaseOrders();
	
	gbc('#save-radiator-note').on('click', function() {
		saveNote();
	});
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
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { items(ids: [' + purchaseOrderRadiatorIds + ']) { id name column_values(ids:["' + columnId_Radiator_Colour + '","' + columnId_Radiator_PalletIncoming + '","'+ columnId_Radiator_Status + '"]) { text id } } } } ';
	
	mondayAPI(query, function(data) {
		
		var palletSummary = [];
		
		let purchaseOrders = data['data']['boards'][0]['items'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let palletNumber = getColumnText(purchaseOrder, columnId_Radiator_PalletIncoming);
			
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
				
				html += '<li class="uk-flex uk-flex-middle">';
				html += '<label class="uk-flex-1">';
				html += '<input class="uk-checkbox" type="checkbox" id="' + radiatorId + '" data-changed="false"' + radiatorReceived + '> ';
				html += '[' + radiatorColour + '] ' + radiatorName;
				html += '</label>';
				html += '<span uk-icon="info" class="uk-flex-none gbc-radiator-info" data-radiatorId="' + radiatorId + '"></span>';
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
		
		gbc('#page ul > li > .gbc-radiator-info').on('click', function(radiator) {
			getRadiatorDetails(radiator);
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

function getRadiatorDetails(radiator) {
	let radiatorId = radiator.target.closest('.gbc-radiator-info').getAttribute('data-radiatorid');
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { items(ids: ' + radiatorId + ') { name, updates(limit: 10) { body }, column_values(ids:["' + columnId_Radiator_Colour + '"]) { text id } } } } ';
	
	mondayAPI(query, function(data) {
		let radiator = data['data']['boards'][0]['items'][0];
		
		let radiatorName = radiator['name'];
		let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
		let radiatorUpdates = radiator['updates'];
		
		let modalTitle = '[' + radiatorColour + '] ' + radiatorName;
		let modalId = radiatorName;
		
		var html = '';
		
		if (radiatorUpdates.length > 0) {
			for (var i = 0; i < radiatorUpdates.length; i++) {
				let radiatorUpdate = radiatorUpdates[i];
				
				let updateText = radiatorUpdate.body;
				
				html += '<li>' + updateText + '</li>';
			}
		} else {
			html = '<li>No notes</li>';
		}
		
		gbc('#radiator-modal-title').text(modalTitle);
		gbc('#radiator-modal-id').text(radiatorId);
		gbc('#radiator-modal-notes').html(html);
		
		UIkit.modal('#radiator-modal').show();
	});
}

function saveRadiators() {
	
	var query = 'mutation {';
	
	gbc('#page ul input[type=checkbox][data-changed="true"]').each(function(radiator) {
		let radiatorId = radiator.id;
		let radiatorChecked = radiator.checked;
		
		let radiatorColumnJson = JSON.stringify('{"' + columnId_Radiator_Status + '" : {"label":"' + (radiatorChecked ? 'Received' : '') + '"} }');
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + boardId_Radiator + ', column_values: ' + radiatorColumnJson + ') { id }';
	});
	
	query += ' }';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
	
}

function saveNote() {
	let id = gbc('#radiator-modal-id').text();
	let note = gbc('#radiator-note').val();
	
	if (note == '') {
		UIkit.notification('Please enter a note', 'warning');
	} else {
		let query = 'mutation { create_update (item_id: ' + id +
			', body: "<p>' + note + '</p>") { id } }';
		
		mondayAPI(query, function(data) {
			gbc('#radiator-note').val(''); // clear note field
			UIkit.modal('#radiator-modal').hide();
			UIkit.notification('Note saved', 'success');
		});
	}
}