getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getRadiators();
});

function getRadiators() {
	
	let query = 'query { items_by_column_values (board_id: ' + boardId_Radiator + ', column_id: "' + columnId_Radiator_Status + '", column_value: "Received") { id name group { title } column_values(ids:["' + columnId_Radiator_Colour + '"]) { id text } } }';
	
	mondayAPI(query, function(data) {
		
		var poSummary = [];
		
		let radiators = data['data']['items_by_column_values'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let radiatorPo = radiator['group']['title'];
			
			let poSummaryPo = findInArray(poSummary, 'purchaseOrder', radiatorPo);
			let poAlreadyInPoSummary = (poSummaryPo == undefined);
			
			if (poAlreadyInPoSummary) {
				poSummary.push({ 'purchaseOrder': radiatorPo, 'radiators': [radiator] })
			} else {
				poSummaryPo.radiators.push(radiator)
			}
		}
		
		// sort array by pallet number
		poSummary.sort((a, b) => (a.purchaseOrder < b.purchaseOrder) ? 1 : -1);
		
		var html = '<ul uk-accordion>';
		
		for (var i = 0; i < poSummary.length; i++) {
			let po = poSummary[i];
			
			let poPurchaseOrder = po.purchaseOrder;
			let poRadiators = po.radiators;
			
			var poRadiatorsCount = poRadiators.length;
			
			html += '<li>';
			html += '<a class="uk-accordion-title" href="#">';
			html += '<h3>';
			html += poPurchaseOrder + ' [' + poRadiatorsCount + ' rads]';
			html += '</h3>';
			html += '</a>';
			html += '<div class="uk-accordion-content">';
			html += '<ul class="uk-list uk-list-striped">';
			
			poRadiators.sort((a, b) => (
				(getColumnText(a, columnId_Radiator_Colour) + a.name) > 
				(getColumnText(b, columnId_Radiator_Colour) + b.name)) ? 1 : -1);
			
			for (var j = 0; j < poRadiators.length; j++) {
				let poRadiator = poRadiators[j];
				
				let radiatorName = poRadiator.name;
				let radiatorColour = getColumnText(poRadiator, columnId_Radiator_Colour);
				
				html += '<li class="uk-flex uk-flex-middle">';
				html += '<span>[' + radiatorColour + '] ' + radiatorName + '</span>';
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