Ext.ns("SymPy");
SymPy.MobileShell = Ext.extend(
    SymPy.Shell, {
        constructor: function(config) {
            config = Ext.apply({}, config);
            SymPy.MobileShell.superclass.constructor.call(this, config);
        },
        renderToolbar: function(el) {
            SymPy.MobileShell.superclass.renderToolbar.call(this, el);
            Ext.DomHelper.insertAfter(
                this.promptEl,
                {
                    tag: 'div',
                    id: 'sympy-live-toolbar-history',
                    children: [{
                                   tag: 'button',
                                   id: 'button-history-prev',
                                   html: '\u2191'
                               }, {
                                   tag: 'button',
                                   id: 'button-history-next',
                                   html: '\u2193'
                               }]
                }, true);
            var insertEl = Ext.get(
                this.submitEl.query('option[value="enter"]')[0]);
            var submitEl = Ext.get(
                this.submitEl.query('option[value="shift-enter"]')[0]);
            submitEl.set({value: "enter-inserts-newline"}).update("inserts newline");
            insertEl.set({value: "enter-submits"}).update("submits");
            this.submitEl.next().remove();
            Ext.DomHelper.insertBefore(this.submitEl,{
                 tag: 'span',
                 html: 'Enter '
            });
            this.historyPrevEl = Ext.get("button-history-prev");
            this.historyNextEl = Ext.get("button-history-next");
        },
        render: function(el) {
            SymPy.MobileShell.superclass.render.call(this, el);
            this.renderSearches();
            this.promptEl.set({autocorrect: 'off', autocapitalize: 'off'});
            var shell = Ext.get("shell");
            $("#output-format").next().remove();
			$("#output-format").next().remove();
            $("#autocomplete").next().remove();
            $("#autocomplete").remove();
            $(".sympy-live-toolbar").children("span").last().remove();
            $("#sympy-live-toolbar-main").
                appendTo(".sympy-live-completions-toolbar");
            $("#fullscreen-button").remove();
            this.completeButtonEl = Ext.DomHelper.insertAfter(
                this.evaluateEl,
                {
                    'tag': 'button',
                    'html': 'Complete'
                }
                , true);
            this.historyPrevEl.on("click", function(event){
                this.promptEl.focus(1000);
                this.prevInHistory();
            }, this);
            this.historyNextEl.on("click", function(event){
                this.promptEl.focus(1000);
                this.nextInHistory();
            }, this);
            this.completeButtonEl.on("click", function(event){
                this.completer.complete(
                    this.getStatement(),
                    this.getSelection());
            }, this);
            Ext.getBody().on("orientationchange", this.orientationUpdate, this);
            this.orientationUpdate();
            Ext.get("menu").on("click", function(event){
                Ext.get("main-navigation").toggle(true);
                Ext.get("main-navigation").down("ul").toggle(true);
            });
            Ext.get(document.body).scrollTo("top", this.outputEl.getTop());
        },
        handleKey: function(event) {
            if (event.getKey() == SymPy.Keys.ENTER) {
                var enterSubmits = (this.submitEl.getValue() ==
                                    "enter-submits");
                if (enterSubmits) {
                    event.stopEvent();
                    this.evaluate();
                    return true;
                }
                else if (this.supportsSelection){

                    var cursor = this.getCursor();

                    if (cursor !== null) {
                        var value = this.getValue();
                        var index = value.lastIndexOf('\n', cursor) + 1;
                        var spaces = "";

                        while (value[index++] == ' ') {
                            spaces += " ";
                        }

                        if (value[cursor-1] == ':') {
                            for (var i = 0; i < this.tabWidth; i++) {
                                spaces += " ";
                            }
                        }

                        var start = value.slice(0, cursor);
                        var end = value.slice(cursor);

                        this.setValue(start + '\n' + spaces + end);
                        this.setCursor(cursor + 1 + spaces.length);

                        event.stopEvent();
                        return true;
                    }
                }
            }
            SymPy.MobileShell.superclass.handleKey.call(this, event);
        },
        renderSearches: function(){
            this.savedSearches = Ext.get("saved-searches");
            this.recentSearches = Ext.get("recent-searches");
            var setupEval = (function(el){
                var nodes = el.query("button");
                var shell = this;  // closure
                Ext.each(nodes, function(node){
                    node = Ext.get(node);
                    node.on("click", function(event){
                        // We don't want the query to show up twice
                        var origPrivacy = shell.recordEl.getValue();
                        shell.recordEl.dom.value =  "on";
                        // And we're going to scroll to the output
                        var scrollY = shell.outputEl.getTop();

                        shell.setValue(this.first("pre").dom.innerHTML);
                        shell.evaluate();

                        Ext.get(document.body).scrollTo("top", scrollY);
                        shell.recordEl.dom.value = origPrivacy;
                    }, node);
                });
            });
            setupEval.call(this, this.recentSearches);
            setupEval.call(this, this.savedSearches);
            $("#saved-searches-clear").click(function(){
                if(confirm("Delete history?") === true){
                    $.ajax({
                        url: "http://" + window.location.host + "/delete",
                        type: 'GET',
                        dataType: 'text',
                        success: function(data, status, xhr){
                            $('#saved-searches-list').
                                html('<li>' + data + '</li>');
                        },
                        failure: function(xhr, status, error){
                            alert("Error: " + status + error);
                        }
                    })
                }
            });
        },

        orientationUpdate: function(){
            if (window.orientation === 0 || window.orientation === 180){
                this.completer.completionRowSize = 1;
            }
            else {
                this.completer.completionRowSize = 2;
            }
        },

        focus: function() {
            this.setSelection(this.getValue().length);
        }
    });
