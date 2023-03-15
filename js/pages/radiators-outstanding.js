getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getRadiators();
	
	gbc('#save-radiator-note').on('click', function() {
		saveNote();
	});
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
				
				let radiatorId = poRadiator.id;
				let radiatorName = poRadiator.name;
				let radiatorColour = getColumnText(poRadiator, columnId_Radiator_Colour);
				
				html += '<li class="uk-flex uk-flex-middle">';
				html += '<span class="uk-flex-1">[' + radiatorColour + '] ' + radiatorName + '</span>';
				html += '<span uk-icon="info" class="uk-flex-none gbc-radiator-info gbc-box-link" data-radiatorId="' + radiatorId + '"></span>';
				html += '</li>';
			}
			
			html += '</ul>';
			html += '</div>';
			html += '</li>';
		}
		
		html += '</ul>';
		
		gbc('#page').html(html).show();
		
		gbc('#page ul > li > .gbc-radiator-info').on('click', function(radiator) {
			getRadiatorDetails(radiator);
		});
	});
}

function getRadiatorDetails(radiator) {
	let radiatorId = radiator.target.closest('.gbc-radiator-info').getAttribute('data-radiatorid');
	
	let query = ' { boards(ids:' + boardId_Radiator + ') { items(ids: ' + radiatorId + ') { name, updates(limit: 10) { body }, column_values(ids:["' + columnId_Radiator_Colour + '"]) { text id } } } } ';
	
	mondayAPI(query, function(data) {
		let radiator = data['data']['boards'][0]['items'][0];
		
		let radiatorName = radiator['name'];
		let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
		let radiatorUpdates = radiator['updates'];
		
		let modalTitle = '[' + radiatorColour + '] ' + radiatorName;
		let modalId = radiatorName;
		
		var html = '';
		
		if (radiatorUpdates.length > 0) {
			for (var i = 0; i < radiatorUpdates.length; i++) {
				let radiatorUpdate = radiatorUpdates[i];
				
				let updateText = radiatorUpdate.body;
				
				html += '<li>' + updateText + '</li>';
			}
		} else {
			html = '<li>No notes</li>';
		}
		
		gbc('#radiator-modal-title').text(modalTitle);
		gbc('#radiator-modal-id').text(radiatorId);
		gbc('#radiator-modal-notes').html(html);
		
		UIkit.modal('#radiator-modal').show();
	});
}

function saveNote() {
	let id = gbc('#radiator-modal-id').text();
	let note = gbc('#radiator-note').val();
	
	if (note == '') {
		UIkit.notification('Please enter a note', 'warning');
	} else {
		let query = 'mutation { create_update (item_id: ' + id +
			', body: "<p>' + userName + ': ' + note + '</p>") { id } }';
		
		mondayAPI(query, function(data) {
			gbc('#radiator-note').val(''); // clear note field
			UIkit.modal('#radiator-modal').hide();
			UIkit.notification('Note saved', 'success');
		});
	}
}