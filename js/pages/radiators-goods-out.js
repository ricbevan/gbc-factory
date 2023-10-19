getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
});

function getPallets() {
	
	let query = ' { items_by_column_values (board_id: ' + boardId_RadiatorPallet + ', column_id: "' + columnId_RadiatorPallet_Status + '", column_value: "At GBC") { id name } } ';
	
	mondayAPI(query, function(data) {
		
		let purchaseOrders = data['data']['items_by_column_values'];
		
		var html = '<option value=\"\" disabled hidden selected>Pallet</option>';
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let purchaseOrderId = purchaseOrder.id;
			let purchaseOrderName = purchaseOrder.name;
			
			html += "<option value=\"" + purchaseOrderId + "\">Pallet " + purchaseOrderName + "</option>";
		}
		
		gbc('#goods-out-pallet').html(html).on('change', function(e) {
			getRadiators();
		});
		
		getHashPallet();
		
	});
}

function getRadiators() {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	var goodsOutPalletElement = document.getElementById("goods-out-pallet");
	var goodsOutPalletText = goodsOutPalletElement.options[goodsOutPalletElement.selectedIndex].text;
	
	let query = 'query { items_by_column_values (board_id: ' + boardId_Radiator + ', column_id: "' + columnId_Radiator_Status + '", column_value: "Received") { id name group { title } column_values(ids:["' + columnId_Radiator_PalletOutgoing + '","' + columnId_Radiator_Colour + '", "' + columnId_Radiator_DispatchDate + '"]) { id text value } } }';
	
	mondayAPI(query, function(data) {
		
		let radiators = data['data']['items_by_column_values'];
		
		var colours = [];
		var purchaseOrders = [];
		
		var checkSheet = '<ul class="uk-list uk-list-collapse uk-hidden gbc-print-shown">';
		checkSheet += '<li>Date of inspection: .............. / ............... / ...............</li>';
		checkSheet += '<li class="uk-margin-small-top">Inspected by: ........................................</li>';
		checkSheet += '<li class="uk-margin-small-top">Hook marks:<span class="uk-align-right"><span class="uk-margin-medium-right">PASS</span>FAIL</span></li>';
		checkSheet += '<li class="uk-text-italic">Paint in threads:<span class="uk-align-right"><span class="uk-margin-medium-right">PASS</span>FAIL</span></li>';
		checkSheet += '<li class="uk-text-italic">Excessive build-up of paint:<span class="uk-align-right"><span class="uk-margin-medium-right">PASS</span>FAIL</span></li>';
		checkSheet += '<li>Surface finish/fully painted:<span class="uk-align-right"><span class="uk-margin-medium-right">PASS</span>FAIL</span></li>';
		checkSheet += '<li class="uk-text-italic">Bracket inspection:<span class="uk-align-right"><span class="uk-margin-medium-right">PASS</span>FAIL</span></li>';
		checkSheet += '<li>Touch-up required:<span class="uk-align-right"><span class="uk-margin-medium-right">YES</span>NO</span></li>';
		checkSheet += '</ul>';
		
		var html = '<div><div class="uk-card uk-card-secondary uk-card-body" id="selected-radiators"><div class="uk-flex"><div class="uk-flex-1"><h3 class="uk-card-title uk-margin-remove-bottom">Radiators on ' + goodsOutPalletText + '</h3></div><div class="uk-flex-none gbc-print-hidden"><a href="javascript: window.print();" class="uk-icon-link" uk-icon="icon: print; ratio: 1.5"></a></div></div>' + checkSheet + '<ul class="uk-list gbc-goods-out-list"></ul></div></div>';
		
		html += '<div uk-filter="target: .radiator-filter; animation: false;" class="gbc-print-hidden">';
		html += '<ul class="uk-subnav uk-subnav-divider uk-background-default uk-margin" uk-sticky id="radiator-filter">';
		html += '<li class="uk-active" uk-filter-control><a href="#">All</a></li>';
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
			colours.push(radiatorColour);
			
			let purchaseOrder = fixDate(radiator.group.title.replace(' AM', '').replace(' PM', ''));
			purchaseOrders.push(purchaseOrder);
		}
		
		colours = [... new Set(colours)].sort(); // get unique colours, sorted
		purchaseOrders = [... new Set(purchaseOrders)].sort(); // get unique dates, sorted
		
		// ui kit only works with a list, as this doesn't render well with large amounts of items, hide it
		// and render a drop down list (this is handled below)
		var hiddenFilter = '<li hidden><ul>';
		
		if (purchaseOrders.length > 0) {
			html += '<li><select class="uk-select">';
			
			hiddenFilter += '<li uk-filter-control="group: data-po" id="all-po"></li>';
			html += '<option value="all-po">All</option>';
			
			for (var i = 0; i < purchaseOrders.length; i++) {
				let purchaseOrder = purchaseOrders[i];
				
				hiddenFilter += '<li uk-filter-control="filter: [data-po=\'' + alphanumeric(purchaseOrder) + '\']; group: data-po" id="' + alphanumeric(purchaseOrder) + '-po"></li>';
				html += '<option value="' + alphanumeric(purchaseOrder) + '-po">' + purchaseOrder + '</option>';
			}
			
			html += '</select></li>';
		}
		
		if (colours.length > 0) {
			html += '<li><select class="uk-select">';
			
			hiddenFilter += '<li uk-filter-control="group: data-colour" id="all-colour"></li>';
			html += '<option value="all-colour">All</option>';
			
			for (var i = 0; i < colours.length; i++) {
				let colour = colours[i];
				
				hiddenFilter += '<li uk-filter-control="filter: [data-colour=\'' + alphanumeric(colour) + '\']; group: data-colour" id="' + alphanumeric(colour) + '-colour"></li>';
				html += '<option value="' + alphanumeric(colour) + '-colour">' + colour + '</option>';
			}
			
			html += '</select></li>';
		}
		
		hiddenFilter += '</ul></li>';
		html += hiddenFilter;
		
		html += '</ul>';
		
		radiators.sort((a, b) => (
		(a.group.title.replace(' AM', '').replace(' PM', '') + ' ' + getColumnText(a, columnId_Radiator_Colour) + ' ' + a.name) > 
		(b.group.title.replace(' AM', '').replace(' PM', '') + ' ' + getColumnText(b, columnId_Radiator_Colour) + ' ' + b.name)) ? 1 : -1);
		
		html += '<ul class="uk-list uk-list-divider radiator-filter">';
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			var checkboxStatus = '';
			var checkboxAlreadyOnPallet = '';
			
			let radiatorId = radiator.id;
			let radiatorName = radiator.name;
			let radiatorPurchaseOrder = fixDate(radiator.group.title.replace(' AM', '').replace(' PM', ''));
			let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
			let linkedPalletId = getColumnValue(radiator, columnId_Radiator_PalletOutgoing);
			let linkedPalletText = getColumnText(radiator, columnId_Radiator_PalletOutgoing);
			let linkedPalletDispatchDate = getColumnText(radiator, columnId_Radiator_DispatchDate);
			
			if (linkedPalletId != null) { // if radiator is linked to a pallet
				let assignedPalletId2 = JSON.parse(linkedPalletId);
				
				if (assignedPalletId2.hasOwnProperty('linkedPulseIds')) {
					let assignedPalletId = assignedPalletId2['linkedPulseIds'][0]['linkedPulseId'];
					
					if (assignedPalletId == goodsOutPallet) { // if the radiator is on the selected pallet
						checkboxStatus = ' checked';
					} else { // if the radiator is on a pallet, but not the selected pallet
						checkboxStatus = ' disabled hidden';
						
						var palletLink = '';
						
						if (linkedPalletDispatchDate == '') {
							palletLink = '<span class="get-pallet" data-radiator="' + assignedPalletId + '">' + linkedPalletText + '</span>';
						} else {
							palletLink = '<a href="radiators-all-pallets.html#' + assignedPalletId + '">' + linkedPalletText + '</a>';
						}
						
						checkboxAlreadyOnPallet = ' - on pallet ' + palletLink;
					}
				}
			}
			
			html += '<li class="uk-flex uk-flex-middle" data-colour="' + alphanumeric(radiatorColour) + '" data-po="' + alphanumeric(radiatorPurchaseOrder) + '">';
			html += '<label class="uk-flex-1">';
			html += '<input class="uk-checkbox" type="checkbox" id="' + radiatorId + '" data-name="[' + radiatorColour + '] ' + radiatorName +  ' (' + radiatorPurchaseOrder + ')" data-changed="false"' + checkboxStatus + '> ';
			html += '[' + radiatorColour + '] ' + radiatorName + checkboxAlreadyOnPallet + ' <span class="uk-text-nowrap uk-text-muted">' + radiatorPurchaseOrder + '</span>';
			html += '</label>'
			html += '<span uk-icon="icon: info;" class="uk-flex-none uk-margin-small-left" uk-tooltip="title: ' + radiatorId + '; pos: left"></span>'
			html += '</li>';
		}
		
		html += '</ul>';
		html += '</div>';
		
		gbc('#page').html(html).show();
		
		gbc('.get-pallet').on('click', function(e) {
			let radiatorId = e.target.dataset.radiator;
			gbc('#goods-out-pallet').val(radiatorId);
			getRadiators();
		});
		
		gbc('#page ul input[type="checkbox"]').on('change', function(e) {
			saveRadiator(e);
		});
		
		getSelectedRadiators();
		
		// whenever a filter drop down list is clicked, 'click' the related list item
		gbc('#radiator-filter select').on('change', function(button) { // close the filter menu when clicked on
			document.getElementById(button.target.value).click();
		});
	});
}

