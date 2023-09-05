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
		
		var html = '<div><div class="uk-card uk-card-secondary uk-card-body" id="selected-radiators"><h3 class="uk-card-title">Radiators on ' + goodsOutPalletText + '</h3><ul class="uk-list"></ul></div></div>';
		
		html += '<div uk-filter="target: .radiator-filter; animation: false;" class="gbc-print-hiden">';
		html += '<ul class="uk-subnav uk-subnav-divider uk-background-default uk-margin" uk-sticky>';
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
		
		if (purchaseOrders.length > 0) {
			html += '<li><a href="#">PO<span uk-icon="icon: triangle-down"></span></a><div uk-dropdown="mode: click" class="gbc-filter"><ul class="uk-nav uk-dropdown-nav">';
			
			for (var i = 0; i < purchaseOrders.length; i++) {
				let purchaseOrder = purchaseOrders[i];
				
				html += '<li uk-filter-control="filter: [data-po=\'' + alphanumeric(purchaseOrder) + '\']; group: data-po"><a href="#">' + purchaseOrder + '</a></li>';
			}
			
			html += '</ul></div></li>';
		}
		
		if (colours.length > 0) {
			html += '<li><a href="#">Colour<span uk-icon="icon: triangle-down"></span></a><div uk-dropdown="mode: click" class="gbc-filter"><ul class="uk-nav uk-dropdown-nav">';
			
			for (var i = 0; i < colours.length; i++) {
				let colour = colours[i];
				
				html += '<li uk-filter-control="filter: [data-colour=\'' + alphanumeric(colour) + '\']; group: data-colour"><a href="#">' + colour + '</a></li>';
			}
			
			html += '</ul></div></li>';
		}
		
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
			html += '<input class="uk-checkbox" type="checkbox" id="' + radiatorId + '" data-name="' + linkedPalletText + ' [' + radiatorColour + '] ' + radiatorName + '" data-changed="false"' + checkboxStatus + '> ';
			html += '[' + radiatorColour + '] ' + radiatorName + checkboxAlreadyOnPallet + ' <span class="uk-text-nowrap uk-text-muted">' + radiatorPurchaseOrder + '</span>';
			html += '</label>'
			html += '<span uk-icon="icon: info;" class="uk-flex-none uk-margin-small-left" uk-tooltip="title: ' + radiatorId + '; pos: left"></span>'
			html += '</li>';
		}
		
		html += '</ul>';
		html += '</div>';
		
		gbc('#page').html(html).show();
		
		gbc('.gbc-filter ul li a').on('click', function(button) { // close the filter menu when clicked on
			button.target.closest('.gbc-filter').classList.remove('uk-open');
		});
		
		gbc('.get-pallet').on('click', function(e) {
			let radiatorId = e.target.dataset.radiator;
			gbc('#goods-out-pallet').val(radiatorId);
			getRadiators();
		});
		
		gbc('#page ul input[type="checkbox"]').on('change', function(e) {
			saveRadiator(e);
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