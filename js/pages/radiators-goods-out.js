getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
});

function getPallets() {
	
	let query = ' { items_by_column_values (board_id: 3894008168, column_id: "color", column_value: "At GBC") { id name } } ';
	
	mondayAPI(query, function(data) {
		
		let pallets = data['data']['items_by_column_values'];
		
		var html = '';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			html += "<option value=\"" + pallet.id + "\">Pallet " + pallet.name + "</option>";
		}
		
		gbc('#goods-out-pallet').html(html).on('change', function(e) {
			getRadiators();
		});;
		
		getRadiators();
		
	});
}

function getRadiators() {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	let query = ' query { items_by_column_values (board_id: 3852829643, column_id: "color0", column_value: "Received") { id group { id title } name column_values { id text value } } }';
	
	mondayAPI(query, function(data) {
		
		console.log(data);
		
		var palletSummary = [];
		
		let radiators = data['data']['items_by_column_values'];
		
		// loop through radiators and add them to a summary array, grouped by pallet number
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			
			let palletNumber = radiator.group.title; //findInArray(radiator.column_values, 'id', 'numeric3').text;
			
			let palletSummaryPallet = findInArray(palletSummary, 'palletNumber', palletNumber);
			let palletAlreadyInPalletSummary = (palletSummaryPallet == undefined);
			
			if (palletAlreadyInPalletSummary) {
				palletSummary.push({ 'palletNumber': palletNumber, 'radiators': [radiator] })
			} else {
				palletSummaryPallet.radiators.push(radiator)
			}
		}
		
		// sort array by pallet number
		palletSummary.sort((a, b) => (a.palletNumber > b.palletNumber) ? 1 : -1);
		
		var html = '<ul uk-accordion>';
		
		for (var i = 0; i < palletSummary.length; i++) {
			let pallet = palletSummary[i];
			
			html += '<li>';
			html += '<a class="uk-accordion-title" href="#">';
			html += '<h3>';
			html += pallet.palletNumber;
			html += '</h3>';
			html += '</a>';
			html += '<div class="uk-accordion-content">';
			html += '<ul class="uk-list uk-list-striped">';
			
			let palletRadiators = pallet.radiators;
			
			// sort radiators on pallet by colour, then number
			palletRadiators.sort((a, b) => (
				(findInArray(a.column_values, 'id', 'color').text + a.name) > 
				(findInArray(b.column_values, 'id', 'color').text + b.name)) ? 1 : -1);
			
			for (var j = 0; j < palletRadiators.length; j++) {
				let palletRadiator = palletRadiators[j];
				
				var checkboxStatus = '';
				var checkboxAlreadyOnPallet = '';
				
				let radiatorColour = findInArray(palletRadiator.column_values, 'id', 'color').text;
				let linkedPalletId = findInArray(palletRadiator.column_values, 'id', 'board_relation6').value;
				let linkedPalletText = findInArray(palletRadiator.column_values, 'id', 'board_relation6').text;
				
				if (linkedPalletId != null) { // if radiator is linked to a pallet
					let assignedPalletId2 = JSON.parse(linkedPalletId);
					
					if (assignedPalletId2.hasOwnProperty('linkedPulseIds')) {
						let assignedPalletId = assignedPalletId2['linkedPulseIds'][0]['linkedPulseId'];
						
						if (assignedPalletId == goodsOutPallet) { // if the radiator is on the selected pallet
							checkboxStatus = ' checked';
						} else { // if the radiator is on a pallet, but not the selected pallet
							checkboxStatus = ' disabled hidden';
							checkboxAlreadyOnPallet = ' - on pallet ' + linkedPalletText;
						}
					}
				}
				
				html += '<li>';
				html += '<label>';
				html += '<input class="uk-checkbox" type="checkbox" id="' + palletRadiator.id + '" data-changed="false"' + checkboxStatus + '> ';
				html += '[' + radiatorColour + '] ' + palletRadiator.name + checkboxAlreadyOnPallet;
				html += '</label>'
				html += '</li>';
			}
				
			html += '</ul>';
			html += '</div>';
			html += '</li>';
		}
		
		html += '</ul>';
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-out-save">Save</button></div>';
		
		gbc('#page').html(html).show();
		
		gbc('#goods-out-save').on('click', function(e) {
			saveRadiators();
		});
		
		gbc('#page ul input[type="checkbox"]').on('click', function(e) {
			e.target.dataset.changed = "true";
		});
		
	});
}

function saveRadiators() {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	let radiators = document.querySelectorAll('#page ul input[type=checkbox][data-changed="true"]');
	
	var query = 'mutation {';
	
	for (var i = 0; i < radiators.length; i++) {
		let radiator = radiators[i];
		let radiatorId = radiator.id;
		let radiatorChecked = radiator.checked;
		
		var radiatorPalletId = JSON.stringify('{"board_relation6" : {"item_ids": [' + goodsOutPallet + ']} }');
		
		if (!radiatorChecked) {
			radiatorPalletId = JSON.stringify('{"board_relation6" : {} }');
		}
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: 3852829643, column_values: ' + radiatorPalletId + ') { id }';
	}
	
	query += ' }';
	
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
}