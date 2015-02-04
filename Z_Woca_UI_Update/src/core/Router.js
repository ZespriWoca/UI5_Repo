(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.core.Router");
    jQuery.sap.require("sap.ui.core.routing.Router");

    /**
     * @classdesc This is the application component's custom router. It is necessary as it introduces helper methods that are lacking in the standard Router.
     * Also, it introduces validation logic just before any navigation, to check if there is the navigation-source view might have unsaved changes. If
     * this is the case, the <i>onBeforeNavigationWithUnsavedChanges</i> event is fired, letting the controller react by, for example, showing a
     * 'Unsaved data will be lost' popup.
     * 
     * If the router detects that the current view may have unsaved changes, the <i>onBeforeNavigationWithUnsavedChanges</i> event is fired and two
     * callbacks are passed as event parameters. One callback to allow navigation, and one to prevent it. The controller is free to invoke either of
     * the callbacks and thus has a chance to prevent navigation afer it has already been trigerred.
     * 
     * @class
     * @name com.zespri.awct.core.Router
     */
    sap.ui.core.routing.Router.extend("com.zespri.awct.core.Router", /** @lends com.zespri.awct.core.Router */
    {
        // This map temporarily stores key (route name) value (custom object) pairs of routing requests with custom data, till they are passed to the
        // target view.
        _mNavToComplexData : {},

        /**
         * Triggers a 'back' navigation. Also includes validation to check if the current view has the 'dirty flag' set - and accordingly allow the
         * controller to cancel the navigation after it has been triggered
         * 
         * @memberOf com.zespri.awct.core.Router
         */
        navBack : function() {
            // Prepare a function to define what to do if the navigation is to be allowed.
            var oRouter = this;
            var fnAllowNavigation = function() {
                var oHistory = sap.ui.core.routing.History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                // The history contains a previous entry
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                    oRouter.fireNavigationCompleted();
                }
            };

            // Validate and navigate as needed.
            this._validateAndNavigate(fnAllowNavigation);
        },

        /**
         * The standard <i>navTo</i> method is overridden to introduce additional validation to check the 'dirty flag' of the current view - and
         * accordingly allow the controller to cancel the navigation after it has been triggered.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {String}
         *            sName The name of the route to be applied.
         * @param {Object}
         *            oParameters The parameters to be passed to the target view. Property with name 'customData' will be passed to the target view
         *            without affecting the URL hash.
         * @param {Boolean}
         *            bReplace Indicates whether or not the current contents of the target aggregation should be replaced by this navigation.
         */
        navTo : function() {
            // Prepare a function to define what to do if the navigation is to be allowed.
            var aNavArguments = arguments;
            var oRouter = this;
            var fnAllowNavigation = function() {
                // If route arguments have a 'customData' node, then we need to pass this to the target view without affecting the hash.
                if (aNavArguments[1] && aNavArguments[1].customData) {
                    var sRouteName = aNavArguments[0];
                    var oCustomData = aNavArguments[1].customData;

                    // Store this custom data in a map. We will pass this to the view later.
                    oRouter._mNavToComplexData[sRouteName] = oCustomData;

                    // Remove this from aNavArguments before passing it to navTo
                    delete aNavArguments[1].customData;
                }

                sap.ui.core.routing.Router.prototype.navTo.apply(oRouter, aNavArguments);
                oRouter.fireNavigationCompleted();
            };

            // Validate and navigate as needed.
            this._validateAndNavigate(fnAllowNavigation);
        },

        /**
         * Removes a view (by viewname) from the routers cache. The standard UI5 router doesn't have a public method for this currently. (is
         * introduced from 1.22 onwards)
         * 
         * @param {String}
         *            sViewName The name of the view to remove from the router's cache
         */
        removeViewFromCache : function(sViewName) {
            this._oViews[sViewName] = null;
        },

        /**
         * Overriding the standard
         * 
         * @returns {com.zespri.awct.core.Router}
         */
        fireRoutePatternMatched : function(mArguments) {
            // Is there custom data that needs to be passed to the target view? If yes, attach it to mArguments before passing it to the target view.
            var sRouteName = mArguments.name;
            if (this._mNavToComplexData[sRouteName]) {
                /* jshint -W024 */
                mArguments.arguments.customData = this._mNavToComplexData[sRouteName];
                /* jshint +W024 */
                delete this._mNavToComplexData[sRouteName];
            }

            // Fire!
            this.fireEvent("routePatternMatched", mArguments);
            return this;
        },

        /**
         * Validates the requested navigation by checking if the current view has unsaved changes. If it does, then the
         * 'onBeforeNavigationWithUnsavedChanges' event is triggered. This event is handled by the 'navigation from' view's controller. The event
         * parameters consists of 1 callback that the controller should call if the navigation should be allowed.
         * 
         * This method is used by both 'navBack' and 'navTo'. The behaviour differs only in the outcome in case the navigation is to be allowed. They
         * pass different functions to 'fnAllowNavigation'
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Function}
         *            fnAllowNavigation The function to be executed if the navigation is to be allowed.
         * @private
         */
        _validateAndNavigate : function(fnAllowNavigation) {
            // Check if the current view might have unsaved changes.
            var bCurrentViewDirty = sap.ui.getCore().getRootComponent().isCurrentViewDirty();
            if (!bCurrentViewDirty) {
                fnAllowNavigation();
                return;
            }

            // Since the current view is dirty, we need to let the view's controller handle the situation.
            // Fire the event, so that the controller can respond as needed.
            this.fireOnBeforeNavigationWithUnsavedChanges({
                fnAllowNavigation : fnAllowNavigation
            });
        },

        /**
         * Fires the <i>onBeforeNavigationWithUnsavedChanges</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Object}
         *            mArguments Event parameters as a map.
         */
        fireOnBeforeNavigationWithUnsavedChanges : function(mArguments) {
            this.fireEvent("onBeforeNavigationWithUnsavedChanges", mArguments);
        },

        /**
         * Registers a listener for the <i>onBeforeNavigationWithUnsavedChanges</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Object}
         *            oData
         * @param {Function}
         *            fnHandler The event handler
         * @param {Object}
         *            oListener The event listener object
         */
        attachOnBeforeNavigationWithUnsavedChanges : function(oData, fnHandler, oListener) {
            this.attachEvent("onBeforeNavigationWithUnsavedChanges", oData, fnHandler, oListener);
        },

        /**
         * Unregisters a listener for the <i>onBeforeNavigationWithUnsavedChanges</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Function}
         *            fnHandler The event handler
         * @param {Object}
         *            oListener The event listener object
         */
        detachOnBeforeNavigationWithUnsavedChanges : function(fnHandler, oListener) {
            this.detachEvent("onBeforeNavigationWithUnsavedChanges", fnHandler, oListener);
        },

        /**
         * Fires the <i>navigationCompleted</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Object}
         *            mArguments Event parameters as a map
         */
        fireNavigationCompleted : function(mArguments) {
            this.fireEvent("navigationCompleted", mArguments);
        },

        /**
         * Registers a listener for the <i>navigationCompleted</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Object}
         *            oData
         * @param {Function}
         *            fnHandler Event handler
         * @param {Object}
         *            oListener Event listener object
         */
        attachNavigationCompleted : function(oData, fnHandler, oListener) {
            this.attachEvent("navigationCompleted", oData, fnHandler, oListener);
        },

        /**
         * Unregisters a listener for the <i>navigationCompleted</i> event.
         * 
         * @memberOf com.zespri.awct.core.Router
         * @param {Function}
         *            fnHandler The event handler
         * @param {Object}
         *            oListener The listener object
         */
        detachNavigationCompleted : function(fnHandler, oListener) {
            this.detachEvent("navigationCompleted", fnHandler, oListener);
        }
    });
})();
