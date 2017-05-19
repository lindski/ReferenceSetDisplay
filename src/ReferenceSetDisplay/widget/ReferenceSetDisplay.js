/*global logger*/
/*
    ReferenceSetDisplay
    ========================

    @file      : ReferenceSetDisplay.js
    @version   : 1.2.0
    @author    : Iain Lindsay
    @date      : 2017-05-17
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
        _reference : null,
        _entity : null,

        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._reference = this.referenceSetAssociation.split('/')[0];
            this._entity = this.referenceSetAssociation.split('/')[1];
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
                callback: function(objs){
                    var dataArray = objs.map(function(o){
                        var data = {};
                        data.guid = o.getGuid();
                        data.caption = o.get(self.displayAttribute);
                        if(self.sortAttribute){
                            data.sortIndex = parseInt(o.get(self.sortAttribute));
                        }

                        return data;
                    });

                    if(self.sortAttribute){
                        dataArray.sort(function(a,b){
                                return a.sortIndex - b.sortIndex;
                        });
                    }

                    dojoConstruct.empty(self.rsdListContainer);

                    for(var i = 0; i< dataArray.length; i++){
                        var obj = dataArray[i];
                        var caption = obj.caption;
                        var itemContent = dojoConstruct.toDom("<span class='rsdItemContent'>" + caption + "</span>");
                        if(self.enableClickToRemove){
                            var itemAnchor = self._getAnchorForItem(obj);
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

        _getAnchorForItem : function(obj) {
            var itemAnchor = dojoConstruct.toDom("<a href='#'></a>");
            var guid = obj.guid;
            var self = this;
            dojoOn(itemAnchor, "click",function(objGuid){

                return function(evt){
                    self._contextObj.removeReferences(self._reference,[objGuid]);

                    if( self.onClickMicroflow ) {
                        self._execMf(self._contextObj.getGuid(), self.onClickMicroflow);
                    }
                }

            }(guid));

            return itemAnchor;
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
        },

        _execMf: function (guid, mf, cb) {
            if (guid && mf) {
                mx.data.action({
                    params: {
                        applyto: 'selection',
                        actionname: mf,
                        guids: [guid]
                    },
                    callback: function (objs) {
                        if (cb) {
                            cb(objs);
                        }
                    },
                    error: function (e) {
                        logger.error('Error running Microflow: ' + e);
                    }
                }, this);
            }

        }
    });
});

require(["ReferenceSetDisplay/widget/ReferenceSetDisplay"]);
