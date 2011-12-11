var WorkspaceRouter = Backbone.Router.extend({

    routes: {
        "page/:name": "gotoPage",
        "page/:name/options/*opts/data/*data": "gotoPage"
    },

    gotoPage: function(name, opts, data) {
        var options = this._optionsToObject(opts)
		var pageData = this._optionsToObject(data)
		var page;
		
		console.log('switching page ' + name + ' options ', options, 'data', pageData)
		
		// Cannot assume prepending a # (determine if page is in dom or remove call)
		if($(name)) {
			page = '#' + name;
		} else {
			page = name
		}
		
        $.mobile.changePage(page, options, pageData)
    },
    // Cheap way to turn /key/value/key2/value2/keyn/valuen into a map of key/value pairs
    _optionsToObject: function(splat) {
        var options = {};
        var optKeys = [];
        var optValues = [];

        if (splat) {
            _.each(splat.split("/"),
            function(item, index) {
                if (index % 2 == 0) {
                    optKeys.push(item)
                } else {
                    switch (item.toLowerCase()) {
                    case "true":
                        item = true;
                        break;
                    case "false":
                        item = false;
                        break;
                    }
                    optValues.push(item)
                }
            });

            _.each(optKeys, function(item, index) {
                var key = optKeys[index]
                var val = optValues[index]
                options[key] = val
            })
        }

		// console.log(options)
        return options;
    }

});

$(function(name) {
    new WorkspaceRouter();
    Backbone.history.start({
        pushState: false
    });
});