function getSelectedRadiators() {
	
	var html = '';
	
	gbc('#page ul input[type=checkbox]:checked').each(function(radiator) {
		html += '<li>' + radiator.dataset.name + '</li>';
	});
	
	var radiatorCount = gbc('#page ul input[type=checkbox]:checked').count();
	
	if (radiatorCount > 0) {
		html += '<li class="uk-text-lead">Quantity: ' + radiatorCount + '</li>';
	} else {
		html = 'No radiators currently on pallet';
	}
	
	gbc('#selected-radiators .gbc-goods-out-list').html(html);
}

function saveRadiator(radiatorCheckbox) {
	
	let radiator = radiatorCheckbox.target;
	
	let radiatorId = radiator.id;
	let radiatorChecked = radiator.checked;
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	var radiatorPalletId = JSON.stringify('{"' + columnId_Radiator_PalletOutgoing + '" : {"item_ids": [' + goodsOutPallet + ']} }');
	
	if (!radiatorChecked) {
		radiatorPalletId = JSON.stringify('{"' + columnId_Radiator_PalletOutgoing + '" : {} }');
	}
	
	let query = ' mutation { change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + boardId_Radiator + ', column_values: ' + radiatorPalletId + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
		getSelectedRadiators();
	});
}

function getHashPallet() {
	if(window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		gbc('#goods-out-pallet').val(hash);
		getRadiators();
	}
}