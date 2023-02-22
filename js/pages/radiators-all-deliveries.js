getStarted();
var html = '';
var maxPalletNumber = 0;

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
	
	gbc('#add-pallets').on('click', function() {
		addPallets();
	});
});

function getPallets() {
	
	let query = ' { boards (ids: ' + boardId_RadiatorPallet + ') { items { id name column_values(ids:["' + columnId_RadiatorPallet_DeliveredBy + '", "' + columnId_RadiatorPallet_Radiators + '", "' + columnId_RadiatorPallet_DispatchedDate + '"]) { id text } } } } ';
	
	mondayAPI(query, function(data) {
		
		var dateSummary = [];
		
		let pallets = data['data']['boards'][0]['items'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let palletName = pallet.name;
			let deliveredDate = getColumnText(pallet, columnId_RadiatorPallet_DispatchedDate);
			
			let palletSummaryPallet = findInArray(dateSummary, 'deliveredDate', deliveredDate);
			let palletAlreadyInPalletSummary = (palletSummaryPallet == undefined);
			
			if ((palletName != "0") && (deliveredDate != "")) {
				if (palletAlreadyInPalletSummary) {
					dateSummary.push({ 'deliveredDate': deliveredDate, 'pallets': [pallet] })
				} else {
					palletSummaryPallet.pallets.push(pallet)
				}
			}
		}
		
		// sort array by pallet number
		dateSummary.sort((a, b) => (a.deliveredDate < b.deliveredDate) ? 1 : -1);
		
		var html = '<ul uk-accordion>';
		
		for (var i = 0; i < dateSummary.length; i++) {
			let delivery = dateSummary[i];
			
			let deliveryDate = delivery.deliveredDate;
			let palletsDelivered = delivery.pallets;
			
			var dateCount = 0;
			
			for (var j = 0; j < palletsDelivered.length; j++) {
				let palletDelivered = palletsDelivered[j];
				
				let palletRadiators = getColumnText(palletDelivered, columnId_RadiatorPallet_Radiators);
				dateCount += ((palletRadiators == '') ? 0 : palletRadiators.split(',').length);
			}
			
			html += '<li>';
			html += '<a class="uk-accordion-title" href="#">';
			html += '<h3>';
			html += deliveryDate + ' [' + dateCount + ' rads]';
			html += '</h3>';
			html += '</a>';
			html += '<div class="uk-accordion-content">';
			html += '<ul class="uk-list uk-list-striped">';
			
			palletsDelivered.sort((a, b) => ((parseInt(a.name)) > (parseInt(b.name))) ? 1 : -1);
			
			for (var j = 0; j < palletsDelivered.length; j++) {
				let palletDelivered = palletsDelivered[j];
				
				let palletId = palletDelivered.id;
				let palletNumber = palletDelivered.name;
				let palletRadiators = getColumnText(palletDelivered, columnId_RadiatorPallet_Radiators);
				let palletDeliveredBy = getColumnText(palletDelivered, columnId_RadiatorPallet_DeliveredBy);
				let palletRadiatorCount = ((palletRadiators == '') ? 0 : palletRadiators.split(',').length);
				let palletRadiatorCountText = palletRadiatorCount + ' rad' + ((palletRadiatorCount == 1) ? '' : 's');
				
				html += '<li class="uk-flex uk-flex-middle">';
				html += '<span>Pallet <a href="radiators-all-pallets.html#' + palletId + '">' + palletNumber + '</a> [' + fixName(palletDeliveredBy) + '] ' + palletRadiatorCountText + '</span>';
				html += '</li>';
			}
			
			html += '</ul>';
			html += '</div>';
			html += '</li>';
		}
		
		html += '</ul>';
		
		gbc('#page').html(html).show();
		
	});
}