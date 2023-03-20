getStarted();

let boardId_Stock = '4159553073';
let columnId_Stock_Location = 'status9';
let columnId_Stock_Chunal = 'numbers';
let columnId_Stock_Surrey = 'numbers2';

document.addEventListener("DOMContentLoaded", function() {
	gbc('#stock-check-site').on('change', function() {
		getStockItems();
	});
});


function getStockItems() {
	gbc('#checks-loaded').hide();
	
	let selectedSite = gbc('#stock-check-site').val();
	
	let query = ' query { boards(ids: ' + boardId_Stock + ') { items { id name column_values(ids:["' + columnId_Stock_Location + '","' + columnId_Stock_Chunal + '","' + columnId_Stock_Surrey + '"]) { id text } } } } ';
	
	mondayAPI(query, function(data) {
		
		let stockItems = data['data']['boards'][0]['items'];
		
		var locationSummary = [];
		
		for (var i = 0; i < stockItems.length; i++) {
			let stockItem = stockItems[i];
			
			let stockItemLocation = getColumnText(stockItem, columnId_Stock_Location);
				
			let locationSummaryLocation = findInArray(locationSummary, 'location', stockItemLocation);
			let locationAlreadyInlocationSummary = (locationSummaryLocation == undefined);
			
			if (locationAlreadyInlocationSummary) {
				locationSummary.push({ 'location': stockItemLocation, 'stockItems': [stockItem] })
			} else {
				locationSummaryLocation.stockItems.push(stockItem)
			}
		}
		
		locationSummary.sort((a, b) => (a.location > b.location) ? 1 : -1);
		
		var html = '<ul uk-accordion>';
		
		for (var i = 0; i < locationSummary.length; i++) {
			let location = locationSummary[i];
			
			let locationName = location.location;
			let locationStockItems = location.stockItems;
			
			html += '<li>';
			html += '<a class="uk-accordion-title" href="#">';
			html += '<h3>' + locationName + '</h3>';
			html += '</a>';
			html += '<div class="uk-accordion-content uk-margin-remove-top">';
			
			for (var j = 0; j < locationStockItems.length; j++) {
				let locationStockItem = locationStockItems[j];
				
				let stockItemId = locationStockItem.id;
				let stockItemName = locationStockItem.name;
				let stockItemLocation = getColumnText(locationStockItem, columnId_Stock_Location);
				let stockItemChunalCount = getColumnText(locationStockItem, columnId_Stock_Chunal);
				let stockItemSurreyCount = getColumnText(locationStockItem, columnId_Stock_Surrey);
				
				var stockItemCount = 0;
				
				if (selectedSite == 'chunal') {
					stockItemCount = stockItemChunalCount;
				} else {
					stockItemCount = stockItemSurreyCount;
				}
				
				html += '<div>';
				html += '<label class="uk-form-label" for="stock-' + stockItemId + '">' + stockItemName + '</label>';
				html += '<div class="uk-form-controls">';
				html += '<input class="uk-input" id="stock-' + stockItemId + '" type="number" inputmode="numeric" placeholder="0" step="1" value="' + stockItemCount + '">';
				html += '</div>';
				html += '</div>';
			}
			
			html += '</div>';
			html += '</li>';
		}
		
		html += '</ul>';
		
		gbc('#stock-items').html(html);
		
		gbc('#stock-items input[type="number"]').on('change', function(e) {
			e.target.dataset.changed = "true";
		});
		
		gbc('#checks-loaded').show();
		
		gbc('#save-stock-check').on('click', function(e) {
			saveStockCheck();
		});
		
	});
}

function saveStockCheck() {
	
	let stockItems = document.querySelectorAll('input[type="number"][data-changed="true"]');
	
	if (stockItems.length > 0) {
	
		let selectedSite = gbc('#stock-check-site').val();
		
		var updateJson = '"people": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
		
		var updateQueries = [];
		
		for (var i = 0; i < stockItems.length; i++) {
			let stockItem = stockItems[i];
			
			let stockItemId = stockItem.id.replace('stock-', '');
			let stockItemValue = stockItem.value;
			
			let updateColumn = (selectedSite == 'chunal') ? columnId_Stock_Chunal : columnId_Stock_Surrey;
			
			let updates = JSON.stringify('{"' + updateColumn + '" : "' + stockItemValue + '" }');
			let query = ' update' + stockItemId + 'Stock: change_multiple_column_values(item_id: ' + stockItemId + ', board_id: ' + boardId_Stock + ', column_values: ' + updates + ') { id } ';
			
			updateQueries.push(query);
		}
		
		var query2 = 'mutation {';
		query2 += updateQueries.join(' ');
		query2 += ' } ';
		
		mondayAPI(query2, function(data) {
			getStockItems();
		});
	}
}