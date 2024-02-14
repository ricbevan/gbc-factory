getStarted();
var html = '';
var maxPalletNumber = 0;

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
  
  gbc('#delivery-pallets').hide();
  // gbc('#delivery-not-yet-signed').hide();
  gbc('#delivery-signed').hide();
  gbc('#delivery-details').hide();
  
  // initialiseSignature();
  
  let delivery = gbc('#delivery').val();
  
  let query = ' { boards(ids:4206918313) { items_page(limit: 500, query_params: { ids: [' + delivery + ']}) { items { id name column_values(ids:["date6","hour","signature","board_relation","people"]) { id text value ... on BoardRelationValue { display_value } } } } } } ';
  
  mondayAPI2(query, function(data) {
	var html = '<ul class="uk-list uk-list-striped">';
	
	var delivery = data['data']['boards'][0]['items_page']['items'][0];
	
	let deliveryId = delivery.id;
	let deliveryAmPm = delivery.name;
	let deliveryDate = getColumnText(delivery, 'date6');
	let deliveryTime = getColumnText(delivery, 'hour');
	let deliveryDriver = getColumnText(delivery, 'people');
	let deliverySignature = decodeURIComponent(getColumnText(delivery, 'signature'));
	var deliveryPallets2 = '';
	var deliveryPallets = '';
	
	if (getColumnText2(delivery, 'board_relation') != null) {
		deliveryPallets2 = getColumnText2(delivery, 'board_relation').split(', ');
	}
	
	if (getColumnValue(delivery, 'board_relation') != null) {
		deliveryPallets = JSON.parse(getColumnValue(delivery, 'board_relation'));
	}
	
	if (deliveryPallets != null) {
		deliveryPallets = deliveryPallets['linkedPulseIds'];
		
		if (deliveryPallets != undefined) {
			for (var i = 0; i < deliveryPallets.length; i++) {
				let deliveryPallet = deliveryPallets[i];
				
				let deliveryPalletId = deliveryPallet['linkedPulseId'];
				let deliveryPalletName = deliveryPallets2[i];
				
				html += '<li>';
				html += 'Pallet <a href="radiators-all-pallets.html#' + deliveryPalletId + '">' + deliveryPalletName + '</a>';
				html += '</li>';
			}
		}
	} else {
		html += '<li>';
		html += 'No pallets on this delivery.';
		html += '</li>';
	}
	
	if (deliverySignature != "") {
		gbc('#delivery-status').text('Delivered');
		gbc('#delivery-date-time').text(deliveryDate + ' ' + deliveryTime);
		gbc('#delivery-driver').text(deliveryDriver);
		
		document.getElementById('signature').setAttribute('src', deliverySignature);
		
		gbc('#delivery-signed').show();
		gbc('#delivery-details').show();
	} else {
		gbc('#delivery-status').text('Not yet delivered');
		gbc('#delivery-date-time').text('-');
		gbc('#delivery-driver').text('-');
		
		gbc('#delivery-details').show();
	}
	
	gbc('#delivery-pallets').html(html).show();
  });
}