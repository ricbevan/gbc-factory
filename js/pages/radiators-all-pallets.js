getStarted();
var html = '';

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
});

function getPallets() {
	
	let query = ' { boards (ids: 3894008168) { items { id name column_values(ids:["color", "board_relation"]) { id text } } } } ';
	
	mondayAPI(query, function(data) {
		
		let pallets = data['data']['boards'][0]['items'];
		
		pallets.sort((a, b) => (parseInt(a.name) < parseInt(b.name)) ? 1 : -1);
		
		var html = '<option value=\"\" disabled hidden selected>Pallet</option>';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let status = findInArray(pallet.column_values, 'id', 'color').text;
			let radiators = findInArray(pallet.column_values, 'id', 'board_relation').text;
			let radiatorCount = (radiators == '') ? 0 : findInArray(pallet.column_values, 'id', 'board_relation').text.split(',').length;
			let radiatorCountText = radiatorCount + ' rad' + ((radiatorCount == 1) ? '' : 's');
			
			if (pallet.name != "0") {
				html += '<option value="' + pallet.id + '">Pallet ' + pallet.name + ' [' + status + '] ' + radiatorCountText + '</option>';
			}
		}
		
		gbc('#pallet-number').html(html);
		
		gbc('#pallet-number').on('change', function(e) {
			getPallet();
		});
		
	});
}

function getPallet() {
	
	let palletId = gbc('#pallet-number').val();
	
	let query = ' { boards(ids: 3894008168) { items(ids: ' + palletId + ') { column_values(ids: ["date", "color", "multiple_person", "board_relation"]) { id text value } } } } ';
	
	mondayAPI(query, function(data) {
		
		console.log(data);
		
		html = '';
		
		let pallet = data['data']['boards'][0]['items'][0];
		
		let palletDate = findInArray(pallet.column_values, 'id', 'date').text;
		let palletStatus = findInArray(pallet.column_values, 'id', 'color').text;
		let palletDeliveredBy = findInArray(pallet.column_values, 'id', 'multiple_person').text;
		let palletRadiatorIds = findInArray(pallet.column_values, 'id', 'board_relation').value;
		
		if (palletStatus == 'At GBC') {
			html += '<p>Currently at GBC.</p>';
		} else {
			html += '<p>Delivered by ' + palletDeliveredBy + ' on ' + fixDate(palletDate) + '.</p>';
		}
		
		getRadiatorsOnPallets(palletRadiatorIds);
		
		gbc('#page').show().html(html);
		
	});
}

function getRadiatorsOnPallets(palletRadiatorIds) {
	
	if (palletRadiatorIds != null) {
		var radiatorIds = JSON.parse(palletRadiatorIds);
		
		if ('linkedPulseIds' in radiatorIds) {
		
			radiatorIds = radiatorIds['linkedPulseIds'];
			
			radiatorIdArr = [];
			
			for (var i = 0; i < radiatorIds.length; i++) {
				let radiatorId = radiatorIds[i];
				
				radiatorIdArr.push(radiatorId['linkedPulseId']);
			}
			
			let query = ' { boards(ids:3852829643) { items(ids: [' + radiatorIdArr.join(',') + ']) { id name group { title } column_values(ids: ["color", "numeric3", "date", "board_relation7", "lookup", "color0"]) { title text id } } } } ';
			
			mondayAPI(query, function(data) {
				
				html += '<h3 class="uk-card-title">Radiators on pallet</h3><ul class="uk-list uk-list-striped">';
				
				let radiators = data['data']['boards'][0]['items'];
				
				for (var i = 0; i < radiators.length; i++) {
					let radiator = radiators[i];
					
					let radiatorCode = radiator.name;
					let radiatorColour = findInArray(radiator.column_values, 'id', 'color').text;
					let radiatorReceivedPallet = findInArray(radiator.column_values, 'id', 'numeric3').text;
					let radiatorReceivedDate = findInArray(radiator.column_values, 'id', 'date').text;
					let radiatorDispatchPallet = findInArray(radiator.column_values, 'id', 'board_relation7').text;
					let radiatorDispatchDate = findInArray(radiator.column_values, 'id', 'lookup').text;
					let radiatorStatus = findInArray(radiator.column_values, 'id', 'color0').text;
					let radiatorPurchaseOrder = radiator.group.title;
					
					html += '<li class="tag-' + radiatorColour.replace(/\W/g, '') + '">';
					html += '<span class="uk-text-bold">';
					html += '[' + radiatorColour + '] ';
					html += radiatorCode;
					html += '</span>';
					html += '<br />'
					html += '<span class="uk-text-light uk-text-small">';
					html += 'From purchase order: ' + radiatorPurchaseOrder;
					html += '</span>';
					html += '<br />';
					html += '<span class="uk-text-light uk-text-small">';
					
					if (radiatorStatus == "At Limitless") {
						html += 'Not received yet';
					} else {
						html += 'Received on pallet ' + radiatorReceivedPallet + ', on ' + fixDate(radiatorReceivedDate) + '. PO ' + radiatorPurchaseOrder;
					}
					
					html += '</span>';
					
					html += '</li>';
				}
				
				html += '</ul>';
				
				gbc('#page').show().html(html);
				
			});
		}
	}
}