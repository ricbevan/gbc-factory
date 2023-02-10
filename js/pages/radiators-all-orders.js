getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPurchaseOrders();
});

function getPurchaseOrders() {
	
	let query = ' { boards(ids:3852829643) { id name groups { id title } } } ';
	
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
		
		gbc('#purchase-order').html(html).on('change', function(e) {
			getPurchaseOrder();
		});
		
		getPurchaseOrder();
	});
}

function getPurchaseOrder() {
	
	let purchaseOrderId = gbc('#purchase-order').val();
	
	let query = ' { boards(ids:3852829643) { groups(ids: "' + purchaseOrderId + '") { id items { id } } } } ';
	
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
	
	let query = ' { boards(ids:3852829643) { items(ids: [' + purchaseOrderRadiatorIds + ']) { id name column_values { title text id } } } } ';
	
	mondayAPI(query, function(data) {
		
		let radiators = data['data']['boards'][0]['items'];
		
		radiators.sort((a, b) => (
			(findInArray(a.column_values, 'id', 'color').text + a.name) > 
			(findInArray(b.column_values, 'id', 'color').text + b.name)) ? 1 : -1);
		
		var html = '<ul class="uk-list uk-list-striped">';
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let radiatorCode = radiator.name;
			let radiatorColour = findInArray(radiator.column_values, 'id', 'color').text;
			let radiatorReceivedPallet = findInArray(radiator.column_values, 'id', 'numeric3').text;
			let radiatorReceivedDate = findInArray(radiator.column_values, 'id', 'date').text;
			let radiatorDispatchPallet = findInArray(radiator.column_values, 'id', 'board_relation6').text;
			let radiatorDispatchDate = findInArray(radiator.column_values, 'id', 'lookup').text;
			let radiatorStatus = findInArray(radiator.column_values, 'id', 'color0').text;
			
			html += '<li>';
			html += '<span class="uk-text-bold">';
			html += '[' + radiatorColour + '] ';
			html += radiatorCode;
			html += '</span>';
			html += '<br />';
			html += '<span class="uk-text-light uk-text-small">';
			
			if (radiatorStatus == "At Limitless") {
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
				if (radiatorDispatchDate != "") {
					html += 'Sent on pallet ' + radiatorDispatchPallet + ', on  ' + fixDate(radiatorDispatchDate);
				} else {
					html += 'On pallet ' + radiatorDispatchPallet;
				}
			}
			
			html += '</span>';
			html += '</li>';
		}
		
		html += '</ul>'
		
		gbc('#page').html(html).show();
	});
}