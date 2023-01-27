var boxId;
var boxFinish, boxCode, boxSupplier;

getStarted();
getBoxFinishes();
getBoxCodes();
getBoxSuppliers();

document.addEventListener("DOMContentLoaded", function() {	
	if (window.location.hash) {
		var boxNumber = window.location.hash.substring(1);
		loadBox(boxNumber);
	} else {
		window.location.replace('powder-management.html');
	}
});

function getBoxFinishes() {

	var query = '{ boards(ids:2586489007) { items { id name } } }';
	
	mondayAPI(query, function(data) {
		var html = '<option value=\"\" disabled hidden selected>finish</option>';
		
		var powderFinishes = data['data']['boards'][0]['items'];
		
		if (powderFinishes.length > 0) {
			
			for (i = 0; i < powderFinishes.length; i++) {
				let powderFinish = powderFinishes[i];
				
				html += "<option value=\"" + powderFinish.id + "\">" + powderFinish.name + "</option>"
			}
			
			gbc('#box-finish').html(html).enable();
			
			if (boxFinish) {
				gbc('#box-finish').val(boxFinish);
			}
		}
	});

}

function getBoxCodes() {

	var query = '{ boards(ids:297792123) { items { id name column_values(ids:"type") { text } } } }';
	
	mondayAPI(query, function(data) {
		var html = '<option value=\"\" disabled hidden selected>code</option>';
		
		var powderCodes = data['data']['boards'][0]['items'];
		
		powderCodes.sort((a, b) => (
			(a.column_values[0].text.toLowerCase() + a.name.toLowerCase()) > 
			(b.column_values[0].text.toLowerCase() + b.name.toLowerCase())) ? 1 : -1
		);
		
		if (powderCodes.length > 0) {
			for (i = 0; i < powderCodes.length; i++) {
				let powderCode = powderCodes[i];
				
				html += "<option value=\"" + powderCode.id + "\">" + powderCode.column_values[0].text + " " + powderCode.name + "</option>";
			}
		
			gbc('#box-code').html(html).enable();
			
			if (boxCode) {
				gbc('#box-code').val(boxCode);
			}
		}
	});

}

function getBoxSuppliers() {

	var query = '{ boards(ids:340703041) { items { id name column_values(ids:"checkbox") { text } } } }';
	
	mondayAPI(query, function(data) {
		var html = '<option value=\"\" disabled hidden selected>supplier</option>';
		
		var powderSuppliers = data['data']['boards'][0]['items'];
		
		if (powderSuppliers.length > 0) {
			for (i = 0; i < powderSuppliers.length; i++) {
				if (powderSuppliers[i]['column_values'][0]['text'] == "v") {
					let powderSupplier = powderSuppliers[i];
					
					html += "<option value=\"" + powderSupplier.id + "\">" + powderSupplier.name + "</option>"
				}
			}
			
			gbc('#box-supplier').html(html).enable();
			
			if (boxSupplier) {
				gbc('#box-supplier').val(boxSupplier);
			}
		}
	});

}

function loadBox(boxNumber) {
	gbc('#box-number').enable();
	
	let query = '{ items_by_column_values(' +
		'board_id: 297756491, column_id:"name", column_value:"' + boxNumber + '"' +
		') { id, column_values { id title value text } } }';
	
	mondayAPI(query, function(data) {		
		var box = data['data']['items_by_column_values'][0];
		
		if (box.length == 0) {
			UIkit.notification('No box with this number, please speak to the office', 'danger');
			return false;
		}
		
		if (box.length > 1) {
			UIkit.notification('Multiple boxes with this number, please speak to the office', 'danger');
			return false;
		}
		
		gbc('#box-number').val(boxNumber).disable();
		
		boxId = box.id;
		
		var boxColumns = box['column_values'];
		
		for (var i = 0; i < boxColumns.length; i++) {
			let boxColumnId = boxColumns[i].id;
			let boxColumnValue = boxColumns[i].value;
			let boxColumnText = boxColumns[i].text;
			
			if ((boxColumnId == 'link_to_item8') || (boxColumnId == 'connect_boards0') || (boxColumnId == 'connect_boards')) {
				if (validJson(boxColumnValue)) {
					let columnValueId = JSON.parse(boxColumnValue)['linkedPulseIds'][0]['linkedPulseId'];
					
					if (boxColumnId == 'link_to_item8') { // get code
						boxCode = columnValueId; // save here to use in getBoxCodes()
						gbc('#box-code').val(boxCode);
					}
					
					if (boxColumnId == 'connect_boards0') { // get finish
						boxFinish = columnValueId; // save here to use in getBoxFinishes()
						gbc('#box-finish').val(boxFinish);
					}
					
					if (boxColumnId == 'connect_boards') { // get supplier
						boxSupplier = columnValueId; // save here to use in getBoxSuppliers()
						gbc('#box-supplier').val(boxSupplier);
					}
				}
			}
				
			if (boxColumnId == 'text') { // get batch-number
				gbc('#box-batch-number').val(boxColumnText);
			}
		}
	});
}

function updateBox() {
	
	let newBoxCode = gbc('#box-code').val();
	let newBoxFinish = gbc('#box-finish').val();
	let newBoxSupplier = gbc('#box-supplier').val();
	let newBatchNumber = gbc('#box-batch-number').val();
	
	var assignedJson = JSON.stringify('{"clear_all": true}');
	
	if (assigned != '[]') { // if there are people, set the correct json
		assignedJson = JSON.stringify('{"personsAndTeams":' + assigned + '}');
	}
	
	let query = 'mutation { change_column_value ' +
		'(board_id: 608197264, item_id: ' + jobId + ', column_id: "' + columnId + '", value: ' + assignedJson + ') ' +
		'{ id, name } }';

	mondayAPI(query, function(data) {
		let job = data['data']['change_column_value'];
		let jobNumber = job.name;
		loadJob(jobNumber);
	});
}