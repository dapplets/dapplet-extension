// ==UserScript==
// @name TwitterAdapter
// @description Adapter for twitter.com
// @author Dapplets Team
// @version 1
// ==/UserScript==
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BasicView = (function () {
    function BasicView(name, INSERT_POINTS) {
        this.name = name;
        this.INSERT_POINTS = INSERT_POINTS;
        this.isActive = false;
        this.observer = null;
        this.attachedActionFactories = {};
    }
    BasicView.prototype.attachActionFactories = function (actionFactories, insPoint) {
        var _a;
        if (!this.attachedActionFactories[insPoint]) {
            this.attachedActionFactories[insPoint] = actionFactories;
        }
        else {
            (_a = this.attachedActionFactories[insPoint]).push.apply(_a, actionFactories);
        }
    };
    BasicView.prototype.injectActions = function (doc) {
        for (var insPoint in this.attachedActionFactories) {
            for (var _i = 0, _a = this.attachedActionFactories[insPoint]; _i < _a.length; _i++) {
                var actionFactory = _a[_i];
                actionFactory(this, insPoint);
            }
        }
    };
    BasicView.prototype.activate = function (doc) {
        this.isActive = true;
        this.startMutationObserver(doc);
        this.injectActions(doc);
        console.log("View \"" + this.name + "\" is activated");
    };
    BasicView.prototype.deactivate = function (doc) {
        this.isActive = false;
        this.stopMutationObserver(doc);
        console.log("View \"" + this.name + "\" is deactivated");
    };
    BasicView.prototype.stopMutationObserver = function (doc) {
        this.observer && this.observer.disconnect();
        console.log("View \"" + this.name + "\": stopMutationObserver");
    };
    return BasicView;
}());
var ContentAdapter = (function () {
    function ContentAdapter() {
        var _this = this;
        this.core = null;
        this.doc = null;
        this.contextBuilders = {
            tweetContext: function (tweetNode) { return ({
                id: tweetNode.getAttribute('data-tweet-id'),
                text: tweetNode.querySelector('div.js-tweet-text-container').innerText,
                authorFullname: tweetNode.querySelector('strong.fullname').innerText,
                authorUsername: tweetNode.querySelector('span.username').innerText,
                authorImg: tweetNode.querySelector('img.avatar').getAttribute('src')
            }); },
            dmContext: function (tweetNode) { return ({
                threadId: tweetNode.getAttribute('data-thread-id'),
                lastMessageId: tweetNode.getAttribute('data-last-message-id'),
                fullname: tweetNode.querySelector('div.DMInboxItem-title .fullname') && tweetNode.querySelector('div.DMInboxItem-title .fullname').innerText,
                username: tweetNode.querySelector('div.DMInboxItem-title .username') && tweetNode.querySelector('div.DMInboxItem-title .username').innerText,
                text: tweetNode.querySelector('.DMInboxItem-snippet').innerText
            }); }
        };
        this.insPoints = {
            TWEET_SOUTH: {
                name: "TWEET_SOUTH",
                toContext: function (node) { return node.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode; },
                context: this.contextBuilders.tweetContext,
                selector: "#timeline li.stream-item div.js-actions"
            },
            TWEET_COMBO: {
                name: "TWEET_COMBO",
                toContext: function (node) { return node.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode; },
                context: this.contextBuilders.tweetContext,
                selector: ""
            },
            DM_SOUTH: {
                name: "DM_SOUTH",
                toContext: function (node) { return node.parentNode.parentNode.parentNode.parentNode; },
                context: this.contextBuilders.dmContext,
                selector: "#dm_dialog li.DMInbox-conversationItem div.DMInboxItem"
            },
            DM_EAST: {
                name: "DM_EAST",
                toContext: function (node) { return node.parentNode.parentNode.parentNode.parentNode; },
                context: this.contextBuilders.dmContext,
                selector: ""
            }
        };
        this.views = [
            new (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                class_1.prototype.startMutationObserver = function (doc) {
                    var _this = this;
                    console.log("View \"" + this.name + "\": startMutationObserver #1.3");
                    var node = doc.getElementById('timeline');
                    if (!this.observer) {
                        this.observer = new MutationObserver(function (mutations) {
                            console.log("View \"" + _this.name + "\": mutated");
                            _this.injectActions(doc);
                        });
                    }
                    this.observer.observe(node, {
                        childList: true,
                        subtree: true
                    });
                };
                return class_1;
            }(BasicView))("TIMELINE", ["TWEET_SOUTH", "TWEET_COMBO"]),
            new (function (_super) {
                __extends(class_2, _super);
                function class_2() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                class_2.prototype.startMutationObserver = function (doc) {
                    var _this = this;
                    console.log("View \"" + this.name + "\": startMutationObserver #2.3");
                    var node = doc.getElementById('dm_dialog');
                    if (!this.observer) {
                        this.observer = new MutationObserver(function (mutations) {
                            console.log("View \"" + _this.name + "\": mutated");
                            _this.injectActions(doc);
                        });
                    }
                    this.observer.observe(node, {
                        childList: true,
                        subtree: true
                    });
                };
                return class_2;
            }(BasicView))("DIRECT_MESSAGE", ["DM_SOUTH", "DM_EAST"]),
        ];
        this.actionFactories = {
            button: function (config) { return (function (view, insPoint) {
                return _this.insertInlineButtonInToView(view, _this.insPoints[insPoint], config);
            }); },
            menuItem: function (_a) { return (function (view, insPoint) {
                return console.error('menuItem is not implemented');
            }); }
        };
    }
    ContentAdapter.prototype.init = function (core, doc) {
        this.core = core;
        this.doc = doc;
        this.initRouteObserver(doc);
    };
    ContentAdapter.prototype.getViewById = function (viewId) {
        var foundViews = this.views.filter(function (v) { return v.name == viewId; });
        if (foundViews.length == 0) {
            throw new Error("View \"" + viewId + "\" is not registered.");
        }
        return foundViews[0];
    };
    ContentAdapter.prototype.initRouteObserver = function (doc) {
        var _this = this;
        if (!window || !MutationObserver)
            throw Error('MutationObserver is not available.');
        var observer = new MutationObserver(function (mutations) {
            var oldViewIds = _this.views.filter(function (v) { return v.isActive == true; }).map(function (v) { return v.name; });
            var newViewIds = [];
            if (doc.querySelector("#timeline")) {
                newViewIds.push("TIMELINE");
            }
            var dmDialog = doc.querySelector("#dm_dialog");
            if (dmDialog && dmDialog.style.display == "") {
                newViewIds.push("DIRECT_MESSAGE");
            }
            var activatedViewIds = newViewIds.filter(function (v) { return oldViewIds.indexOf(v) == -1; });
            var deactivatedViewIds = oldViewIds.filter(function (v) { return newViewIds.indexOf(v) == -1; });
            if (activatedViewIds.length > 0 || deactivatedViewIds.length > 0) {
                _this.onRouteChanged(activatedViewIds, deactivatedViewIds);
            }
        });
        observer.observe(doc.body, {
            childList: true,
            subtree: true
        });
    };
    ContentAdapter.prototype.onRouteChanged = function (viewIdsActivating, viewIdsDeactivating) {
        for (var _i = 0, viewIdsActivating_1 = viewIdsActivating; _i < viewIdsActivating_1.length; _i++) {
            var viewId = viewIdsActivating_1[_i];
            this.getViewById(viewId).activate(this.doc);
        }
        for (var _a = 0, viewIdsDeactivating_1 = viewIdsDeactivating; _a < viewIdsDeactivating_1.length; _a++) {
            var viewId = viewIdsDeactivating_1[_a];
            this.getViewById(viewId).deactivate(this.doc);
        }
    };
    ContentAdapter.prototype.registerFeature = function (feature) {
        var actionConfig = feature.getAugmentationConfig(this.actionFactories, this.core);
        for (var viewId in actionConfig) {
            var view = this.getViewById(viewId);
            for (var insPoint in actionConfig[viewId]) {
                var actionFactories = actionConfig[viewId][insPoint];
                view.attachActionFactories(actionFactories, insPoint);
            }
        }
    };
    ContentAdapter.prototype.unregisterFeature = function (feature) {
        console.log('unregisterFeature is not implemented');
    };
    ContentAdapter.prototype.insertInlineButtonInToView = function (view, insPoint, config) {
        var _this = this;
        var nodes = document.querySelectorAll(insPoint.selector);
        nodes && nodes.forEach(function (node) {
            if (node.getElementsByClassName(config.class).length > 0)
                return;
            var element = _this.createButtonHtml(config);
            element.addEventListener("click", function (event) {
                var tweetNode = insPoint.toContext(event.target);
                var context = insPoint.context(tweetNode);
                config.exec(context);
            });
            node.appendChild(element);
            console.log('appended button to Timeline');
        });
    };
    ContentAdapter.prototype.createButtonHtml = function (config) {
        return this.createElementFromHTML("<div class=\"" + config.class + " ProfileTweet-action\">\n                    <button class=\"ProfileTweet-actionButton\" type=\"button\">\n                        <div class=\"IconContainer\">\n                            <img height=\"18\" src=\"" + config.img + "\">\n                        </div>\n                        " + (config.label ? "<span class=\"ProfileTweet-actionCount\">\n                            <span class=\"ProfileTweet-actionCountForPresentation\" aria-hidden=\"true\">" + config.label + "</span>\n                        </span>" : '') + "\n                    </button>\n                </div>\n        ");
    };
    ContentAdapter.prototype.createElementFromHTML = function (htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    };
    return ContentAdapter;
}());
