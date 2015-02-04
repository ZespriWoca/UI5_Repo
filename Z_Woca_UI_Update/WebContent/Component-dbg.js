/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.Component");
    jQuery.sap.require("com.zespri.awct.core.Router");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

    /**
     * @class Component
     * @extends sap.ui.core.UIComponent
     * @name com.zespri.awct.Component
     * @classdesc This is the application's root (and only) component. Application level methods and routing, service URLs and other configuration
     *            parameters are maintained here. The <i>com.zespri.awct.shell.AppContainer</i> view is created here, which contains the Unified
     *            Shell and top-level NavContainer that contain all views of the application.
     * 
     * The <i>routing</i> node of the metadata is placed within the <i>config</i> node (instead of being at the same level as the <i>config</i>
     * node) for a particular reason. As the framework doesn't find routing information where it expects to, the Component's router is lazy-loaded in
     * the <i>getRouter</i> method. This allows us to hook in and use our custom Router (@see {@link com.zespri.awct.core.Router}) instead of the
     * standard Router.
     * 
     * @property {object} metadata.config
     * @property {string} metadata.config.resourceBundle
     * @property {object} metadata.config.serviceConfig
     * @property {string} metadata.config.rootContentContainer
     * @property {object} metadata.config.routing
     * @property {object} metadata.oRouteHandler - An instance of the sap.m.routing.RouteMatchedHandler. A reference is stored so that it can be
     *           destroyed during the component's cleanup activities.
     * @property {object} metadata.oView -An instance of the view that represents the contents of this component. A reference is stored so that it can
     *           be destroyed during the component's cleanup activities.
     * @property {object} metadata.mApplicationParameters -A map storing application parameters (returned by a call to the /GetApplicationParameters
     *           function import)
     */

    sap.ui.core.UIComponent.extend("com.zespri.awct.Component",
    /** @lends com.zespri.awct.Component */
    {
        metadata : {
            name : "ZESPRI Allocation Workbench & Collaboration Tool",
            version : "1.0",
            includes : [],
            dependencies : {
                libs : ["sap.m", "sap.ui.layout"],
                components : []
            },
            config : {

                resourceBundle : "i18n/messageBundle.properties",
                serviceConfig : {
                    name : "AWCT",
                    serviceUrl : "/sap/opu/odata/sap/Z_AWCT_SRV"
                },
                rootContentContainer : "unifiedShellNavContainer",
                routing : {
                    config : {
                        viewType : "XML",
                        viewPath : "com.zespri.awct",
                        targetParent : "componentView",
                        targetControl : "unifiedShellNavContainer",
                        targetAggregation : "pages",
                        clearTarget : false,
                        transition : "slide"
                    },
                    routes : [{
                        pattern : "Allocation/EditOrderAllocation/{contextPath}",
                        name : "Allocation/EditOrderAllocation",
                        view : "alloc.view.EditOrderAllocation"
                    }, {
                        pattern : "Collaboration/SupplierOrders",
                        name : "Collaboration/SupplierOrders",
                        view : "collab.view.SupplierOrders"
                    }, {
                        pattern : "Allocation/DeliverySwapListing",
                        name : "Allocation/DeliverySwapListing",
                        view : "alloc.view.DeliverySwapListing"
                    }, {
                        pattern : "Allocation/DeliverySwapCreate",
                        name : "Allocation/DeliverySwapCreate",
                        view : "alloc.view.DeliverySwapCreate"
                    }, {
                        pattern : "Allocation/DeliverySwapDetails/{contextPath}",
                        name : "Allocation/DeliverySwapDetails",
                        view : "alloc.view.DeliverySwapDetails"
                    }, {
                        pattern : "Allocation/DeliveryWorkList",
                        name : "Allocation/DeliveryWorkList",
                        view : "alloc.view.DeliveryWorkList",
                        transition : "show",
                        viewLevel : 0,
                        subroutes : {

                            "Allocation/DeliveryWorkList/Detail" : {
                                pattern : "Allocation/DeliveryWorkList/{contextPath}",
                                name : "Allocation/DeliveryWorkList/Detail",
                                view : "alloc.view.DetailDeliveryWorkList",
                                targetParent : null,
                                targetControl : "idSplitDeliveyLine",
                                targetAggregation : "detailPages",
                                transition : "show",
                                viewLevel : 1
                            },

                            "Allocation/DeliveryWorkList/NoResults" : {
                                pattern : "Allocation/DeliveryWorkList/NoResults/{viewTitle}/{infoText}/{isEmptyView}",
                                name : "Allocation/DeliveryWorkList/NoResults",
                                view : "alloc.view.Empty",
                                targetParent : null,
                                targetControl : "idSplitDeliveyLine",
                                targetAggregation : "detailPages",
                                transition : "show",
                                viewLevel : 1
                            }
                        }

                    }, {
                        pattern : "Tools/OData",
                        name : "Tools/OData",
                        view : "tools.odata.view.ODataRequestCheck"
                    }, {
                        pattern : "Collaboration/SearchForm",
                        name : "Collaboration/SearchForm",
                        view : "collab.view.SearchForm"
                    }, {
                        pattern : "Collaboration/TrackOrders",
                        name : "Collaboration/TrackOrders",
                        view : "collab.view.TrackOrders"
                    }, {
                        pattern : "Collaboration/TrackOrdersSearchForm",
                        name : "Collaboration/TrackOrdersSearchForm",
                        view : "collab.view.TrackOrdersSearchForm"
                    }, {
                        pattern : "Collaboration/TradeOpportunities",
                        name : "Collaboration/TradeOpportunities",
                        view : "collab.view.TradeOpportunities"
                    }, {
                        pattern : "Collaboration/TradeOpportunitiesDetails/{contextPath}",
                        name : "Collaboration/TradeOpportunitiesDetails",
                        view : "collab.view.TradeOpportunitiesDetails"
                    }, {
                        pattern : "Administration/MaintainLibraryText",
                        name : "Administration/MaintainLibraryText",
                        view : "admin.view.MaintainLibraryText"
                    }, {
                        pattern : "Administration/MaintainLibraryText/:viewMode:/:contextPath:",
                        name : "Administration/MaintainLibraryTextDetail",
                        view : "admin.view.LibraryTextDetails"
                    }, {
                        pattern : "Administration/TimeBasedRateMaintenance",
                        name : "Administration/TimeBasedRateMaintenance",
                        view : "admin.view.TimeBasedRateMaintenance"
                    }, {
                        /*
                         * "viewMode" determines whether the view is opened to add a new time rate or to modify existing time rate. viewMode can have
                         * value 'Add' or 'Edit'
                         */
                        pattern : "Administration/TimeBasedRateMaintenance/:viewMode:/:contextPath:",
                        name : "Administration/TimeRateDetail",
                        view : "admin.view.TimeBasedRateDetail"
                    }, {
                        pattern : "Administration/ExceptionRateMaintenance",
                        name : "Administration/ExceptionRateMaintenance",
                        view : "admin.view.ExceptionRateMaintenance"
                    }, {
                        /*
                         * "viewMode" determines whether the view is opened to add a new Exception rate or to modify existing exception rate. viewMode
                         * can have value 'Add' or 'Edit'
                         */
                        pattern : "Administration/ExceptionRateMaintenance/:viewMode:/:contextPath:",
                        name : "Administration/ExceptionRateDetail",
                        view : "admin.view.ExceptionRateDetail"
                    }, {
                        pattern : "Administration/ScheduleRates",
                        name : "Administration/ScheduleRates",
                        view : "admin.view.ScheduleRates"
                    }, {
                        pattern : "Administration/ScheduleRates/{contextPath}",
                        name : "Administration/ScheduleRatesDetail",
                        view : "admin.view.ScheduleRatesDetail"
                    }, {
                        pattern : "Collaboration/PrintOrders",
                        name : "Collaboration/PrintOrders",
                        view : "collab.view.PrintOrders"
                    }, {
                        pattern : "Allocation/SupplyPlan/:DeliveryLineID:",
                        name : "Allocation/SupplyPlan",
                        view : "alloc.view.SupplyPlan"
                    }, {
                        pattern : "Reports/GenerateReports",
                        name : "Reports/GenerateReports",
                        view : "report.view.GenerateReports"
                    }, {
                        pattern : ":all*:", // catchall
                        view : "shell.view.Dashboard", // any request not matching a hash will go to master
                        name : "/" // name used for listening or navigating to this route
                    }]
                }
            }
        },

        /**
         * An instance of the sap.m.routing.RouteMatchedHandler. A reference is stored so that it can be destroyed during the component's cleanup
         * activities.
         * 
         */
        oRouteHandler : null,

        /**
         * An instance of the view that represents the contents of this component. A reference is stored so that it can be destroyed during the
         * component's cleanup activities.
         */
        oView : null,

        /**
         * A map storing application parameters (returned by a call to the /GetApplicationParameters function import)
         */
        mApplicationParameters : null,

        /**
         * Standard UI5 Life-cycle Method Initialize the application component. Tasks performed here include one-time activities like initializing the
         * router and i18n model.
         * 
         * @memberOf com.zespri.awct.Component
         */
        init : function() {
            /* Start of instance member initialization */
            // Private variable to Check whether has roles to access the application
            this._bUserAuthorized = false;
            /* End of instance member initialization */

            // Get the instance of "this" operator .
            var oComponent = this;
            // Call parent constructor.
            sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

            // Get the application's root path
            var sRootPath = jQuery.sap.getModulePath("com.zespri.awct");
            var mConfig = this.getMetadata().getConfig();

            // Set up i18n model (oI18nModel doesn't look good, so making an exception)
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : [sRootPath + "/" + mConfig.resourceBundle]
            });
            this.setModel(i18nModel, "i18n");

            // Create ODataModel with actual service URL. The second argument 'true' adds a $format=json to all requests.
            var oModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.serviceUrl, true);

            // call for count is included in the data request (Separate call is avoided). Also, overriding the standard limit of 100
            // for list
            // bindings. This is needed, because for Macro Simulation, we want to fetch ALL records( >100) (without paging).
            oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
            oModel.setSizeLimit(com.zespri.awct.util.Constants.C_ODATA_MODEL_SIZE_LIMIT);
            this.setModel(oModel);

            // Set the currentUser details model to the component.
            this._setCurrentUserModel();

            // Initialize router
            var oRouter = this.getRouter();
            this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(oRouter);
            window.setTimeout(function() {
                // If User is authorized , then initialize the router.
                if (oComponent._bUserAuthorized) {
                    oRouter.initialize();
                    // Check for current browser support
                    oComponent._checkBrowserSupport();
                }
            }, 0);
        },

        /**
         * Get the current user details and create a model with roles and supplier details .
         * 
         * @memberOf com.zespri.awct.Component
         * @private
         */
        _setCurrentUserModel : function() {
            // Get the instance of "this" operator .
            var oComponent = this;
            // Variable to store user Id
            var sCurrentUserID = null;
            var aSupplierSet = [];

            // Refresh the CSRF token when the component loads
            this.getModel().refreshSecurityToken();

            // Form a JSON with userDetails , roles and allowed activity permissions
            // Read the function import and get the details of current user
            this.getModel().read("/GetApplicationParameters", {

                success : function(oResponse) {
                    var oData = oResponse.GetApplicationParameters;

                    // Store the application parameters
                    oComponent.mApplicationParameters = oData;

                    // User name is returned by the fx import GetApplicationParameters (and not the User entity).. After user details
                    // are read
                    // (suppliers, roles etc.), username will also be set to the 'currentUserDetails' model.
                    var sUserName = com.zespri.awct.util.CommonFormatHelper.formatUserName(oData.FirstName, oData.LastName);

                    // get the USERID
                    sCurrentUserID = oData.UserID;
                    var sPath = "/UserSet('" + sCurrentUserID + "')";
                    // Expand UserSet based on RoleSet and SupplierSet
                    oComponent.getModel().read(sPath, {
                        urlParameters : {
                            "$expand" : "AuthorizationSet,SupplierSet"
                        },
                        success : function(oData) {
                            // Get the supplier details for a user
                            aSupplierSet = oData.SupplierSet.results;

                            // Current Details of the user along with their roles
                            var oCurrentUserDetails = {
                                "UserID" : sCurrentUserID,
                                "UserName" : sUserName,
                                "SupplierSet" : aSupplierSet
                            };

                            // Authorizations Object
                            var oAuthorization = {};
                            oAuthorization = oData.AuthorizationSet.results;
                            oCurrentUserDetails.AuthorizationSet = oAuthorization;

                            // Create the JSON model for the "oCurrentUserDetails" object
                            var oCurrentUserModel = new sap.ui.model.json.JSONModel(oCurrentUserDetails);
                            // Set the model to component with name "currentUserDetails"
                            oComponent.setModel(oCurrentUserModel, "currentUserDetails");

                            // Now that all initial backend calls are done, the application is ready.
                            sap.ui.getCore().byId("componentView").setBusy(false);
                            oComponent._bUserAuthorized = true;
                        },
                        error : function(oError) {
                            // Show the error dialog
                            // Component has not yet been initialized , hence it would not be set to RootComponent. Wait till component is set to
                            // RootComponent, otherwise it will fail
                            window.setTimeout(function() {
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            }, 0);

                            // Destroy the AppContainer
                            sap.ui.getCore().byId("componentView").destroy();
                            oComponent._bUserAuthorized = false;
                        },
                        async : false
                    });
                },
                error : function(oError) {
                    // Show the error dialog
                    // Component has not yet been initialized , hence it would not be set to RootComponent. Wait till component is set to
                    // RootComponent, otherwise it will fail
                    window.setTimeout(function() {
                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                    }, 0);

                    // Destroy the AppContainer
                    sap.ui.getCore().byId("componentView").destroy();
                    oComponent._bUserAuthorized = false;
                },
                async : false
            });
        },
        /**
         * Standard method hook. Render the content for the component. The view that is instantiated here contains the Unified Shell and NavContainer
         * that contain the entire application.
         * 
         * @memberOf com.zespri.awct.Component
         */
        createContent : function() {
            var oViewData = {
                oComponent : this
            };
            this.oView = sap.ui.view("componentView", {
                viewName : "com.zespri.awct.shell.view.AppContainer",
                type : sap.ui.core.mvc.ViewType.XML,
                viewData : oViewData,
                busyIndicatorDelay : 0,
                busy : true
            });
            return this.oView;
        },

        /**
         * Returns either <i>true</i> or <i>false</i> to indicate whether the application's current view has unsaved changes. This is determined by
         * reading a 'dirty' flag that each controller has. It is the responsibility of each controller implementation to set/unset this flag as
         * required.
         * 
         * When a navigation is trigerred, the router first checks if the current view may have unsaved changes (by calling this method) and if there
         * are, it lets the current view's controller handle the situation (by, for example, showing a 'Data loss popup')
         * 
         * @memberOf com.zespri.awct.Component
         * @returns {Boolean}
         */
        isCurrentViewDirty : function() {
            // Get a reference to the NavContainer that contains the various views.
            var sTargetParent = this.getMetadata().getConfig().routing.config.targetParent;
            var sTargetControl = this.getMetadata().getConfig().routing.config.targetControl;
            var oNavContainer = sap.ui.getCore().byId(sTargetParent).byId(sTargetControl);

            // Get the current view and check if it might have unsaved changes
            var oCurrentView = oNavContainer.getCurrentPage();
            if (!oCurrentView) {
                return false;
            } else {
                return oCurrentView.getController().getHasUnsavedChanges();
            }

        },

        /**
         * The standard <i>getRouter</i> method is overridden so that our custom router is instantiated (lazy loaded). While this doesn't break
         * anything in current or future framework versions, newer versions have a <i>routerClass</i> Component config property to handle this in a
         * neater way.
         * 
         * @memberOf com.zespri.awct.Component
         * @returns {zsp.ui.awct.core.Router}
         */
        getRouter : function() {
            if (!this._oRouter) {
                var aRoutes = this.getMetadata().getConfig().routing.routes;
                var oConfig = this.getMetadata().getConfig().routing.config;
                var oOwner = this;
                this._oRouter = new com.zespri.awct.core.Router(aRoutes, oConfig, oOwner);
            }
            return this._oRouter;
        },

        /**
         * Returns a map of application parameters (the results of /GetApplicationParameters function import call. This is invoked exactly once in
         * each session)
         * 
         * @memberOf com.zespri.awct.Component
         * @returns {Object} Map of application parameters
         */
        getApplicationParameters : function() {
            return this.mApplicationParameters;
        },

        /**
         * Lifecyle method for cleanup activities.
         * 
         * @memberOf com.zespri.awct.Component
         */
        destroy : function() {
            // Destroy instances used by our Component
            if (this.oRouteMatchedHandler) {
                this.oRouteMatchedHandler.destroy();
            }

            if (this.oView) {
                this.oView.destroy();
            }
            sap.ui.core.UIComponent.destroy.apply(this, arguments);
        },
        /**
         * This method will check the current browser compatibility and return true if it is supported , else false.
         * 
         * @private
         * @memberOf com.zespri.awct.Component
         * @returns {Boolean} True -> If current browser is supported False -> If current browser is not supported
         */
        _checkBrowserSupport : function() {
            // Get the current browser object
            var oCurrentBrowser = sap.ui.Device.browser;
            // Current working Browser Name
            var sCurrentBrowserName = oCurrentBrowser.name;
            // Current working Browser Version
            var fCurrentBrowserVersion = oCurrentBrowser.version;
            // Flag to indicate whether current browser is supported
            var bIsCurrentBrowserSupported = false;

            /* START of Supported Browsers check */

            // Microsoft Internet Explorer : Version should be greater than or equal to 9
            // Google Chrome , No Version check needed
            // Mozilla FireFox : version should be greater than or equal to 32
            if (((sCurrentBrowserName === "ie") && (fCurrentBrowserVersion >= 9)) || (sCurrentBrowserName === "cr") ||
                    (sCurrentBrowserName === "ff" && fCurrentBrowserVersion >= 32)) {
                bIsCurrentBrowserSupported = true;
            }
            // Safari
            else if (sCurrentBrowserName === "sf") {
                // Mobile Safari : Version 5.1 and above
                if (oCurrentBrowser.mobile && (fCurrentBrowserVersion >= 5.1)) {
                    bIsCurrentBrowserSupported = true;
                }
                // Safari : Version 7.1 and Above
                else if (!oCurrentBrowser.mobile && (fCurrentBrowserVersion >= 7.1)) {
                    bIsCurrentBrowserSupported = true;
                }
            } else {
                bIsCurrentBrowserSupported = false;
            }
            /* END of Supported Browsers check */

            // If the current browser is not supported show a warning message
            if (!bIsCurrentBrowserSupported) {
                // Warning Text
                var sUnSupportedWarningText = com.zespri.awct.util.I18NHelper.getText("TXT_CURRENT_BROWSER_NOT_SUPPORTED_WARNING_TEXT");
                // Show Warning Toast
                com.zespri.awct.util.NotificationHelper.showErrorToast(sUnSupportedWarningText);
            }
        }
    });
})();
