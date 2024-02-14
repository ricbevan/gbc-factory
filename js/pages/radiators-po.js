getStarted();

document.addEventListener("DOMContentLoaded", function() {
  getDeliveries();
});

function getDeliveries() {

  let query = ' { boards(ids:4206918313) { items_page(limit: 500, query_params: { order_by: { column_id:"date6", direction:desc } }) { items { id name column_values(ids:["date6","signature"]) { id text } } } } } ';
  
  mondayAPI2(query, function(data) {
	var deliveries = data['data']['boards'][0]['items_page']['items'];
	
	deliveries.sort((a, b) => (
	(getColumnText(a, 'date6') + a.name) <
	(getColumnText(b, 'date6') + b.name)) ? 1 : -1);
	
	var html = '<option value=\"\" disabled hidden selected>Delivery</option>';
	
	for (var i = 0; i < deliveries.length; i++) {
	  let delivery = deliveries[i];
	  let deliveryDate = getColumnText(delivery, 'date6');
	  
	  var deliveryDateDate = new Date(deliveryDate);
	  var todayDate = new Date();
	  
	  let deliverySignature = getColumnText(delivery, 'signature');
	  
	  let deliveryToday = (deliveryDateDate.toLocaleDateString() == todayDate.toLocaleDateString());
	  let deliverySigned = (deliverySignature != "");
	  
	  if (deliveryToday || deliverySigned) {
		let deliveryId = delivery.id;
		let deliveryAmPm = delivery.name;
		
		html += "<option value=\"" + deliveryId + "\">" + fixDate(deliveryDate) + " " + deliveryAmPm + "</option>";
	  }
	}
	
	gbc('#delivery').html(html).on('change', function(e) {
	  getDelivery();
	});
  });
}

function getDelivery() {
  
	gbc('#delivery-radiators').hide();
	
	let delivery = gbc('#delivery').val();
	
	let query = ' { boards(ids:4206918313) { items_page(limit: 500, query_params: { ids: [' + delivery + ']}) { items { id name column_values(ids:["date6","board_relation"]) { id text value } } } } } ';
	
	var html = '<ul class="uk-list"><li>There are no radiators on this delivery</li></ul>';
	gbc('#delivery-radiators').show().html(html);
	
	mondayAPI2(query, function(data) {
		
		var delivery = data['data']['boards'][0]['items_page']['items'][0];
		let deliveryPallets = JSON.parse(getColumnValue(delivery, 'board_relation'));
		
		if (deliveryPallets != null) {
			deliveryPallets = deliveryPallets['linkedPulseIds'];
			
			if (deliveryPallets != undefined) {
				var deliveryPalletIds = [];
				
				for (var i = 0; i < deliveryPallets.length; i++) {
					let deliveryPallet = deliveryPallets[i];
					
					let deliveryPalletId = deliveryPallet['linkedPulseId'];
					
					deliveryPalletIds.push(deliveryPalletId);
				}
				
				let query2 = ' { boards(ids:' + boardId_RadiatorPallet + ') { items_page(limit: 500, query_params: { ids: [' + deliveryPalletIds.join(',') + ']}) { items { id name column_values(ids:["board_relation"]) { id text ... on BoardRelationValue { display_value } } } } } ';
				
				mondayAPI2(query2, function(data2) {
					var radiators = '';
					
					var pallets = data2['data']['boards'][0]['items_page']['items'];
					
					for (var i = 0; i < pallets.length; i++) {
						let pallet = pallets[i];
						var palletRadiators = getColumnText2(pallet, 'board_relation');
						radiators += ', ' + palletRadiators;
					}
					
					radiators = radiators.split(', ');
					
					radiators = radiators.filter(function (el) { return el != ''; });
					
					var uniqueRadiators = {};
					
					for (var i = 0; i < radiators.length; i++) {
						uniqueRadiators[radiators[i]] = 1 + (uniqueRadiators[radiators[i]] || 0);
					}
					
					let uniqueRadiatorsArr = Object.entries(uniqueRadiators);
					
					if (uniqueRadiatorsArr.length > 0) {
						html = '<ul class="uk-list">';
					}
					
					for (var i = 0; i < uniqueRadiatorsArr.length; i++) {
						let uniqueRadiator = uniqueRadiatorsArr[i];
						
						html += '<li class="gbc-radiator-row">';
						html += '<button class="uk-button uk-button-primary uk-margin-right gbc-copy-radiator">Copy</button>';
						html += '<span class="gbc-radiator-quantity">';
						html += uniqueRadiator[1];
						html += '</span>';
						html += ' x ';
						html += '<span class="gbc-radiator-code">';
						html += uniqueRadiator[0];
						html += '</span>';
						html += '</li>';
					}
					
					html += '<li><input class="uk-input gbc-radiator-code-to-copy" type="textarea"></li>';
					
					html += '</ul>';
					
					gbc('#delivery-radiators').show().html(html);
					
					gbc('.gbc-copy-radiator').on('click', function(e) {
						copyToClipboard(this);
					});
				});
			}
		}
	});
}

function copyToClipboard(e) {
	
	var radiatorRow = e.parentNode;
	
	var radiatorCode = radiatorRow.querySelectorAll('.gbc-radiator-code')[0];
	var radiatorQuantity = radiatorRow.querySelectorAll('.gbc-radiator-quantity')[0].innerText;
	var input = document.querySelectorAll('.gbc-radiator-code-to-copy')[0];
	
	input.value = radiatorCode.innerText;
	
	radiatorRow.classList.add('uk-background-secondary');
	
	UIkit.notification('Copied [ x ' + radiatorQuantity + ' ]', 'primary');
	
	if(isOS()) {
		let range = document.createRange();
		range.selectNodeContents(input);
		let selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		input.setSelectionRange(0, 999999);
	} else {
		input.select();
	}
	
	document.execCommand("copy");
	input.blur();
}

function isOS() {
  return navigator.userAgent.match(/ipad|iphone/i)
}