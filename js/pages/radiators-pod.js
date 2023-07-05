getStarted();

document.addEventListener("DOMContentLoaded", function() {
  getDeliveries();
});

function getDeliveries() {

  let query = ' { boards(ids:4206918313) { items { id name column_values(ids:["date6","signature"]) { id text } } } } ';
  
  mondayAPI(query, function(data) {
    var deliveries = data['data']['boards'][0]['items'];
    
    deliveries.sort((a, b) => (
    (getColumnText(a, 'date6') + a.name) <
    (getColumnText(b, 'date6') + b.name)) ? 1 : -1);
    
    var html = '<option value=\"\" disabled hidden selected>Delivery</option>';
    
    for (var i = 0; i < deliveries.length; i++) {
      let delivery = deliveries[i];
      let deliveryDate = getColumnText(delivery, 'date6');
      
      var deliveryDateDate = new Date(deliveryDate);
      var lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      
      let deliverySignature = getColumnText(delivery, 'signature');
      
      let deliveryThisWeek = (deliveryDateDate > lastWeekDate);
      let deliverySigned = (deliverySignature != "");
      
      if (deliveryThisWeek || deliverySigned) {
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
  gbc('#delivery-not-yet-signed').hide();
  gbc('#delivery-signed').hide();
  gbc('#delivery-details').hide();
  
  initialiseSignature();
  
  let delivery = gbc('#delivery').val();
  
  let query = ' { boards(ids:4206918313) { items(ids:' + delivery + ') { id name column_values(ids:["date6","hour","signature","board_relation","people"]) { id text value } } } } ';
  
  mondayAPI(query, function(data) {
    var html = '<ul class="uk-list uk-list-striped">';
    
    var delivery = data['data']['boards'][0]['items'][0];
    
    let deliveryId = delivery.id;
    let deliveryAmPm = delivery.name;
    let deliveryDate = getColumnText(delivery, 'date6');
    let deliveryTime = getColumnText(delivery, 'hour');
    let deliveryDriver = getColumnText(delivery, 'people');
    let deliverySignature = decodeURIComponent(getColumnText(delivery, 'signature'));
    let deliverPallets = getColumnText(delivery, 'board_relation').split(', ');
    var deliveryPallets2 = getColumnText(delivery, 'board_relation').split(', ');
    let deliveryPallets = JSON.parse(getColumnValue(delivery, 'board_relation'));
    
    var palletCount = 0;
    
    if (deliveryPallets != null) {
      deliveryPallets = deliveryPallets['linkedPulseIds'];
      
      if (deliveryPallets != undefined) {
        palletCount = deliveryPallets.length;
        
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
      
      if (palletCount > 0) {
        gbc('#delivery-not-yet-signed').show();
      }
    }
    
    gbc('#delivery-pallets').html(html).show();
  });
}

function saveDelivery() {
  
  let delivery = gbc('#delivery').val();
  let signature = document.getElementById('canvas').toDataURL();
  
  if(!isSign) {
    UIkit.notification('Please sign the form before saving', 'danger');
    return false;
  }
  
  var query = 'mutation {';
  
  var updates = JSON.stringify(' { "signature" : "' + encodeURIComponent(signature) + '" } ');
  
  query += 'change_multiple_column_values(item_id: ' + delivery + ', board_id: 4206918313, column_values: ' + updates + ') { id }';
  
  query += ' }';
  
  mondayAPI(query, function(data) {
    UIkit.notification('Delivery saved', 'success');
    getDelivery();
  });
}

var isSign = false;
var leftMButtonDown = false;

document.addEventListener("DOMContentLoaded", function() {
  initialiseSignature();
});

function saveSignature() {
  if(isSign) {
    var imgData = document.getElementById('canvas').toDataURL();
    document.getElementById('signature').setAttribute('src', imgData);
  } else {
    alert('Please sign');
  }
}

function initialiseSignature() {
  isSign = false;
  leftMButtonDown = false;
  
  var sizedWindowWidth = window.innerWidth;
  
  if (sizedWindowWidth > 700) { // make canvas 
    sizedWindowWidth = window.innerWidth / 2;
  } else if (sizedWindowWidth > 400) {
    sizedWindowWidth = sizedWindowWidth - 100;
  } else {
    sizedWindowWidth = sizedWindowWidth - 50;
  }
  
  var canvas = document.getElementById('canvas');
  canvas.width = sizedWindowWidth;
  canvas.height = 200;
  
  var canvasContext = canvas.getContext('2d');
  
  if (canvasContext) {
    canvasContext.canvas.width  = sizedWindowWidth;
    canvasContext.canvas.height = 200;
    
    canvasContext.fillStyle = "#f8f8f8";
    canvasContext.fillRect(0, 0, sizedWindowWidth, 200);
    
    canvasContext.moveTo(50,150);
    canvasContext.lineTo(sizedWindowWidth - 50, 150);
    canvasContext.stroke();
  }
  
  canvas.onmousedown = function(e) {
    if (e.which === 1) {
      leftMButtonDown = true;
      
      canvasContext.fillStyle = "#000";
      
      var x = e.pageX - e.target.offsetLeft;
      var y = e.pageY - e.target.offsetTop;
      
      canvasContext.moveTo(x, y);
    }
    
    e.preventDefault();
    return false;
  };
  
  canvas.onmouseup = function(e) {
    if(leftMButtonDown && e.which === 1) {
      leftMButtonDown = false;
      isSign = true;
    }
    
    e.preventDefault();
    return false;
  };
  
  
  canvas.onmousemove = function(e) { // draw a line from the last point to this one
    if(leftMButtonDown == true) {
      canvasContext.fillStyle = "#000";
      
      var x = e.pageX - e.target.offsetLeft;
      var y = e.pageY - e.target.offsetTop;
      
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
    }
    
    e.preventDefault();
    return false;
  };
  
  canvas.ontouchstart = function(e) {
    leftMButtonDown = true;
    
    canvasContext.fillStyle = "#000";
    
    var t = e.originalEvent.touches[0];
    var x = t.pageX - e.target.offsetLeft;
    var y = t.pageY - e.target.offsetTop;
    
    canvasContext.moveTo(x, y);
    
    e.preventDefault();
    return false;
  };
  
  canvas.ontouchmove = function(e) {
    canvasContext.fillStyle = "#000";
    
    var t = e.originalEvent.touches[0];
    var x = t.pageX - e.target.offsetLeft;
    var y = t.pageY - e.target.offsetTop;
    
    canvasContext.lineTo(x, y);
    canvasContext.stroke();
    
    e.preventDefault();
    return false;
  };
  
  canvas.ontouchend = function(e) {
    if (leftMButtonDown) {
      leftMButtonDown = false;
      isSign = true;
    }
  };
}