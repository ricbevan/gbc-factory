document.addEventListener("DOMContentLoaded", function(){
	
	if(window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		if (hash == 'clear') {
			localStorage.removeItem('User ID');
		}
		
		if (hash.includes("-")) {
			hash = hash.split("-");
			
			if (hash.length == 2) {
				setLocalStorage('API Key', hash[0]);
				setLocalStorage('User ID', hash[1]);
			}
		}
	}
	
	getStarted();
});