$(function() {

    // Todo Model
    // ----------
    // Our basic **Todo** model has `content`, `order`, and `done` attributes.
    window.Todo = Backbone.Model.extend({

        // Default attributes for the todo.
        defaults: {
            content: "empty todo...",
            done: false
        },

        // localStorage: new Store("todosModel"),
        // Ensure that each todo created has `content`.
        initialize: function() {
            if (!this.get("content")) {
                this.set({
                    "content": this.defaults.content
                });
            }
        },

        // Toggle the `done` state of this todo item.
        toggle: function() {
            this.save({
                done: !this.get("done")
            });
        }

    });

    // Todo Collection
    // ---------------
    // The collection of todos is backed by *localStorage* instead of a remote
    // server.
    window.TodoList = Backbone.Collection.extend({

        // Reference to this collection's model.
        model: Todo,

        // Save all of the todo items under the `"todos"` namespace.
        localStorage: new Store("todos"),

        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.filter(function(todo) {
                return todo.get('done');
            });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {

            // The first argument in apply ('this') acts as an array		
            return this.without.apply(this, this.done());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function(todo) {
            return todo.get('order');
        }

    });

    // Todo Item View
    // --------------
    // The DOM element for a todo item...
    window.TodoView = Backbone.View.extend({

        //... is a list tag.
        tagName: "li",

        // Cache the template function for a single item.
        template: _.template($('#item-template').html()),

        // The DOM events specific to an item.
        events: {
            "click .check": "toggleDone",
            "dblclick div.todo-content": "edit",
            "click span.todo-destroy": "clear",
            "keypress .todo-input": "updateOnEnter",
			"click a.todo-detail": "detail"
        },

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a **Todo** and a **TodoView** in this
        // app, we set a direct reference on the model for convenience.
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },

        // Re-render the contents of the todo item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            this.setContent();
			// $(this.el).trigger('create');
            return this;
        },

        // To avoid XSS (not that it would be harmful in this particular app),
        // we use `jQuery.text` to set the contents of the todo item.
        setContent: function() {
            var content = this.model.get('content');
            this.$('.todo-content').text(content + ' ' + this.model.id);
            this.input = this.$('.todo-input');
            this.input.bind('blur', _.bind(this.close, this));
            this.input.val(content);
        },

        // Toggle the `"done"` state of the model.
        toggleDone: function() {
            this.model.toggle();
        },

        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function() {
            $(this.el).addClass("editing");
            this.input.focus();
        },

        // Close the `"editing"` mode, saving changes to the todo.
        close: function() {
            this.model.save({
                content: this.input.val()
            });
            $(this.el).removeClass("editing");
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close();
        },

		detail: function(evt) {
			evt.preventDefault();
			console.log('list item model: ', this.model)
			this.detailView = new TodoDetailView({model: this.model});
			detailView.render();
		},

        // Remove this view from the DOM.
        remove: function() {
            $(this.el).remove();
        },

        // Remove the item, destroy the model.
        clear: function() {
            this.model.destroy();
        }

    });

	window.TodoDetailView = Backbone.View.extend({
		el: 'div#todo-detail-content',
		// Cache the template function for a single item.
        template: _.template($('#item-detail-template').html()),

		// The DOM events specific to an item.
        events: {
            "click a.back": "back",
			"click a.save-detail": "save"
        },

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a **Todo** and a **TodoView** in this
        // app, we set a direct reference on the model for convenience.
        initialize: function() {
			
			// _.bindAll(this, 'render')
            // this.model.bind('change', this.render, this);
        },
		render: function() {
			var detail = $(this.el)
			detail.html(this.template(this.model.toJSON()));
			
			// if(this.model.get('done')) {
				// detail.find("input[type='checkbox']").prop("checked",true); 
			// }
			
			detail.trigger('create');
			
			// Change pages to the detail view for the todo
			window.TodosRouter.navigate("page/todo-detail", true);
			
            return this;
		},
		back: function(e) {
			e.preventDefault();
			window.TodosRouter.navigate("page/todoapp/options/reverse/true/data/id/" + this.model.id, true);
			// $(this.el).remove();
		},
		save: function(e) {
			e.preventDefault();
			// var m = {}
			// m['content'] = this.$('.todo-input').val();
			// m['done'] = this.$('#done-item-' + this.model.id).prop('checked') ? true : false;
			// console.log('m', m)
			// this.model.save(m);
			
			this.model.set({content: this.$('.todo-input').val()})
			this.model.set({done: this.$('#done-item-' + this.model.id).prop('checked') ? true : false})
			this.model.save();
			
			// fetch the updates collection so we can trigger a reset event on the list of todo items
			// Todos.fetch();
			
			this.back(e);
			
			$(this.el).empty();
		}
	});

    // The Application
    // ---------------
    // Our overall **AppView** is the top-level piece of UI.
    window.AppView = Backbone.View.extend({

        // Instead of generating a new element, bind to the existing skeleton of
        // the App already present in the HTML.
        el: $("#todoapp"),

        // Our template for the line of statistics at the bottom of the app.
        statsTemplate: _.template($('#stats-template').html()),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
            "click #create-todo span a.save": "createOnEnter",
            "keyup #new-todo": "showTooltip",
            "click .todo-clear a": "clearCompleted",
			"focus #new-todo": "showSave"
        },

        // At initialization we bind to the relevant events on the `Todos`
        // collection, when items are added or changed. Kick things off by
        // loading any preexisting todos that might be saved in *localStorage*.
        initialize: function() {
            this.input = this.$("#new-todo");

			// explicitly hide this component after it is decorated by jQM
			$('#create-todo span a.save').hide();

            Todos.bind('add', this.addOne, this);
            Todos.bind('reset', this.addAll, this);
            Todos.bind('all', this.render, this);

        },

        // Re-rendering the App just means refreshing the statistics -- the rest
        // of the app doesn't change.
        render: function() {
            this.$('#todo-stats').html(this.statsTemplate({
                total: Todos.length,
                done: Todos.done().length,
                remaining: Todos.remaining().length
            }));
        },

        // Add a single todo item to the list by creating a view for it, and
        // appending its element to the `<ul>`.
        addOne: function(todo) {
			console.log('addOne')
            var view = new TodoView({
                model: todo
            });
            this.$("#todo-list").append(view.render().el);
			this.$('#todo-list').listview('refresh');
        },

        // Add all items in the **Todos** collection at once.
        addAll: function() {
			console.log('addAll')
			this.$('#todo-list').empty();
			Todos.each(this.addOne);
			
        },

        // Generate the attributes for a new Todo item.
        newAttributes: function() {
            return {
                content: this.input.val(),
                order: Todos.nextOrder(),
                done: false
            };
        },

        // If you hit return in the main input field, create new **Todo** model,
        // persisting it to *localStorage*.
        createOnEnter: function(e) {
			// if (e.keyCode != 13) return;
            Todos.create(this.newAttributes());
			this.hideSave();
            this.input.val('');
			$('#todo-list').listview('refresh');
        },

        // Clear all done todo items, destroying their models.
        clearCompleted: function() {
            _.each(Todos.done(),
            function(todo) {
                todo.destroy();
            });
            return false;
        },

        // Lazily show the tooltip that tells you to press `enter` to save
        // a new todo item, after one second.
        showTooltip: function(e) {
            var tooltip = this.$(".ui-tooltip-top");
            var val = this.input.val();
            tooltip.fadeOut();
            if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
            if (val == '' || val == this.input.attr('placeholder')) return;
            var show = function() {
                tooltip.show().fadeIn();
            };
            this.tooltipTimeout = _.delay(show, 1000);
        },
		
		showSave: function() {
			$('#create-todo span a.save').show();
		},

		hideSave: function() {
			$('#create-todo span a.save').hide();
		}

    });

    
    var TodosRouter = Backbone.Router.extend({

        routes: {
			"": "home",
            "page/:name": "gotoPage",
            "page/:name/options/*opts/data/*data": "gotoPage"
        },
		home: function() {
			
			// Create our global collection of **Todos**.
		    window.Todos = new TodoList;
			
			window.App = new AppView;
			console.log('in home')
			if(Todos.models.length == 0) {
				Todos.fetch();
				console.log('fetching...')
			}
		},
        gotoPage: function(name, opts, data) {
            var options = this._optionsToObject(opts)

			_.extend(options, {changeHash:false});

            var pageData = this._optionsToObject(data)
            var page;

            console.log('switching page ' + name + ' options ', options, 'data', pageData)

            // Cannot assume prepending a # (determine if page is in dom or remove call)
            if ($(name)) {
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

                _.each(optKeys,
                function(item, index) {
                    var key = optKeys[index]
                    var val = optValues[index]
                    options[key] = val
                })
            }

            // console.log(options)
            return options;
        }

    });

    window.TodosRouter = new TodosRouter();

    Backbone.history.start({
        pushState: false
    });
});