getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPurchaseOrders();
});

function getPurchaseOrders() {
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { groups { id title } } } ';
	
	mondayAPI2(query, function(data) {
		
		let purchaseOrders = data['data']['boards'][0]['groups'];
		
		if (purchaseOrders.length == 0) {
			displayError('No purchase orders (getPurchaseOrders)');
			return false;
		}
		
		var html = '<option value=\"\" disabled hidden selected>Purchase Order</option>';
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			
			let purchaseOrderId = purchaseOrder.id;
			let purchaseOrderName = purchaseOrder.title;
			
			html += "<option value=\"" + purchaseOrderId + "\">" + fixDate(purchaseOrderName) + "</option>";
		}
		
		gbc('#purchase-order').html(html).on('change', function(e) {
			getPurchaseOrder();
		});
		
		getHashOrder();
	});
}

function getPurchaseOrder() {
	
	let purchaseOrderId = gbc('#purchase-order').val();
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { groups(ids: "' + purchaseOrderId + '") { id items_page(limit: 500) { items { id } } } } } ';
	
	mondayAPI2(query, function(data) {
		
		var radiatorIds = [];
		
		let radiators = data['data']['boards'][0]['groups'][0]['items_page']['items'];
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let radiatorId = radiator.id;
			
			radiatorIds.push(radiatorId);
		}
		
		radiatorIds = radiatorIds.join(',');
		
		getRadiators(radiatorIds);
	});
	
}

function getRadiators(radiatorIds) {
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { items_page(limit: 500, query_params: { ids: [' + radiatorIds + ']}) { items { id name column_values(ids:["' + columnId_Radiator_Colour + '","' + columnId_Radiator_PalletIncoming + '","' + columnId_Radiator_ReceivedDate + '","' + columnId_Radiator_PalletOutgoing + '","' + columnId_Radiator_DispatchDate + '","' + columnId_Radiator_Status + '"]) { text id value } } } } } ';
	
	mondayAPI2(query, function(data) {
		let radiators = data['data']['boards'][0]['items_page']['items'];
		
		var html = '<div uk-filter="target: .colour-filter">';
		
		var colours = [];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
			colours.push(radiatorColour);
		}
		
		colours = [... new Set(colours)].sort(); // get unique colours, sorted
		
		if (colours.length > 0) {
			html += '<ul class="uk-subnav uk-subnav-pill gbc-orange-pill">';
			html += '<li class="uk-active" uk-filter-control><a href="#">All</a></li>';
			
			for (var i = 0; i < colours.length; i++) {
				let colour = colours[i];
				
				html += '<li uk-filter-control="filter: .tag-' + alphanumeric(colour) + '"><a href="#">' + colour + '</a></li>';
			}
			
			html += '</ul>';
		}
		
		radiators.sort((a, b) => (
			(getColumnText(a, columnId_Radiator_Colour) + a.name) > 
			(getColumnText(b, columnId_Radiator_Colour) + b.name)) ? 1 : -1);
		
		html += '<ul class="uk-list uk-list-striped colour-filter">';
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let radiatorId = radiator.id;
			let radiatorCode = radiator.name;
			let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
			let radiatorReceivedPallet = getColumnText(radiator, columnId_Radiator_PalletIncoming);
			let radiatorReceivedDate = getColumnText(radiator, columnId_Radiator_ReceivedDate);
			let radiatorDispatchPallet = getColumnText(radiator, columnId_Radiator_PalletOutgoing);
			let radiatorDispatchDate = getColumnText(radiator, columnId_Radiator_DispatchDate);
			let radiatorStatus = getColumnText(radiator, columnId_Radiator_Status);
			
			html += '<li class="tag-' + alphanumeric(radiatorColour) + ' uk-flex uk-flex-middle">';
			html += '<p class="uk-flex-1 uk-margin-remove-bottom">';
			html += '<span class="uk-text-bold">';
			html += '[' + radiatorColour + '] ';
			html += radiatorCode;
			html += '</span>';
			html += '<br />';
			html += '<span class="uk-text-light uk-text-small">';
			
			if (radiatorStatus == "Not Received") {
				html += 'Not received yet';
			} else {
				html += 'Received on pallet ' + radiatorReceivedPallet + ', on ' + fixDate(radiatorReceivedDate);
			}
			
			html += '</span>';
			html += '<br />'
			html += '<span class="uk-text-light uk-text-small">';
			
			if (radiatorDispatchPallet == "") {
				html += 'Not delivered yet';
			} else {
				let radiatorDispatchPalletData = getColumnValue(radiator, columnId_Radiator_PalletOutgoing);
				
				if (JSON.parse(radiatorDispatchPalletData) == null) {
					let radiatorDispatchPalletId = JSON.parse(radiatorDispatchPalletData)['linkedPulseIds'][0]['linkedPulseId'];
					
					if (radiatorDispatchDate != "") {
						html += 'Sent on pallet <a href="radiators-all-pallets.html#' + radiatorDispatchPalletId + '">' + radiatorDispatchPallet + '</a>, on  ' + fixDate(radiatorDispatchDate);
					} else {
						html += 'On pallet <a href="radiators-goods-out.html#' + radiatorDispatchPalletId + '">' + radiatorDispatchPallet + '</a>';
					}
				}
			}
			
			html += '</span>';
			html += '</p>';
			html += '<span uk-icon="icon: info;" class="uk-flex-none" uk-tooltip="title: ' + radiatorId + '; pos: left"></span>'
			html += '</li>';
		}
		
		html += '</ul>';
		html += '</div>';
		
		gbc('#page').html(html).show();
	});
}

function getHashOrder() {
	if(window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		gbc('#purchase-order').val(hash);
		getPurchaseOrder();
	}
}