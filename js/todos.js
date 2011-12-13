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
                  
    window.TodoListView = Backbone.View.extend({
      tagName: 'ul',
      // el: '#todo-list',         
      // initialize: function() {
        // this.collection.bind('reset', this.render, this);
      // },
      render: function() {   
        _.each(this.collection.models, function(model) {
          console.log(model);
          var li = new TodoListItemView({model: model})
          $(this.el).append(li.render());
        },this)   
 
        $(this.el).attr('data-role','listview');
        return this;
      }
    });
    
    window.TodoListItemView = Backbone.View.extend({
      tagName: 'li',
      template: _.template('<a href=""><%=content%></a>'),
      events: {
        'click a' : 'navigate'
      },
      render: function() {         
        return $(this.el).append(this.template(this.model.toJSON()));
      },
      navigate: function(e) {
        e.preventDefault();
        window.TodosRouter.navigate("todo-detail/"+this.model.id, true);
      }
    })
   
     window.TodoDetailView = Backbone.View.extend({
       template: _.template($('#item-detail-template').html()),
       render: function() {
         $(this.el).append(this.template(this.model.toJSON()));
         return this;
       }
     })
                  
     var TodosRouter = Backbone.Router.extend({
       routes: {
    			"": "home",
                "todo-detail/:id": "detail"
                // "page/:name/options/*opts/data/*data": "gotoPage"
            },
        initialize: function() {
          this.Todos = new TodoList();                               
          this.Todos.fetch();  
        },
    		home: function() {
    			// Create our global collection of **Todos**.
          this.listView = new TodoListView({collection: this.Todos}); 
          this.updatePageContent(this.listView.render().el, 'Todo List');          
        },
        detail: function(id) {
          var todo = this.Todos.get(id);
          this.detailView = new TodoDetailView({model: todo});
          this.updatePageContent(this.detailView.render().el, 'Edit Todo', ' ');
        },
        updatePageContent:function(el, title, backButton) {
          if (backButton) {
            $('#todoapp div[data-role=header]').append('<a href="#'+backButton+'" data-icon="arrow-l">Back</a>');
          }
          $('#todoapp div[data-role=content]').html(el);  
          $('#todoapp').trigger('create');
          $('#todoapp div[data-role=header]').html('<h1>'+title+'</h1>');
          $('#todoapp div[data-role=header]').trigger('refresh');
        }
    })
    window.TodosRouter = new TodosRouter();

    Backbone.history.start({
        pushState: false
    });
});