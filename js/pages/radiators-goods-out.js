getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
});

function getPallets() {
	
	let query = ' { items_by_column_values (board_id: ' + boardId_RadiatorPallet + ', column_id: "' + columnId_RadiatorPallet_Status + '", column_value: "At GBC") { id name } } ';
	
	mondayAPI(query, function(data) {
		
		let purchaseOrders = data['data']['items_by_column_values'];
		
		var html = '';
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let purchaseOrderId = purchaseOrder.id;
			let purchaseOrderName = purchaseOrder.name;
			
			html += "<option value=\"" + purchaseOrderId + "\">Pallet " + purchaseOrderName + "</option>";
		}
		
		gbc('#goods-out-pallet').html(html).on('change', function(e) {
			getRadiators();
		});;
		
		getRadiators();
		
	});
}

function getRadiators() {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	let query = 'query { items_by_column_values (board_id: ' + boardId_Radiator + ', column_id: "' + columnId_Radiator_Status + '", column_value: "Received") { id name group { title } column_values(ids:["' + columnId_Radiator_PalletOutgoing + '","' + columnId_Radiator_Colour + '"]) { id text value } } }';
	
	mondayAPI(query, function(data) {
		
		var palletSummary = [];
		
		let radiators = data['data']['items_by_column_values'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let palletNumber = fixDate(radiator.group.title.replace(' AM', '').replace(' PM', ''));
			
			let palletSummaryPallet = findInArray(palletSummary, 'palletNumber', palletNumber);
			let palletAlreadyInPalletSummary = (palletSummaryPallet == undefined);
			
			if (palletAlreadyInPalletSummary) {
				palletSummary.push({ 'palletNumber': palletNumber, 'radiators': [radiator] })
			} else {
				palletSummaryPallet.radiators.push(radiator)
			}
		}
		
		// sort array by pallet number
		palletSummary.sort((a, b) => (a.palletNumber > b.palletNumber) ? 1 : -1);
		
		var html = '<ul uk-accordion>';
		
		for (var i = 0; i < palletSummary.length; i++) {
			let pallet = palletSummary[i];
			
			let palletNumber = pallet.palletNumber;
			let palletRadiators = pallet.radiators;
			
			var incompleteRadiators = 0;
			var incompleteRadiatorsText = '';
			
			for (var j = 0; j < palletRadiators.length; j++) {
				let palletRadiator = palletRadiators[j];
				
				let linkedPalletText = getColumnText(palletRadiator, columnId_Radiator_PalletOutgoing);
				
				if (linkedPalletText == "") {
					incompleteRadiators += 1;
				}
			}
			
			if (incompleteRadiators > 0) {
				incompleteRadiatorsText = ' [' + incompleteRadiators + ' remaining]';
			}
			
			html += '<li>';
			html += '<a class="uk-accordion-title" href="#">';
			html += '<h3>';
			html += palletNumber + incompleteRadiatorsText;
			html += '</h3>';
			html += '</a>';
			html += '<div class="uk-accordion-content">';
			html += '<ul class="uk-list uk-list-striped">';
			
			// sort radiators on pallet by colour, then number
			palletRadiators.sort((a, b) => (
				(getColumnText(a, columnId_Radiator_Colour) + a.name) > 
				(getColumnText(b, columnId_Radiator_Colour) + b.name)) ? 1 : -1);
			
			for (var j = 0; j < palletRadiators.length; j++) {
				let palletRadiator = palletRadiators[j];
				
				var checkboxStatus = '';
				var checkboxAlreadyOnPallet = '';
				
				let radiatorColour = getColumnText(palletRadiator, columnId_Radiator_Colour);
				let linkedPalletId = getColumnValue(palletRadiator, columnId_Radiator_PalletOutgoing);
				let linkedPalletText = getColumnText(palletRadiator, columnId_Radiator_PalletOutgoing);
				
				if (linkedPalletId != null) { // if radiator is linked to a pallet
					let assignedPalletId2 = JSON.parse(linkedPalletId);
					
					if (assignedPalletId2.hasOwnProperty('linkedPulseIds')) {
						let assignedPalletId = assignedPalletId2['linkedPulseIds'][0]['linkedPulseId'];
						
						if (assignedPalletId == goodsOutPallet) { // if the radiator is on the selected pallet
							checkboxStatus = ' checked';
						} else { // if the radiator is on a pallet, but not the selected pallet
							checkboxStatus = ' disabled hidden';
							checkboxAlreadyOnPallet = ' - on pallet ' + linkedPalletText;
						}
					}
				}
				
				html += '<li class="uk-flex uk-flex-middle">';
				html += '<label class="uk-flex-1">';
				html += '<input class="uk-checkbox" type="checkbox" id="' + palletRadiator.id + '" data-name="' + palletNumber + ' [' + radiatorColour + '] ' + palletRadiator.name + '" data-changed="false"' + checkboxStatus + '> ';
				html += '[' + radiatorColour + '] ' + palletRadiator.name + checkboxAlreadyOnPallet;
				html += '</label>'
				html += '<span uk-icon="icon: info;" class="uk-flex-none" uk-tooltip="title: ' + palletRadiator.id + '; pos: left"></span>'
				html += '</li>';
			}
				
			html += '</ul>';
			html += '</div>';
			html += '</li>';
		}
		
		html += '</ul>';
		
		html += '<div><div class="uk-card uk-card-secondary uk-card-body" id="selected-radiators"><h3 class="uk-card-title">Selected radiators</h3><ul class="uk-list"></ul></div></div>';
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-out-save">Save</button></div>';
		
		gbc('#page').html(html).show();
		
		gbc('#goods-out-save').on('click', function(e) {
			saveRadiators();
		});
		
		gbc('#page ul input[type="checkbox"]').on('click', function(e) {
			e.target.dataset.changed = "true";
			getSelectedRadiators();
		});
		
		getSelectedRadiators();
	});
}

function getSelectedRadiators() {
	
	var html = '';
	
	gbc('#page ul input[type=checkbox]:checked').each(function(radiator) {
		html += '<li>' + radiator.dataset.name + '</li>';
	});
	
	if (html == '') {
		html = 'No radiators currently on pallet';
	}
	
	gbc('#selected-radiators ul').html(html);
}

function saveRadiators() {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	var query = 'mutation {';
	
	gbc('#page ul input[type=checkbox][data-changed="true"]').each(function(radiator) {
		let radiatorId = radiator.id;
		let radiatorChecked = radiator.checked;
		
		var radiatorPalletId = JSON.stringify('{"' + columnId_Radiator_PalletOutgoing + '" : {"item_ids": [' + goodsOutPallet + ']} }');
		
		if (!radiatorChecked) {
			radiatorPalletId = JSON.stringify('{"' + columnId_Radiator_PalletOutgoing + '" : {} }');
		}
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + boardId_Radiator + ', column_values: ' + radiatorPalletId + ') { id }';
	});
	
	query += ' }';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
}