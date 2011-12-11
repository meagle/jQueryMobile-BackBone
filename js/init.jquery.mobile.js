// Since we are using the backbone router we want to disable
// auto link routing of jquery mobile.
$(document).bind("mobileinit", function(){
  $.extend($.mobile, {

	// Don't allow jQM to handle link clicks and form submissions through Ajax
    ajaxEnabled: false,  

	// Prevent jQuery Mobile from handling hash changes so we can handle them in Backbone
	hashListeningEnabled: false,

	// Don't use history.replaceState at this time for browser compatibility reasons.
	pushStateEnabled: false,
	
	// Prevent all anchor click handling including the addition of active 
	// button state and alternate link bluring.  This is we can allow Backbone
	// to handle these requests.
	linkBindingEnabled:false  
  });

  // Don't let jQM update the hash in the location bar.  Let Backbone drive this.
  $.mobile.changePage.defaults.changeHash = false;

});


