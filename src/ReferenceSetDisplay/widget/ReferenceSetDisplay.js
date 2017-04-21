/*global logger*/
/*
    ReferenceSetDisplay
    ========================

    @file      : ReferenceSetDisplay.js
    @version   : 1.1.0
    @author    : Iain Lindsay
    @date      : 2017-04-21
    @copyright : AuraQ Limited 2017
    @license   : Apache V2

    Documentation
    ========================
    Alternative way to render a reference set 
*/
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/on",
    "dojo/_base/event",

    "dojo/text!ReferenceSetDisplay/widget/template/ReferenceSetDisplay.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoOn, dojoEvent, widgetTemplate) {
    "use strict";

    return declare("ReferenceSetDisplay.widget.ReferenceSetDisplay", [ _WidgetBase, _TemplatedMixin ], {

        templateString: widgetTemplate,

        widgetBase: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _sortParams: null,
        _reference : null,

        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._reference = this.referenceSetAssociation.split('/')[0];

            // issues with the sort parameters being persisted between widget instances mean we set the sort array to empty.
            this._sortParams = [];
            // create our sort order array
            for(var i=0;i< this._sortContainer.length;i++) {
                var item = this._sortContainer[i];
                this._sortParams.push([item.sortAttribute, item.sortOrder]); 
            }
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback);
        },

        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
            var self = this;
            mx.data.get({
                guids: this._contextObj.getReferences(this._reference),
                filter: {
                    sort: this._sortParams
                },
                callback: function(objs){
                    dojoConstruct.empty(self.rsdListContainer);

                    for(var i = 0; i< objs.length; i++){
                        var obj = objs[i];
                        var caption = obj.get(self.displayAttribute);
                        var itemContent = dojoConstruct.toDom("<span class='rsdItemContent'>" + caption + "</span>");
                        if(self.enableClickToRemove){
                            var itemAnchor = dojoConstruct.toDom("<a href='#'></a>");
                            var guid = obj.getGuid();
                            dojoOn(itemAnchor, "click",function(evt){
                                self._contextObj.removeReferences(self._reference,[guid]);                                
                            })
                            dojoConstruct.place(itemContent,itemAnchor);
                            itemContent = itemAnchor;
                        }
                        var item = dojoConstruct.toDom("<li class='rsdItem'></li>");
                        dojoConstruct.place(itemContent,item);

                        dojoConstruct.place(item, self.rsdListContainer,"last");
                    }

                    mendix.lang.nullExec(callback); 
                }
            });
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscriptions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function(guid) {                                              
                        this._updateRendering();
                    })
                });

                var referenceHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this._reference,
                    callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                this._handles = [ objectHandle, referenceHandle ];
            }
        }
    });
});

require(["ReferenceSetDisplay/widget/ReferenceSetDisplay"]);
