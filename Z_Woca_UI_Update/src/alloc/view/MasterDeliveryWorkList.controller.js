(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This is the view controller for master page . Display the delivery work list along with other functionalities like searching ,
     *            sorting , grouping and filtering. By Default , sorting is applied on status along with group = true property and filters are applied
     *            for status = "Not Started" and "In Progress". View SettingsDialog is created for sorting and filtering on the master
     *            DeliveryWorkList.
     * 
     * @class
     * @name com.zespri.awct.alloc.view.MasterDeliveryWorkList
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.alloc.view.MasterDeliveryWorkList",
                    /** @lends com.zespri.awct.alloc.view.MasterDeliveryWorkList */
                    {
                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private Instance variable to track custom filters applied
                            this._bCustomFiltersApplied = false;
                            // Private Array for custom filters
                            this._aCustomFilters = [];
                            // View settingsDialog control Instance for sorting and filtering
                            this._oViewSettingsDialog = null;
                            // instance to store view settings dialog opened or not ..
                            this._bViewSettingsDialogChanged = null;
                            // array to store the selected filters from the view settings dialog
                            this._aFiltersFromSettingsDialog = [];
                            // array to store the selected sorters from the view settings dialog
                            this._aSortersFromSettingsDialog = [];
                            // using jquery promise to keep track of asynchronous calls . Promise will be sent for each backend call .
                            // This promise variable is used to track loading of deliveryWorkList
                            // once delivery worklist is loaded , corresponding detail page will be displayed
                            this._$deliveryWorkListReadPromise = null;
                            // Create deferred objects before backend call
                            this._$deliveryWorkListReadDeferred = null;
                            // Flag to indicate select first ListItem, this flag will be set when Master-Detail page is accessed sequentially.
                            // After listening the route , it will be set to false .
                            // If deliveryWorkList is accessed by direct URL, this flag will remain false and DeliveryID from the route ContextPath
                            // will be selected.
                            this._bSelectFirstItem = true;
                            // String which contains the RouteDelivery ID to be checked against the master list item
                            this._sRoutedDeliveryID = "";
                            // Flag to mention whether Master list item is clicked or not.
                            // This flag will set once listItem is clicked and reset to false once route is navigated to corresponding views.
                            this._bListItemClicked = false;
                            // If Current Route is "Allocation/DeliveryWorkList" , for the first time " _sLastRouteIDBeforeNoResults " will be null
                            // then _bSelectFirstItem will be true and first ListItem will be selected .
                            // When we navigate to the "NoResults" view , "_sLastRouteIDBeforeNoResults" string will be changed to "routeChanged"
                            // Status .
                            // If we encounter the same route "Allocation/DeliveryWorkList" due to backNavgiation , we will check the
                            // "_sLastRouteIDBeforeNoResults"
                            // string
                            // and if it has "routeChanged" status , we do history.back() to avoid inconsistent detail page display.
                            // It also used to store the last routeDeliveryID once detail page navigates to NoResults View and do corresponding
                            // action.
                            this._sLastRouteIDBeforeNoResults = null;
                            // Busy Dialog Instance while navigating from different view (Status of the Deliveries would change , so blocking the user
                            // to do actions while refreshing the list)
                            this._oBusyDialog = new sap.m.BusyDialog();
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private variable to indicate if view is loaded with "Allocation/DeliveryWorkList" URL (first time)
                            this._bWorkListLoadedFirstTime = false;
                            // Private variable to indicate shipment Number is filtered
                            this._bShipmentNumberFiltered = false;
                            /* END of instance member initialization */

                            // Manage NoData Texts , listen for list update EVENT
                            com.zespri.awct.util.CommonHelper.manageNoDataText(this._getList());

                            // Call this method once data is loaded
                            this._getList().attachUpdateFinished(this._onDataLoaded, this);
                            var oView = this.getView();
                            var oController = this;

                            // Check the incoming Route
                            this
                                    .getRouter()
                                    .attachRoutePatternMatched(
                                            function(oEvent) {
                                                var oList = this._getList();
                                                var sCurrentRoute = oEvent.getParameter("name");

                                                // Check incoming route . If route has "DeliveryWorkList" Path, check for custom data and bind the
                                                // items to the list
                                                if (sCurrentRoute.indexOf("Allocation/DeliveryWorkList") !== -1) {

                                                    // Check the current user authorizations
                                                    if (!oController._bUserAuthorized) {
                                                        com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                                .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));

                                                        return;
                                                    }
                                                    // Get the customData from the route
                                                    if (oEvent.getParameter("arguments").customData) {
                                                        // Info bar text to indicate filters applied
                                                        var sInfobarStatus = "";

                                                        // If custom data has filters , apply it to the delivery worklist
                                                        var oCustomFilter = oEvent.getParameter("arguments").customData.filters;

                                                        if (oCustomFilter) {
                                                            // Status
                                                            if (oCustomFilter.Status) {
                                                                // Clear the search field , if navigated from dashboard
                                                                oController.byId("deliveryWorkListSearch").setValue("");

                                                                // Set view Settings dialog Change flag to false , because we are manually setting the view settings filter list items selected from customData
                                                                oController._bViewSettingsDialogChanged = false;
                                                                // Clear customfilters Array
                                                                oController._aCustomFilters = [];

                                                                $.each(oCustomFilter.Status, function(iIndex, sStatus) {
                                                                    oController._aCustomFilters.push(new sap.ui.model.Filter("Status",
                                                                            sap.ui.model.FilterOperator.EQ, sStatus));
                                                                });
                                                                // Since the view settings dialog is not opened ,manually Form the infobar text
                                                                // If both released and locked deliveries are to be shown
                                                                if ((oCustomFilter.Status.indexOf(com.zespri.awct.util.Enums.DeliveryStatus.Released) !== -1) &&
                                                                        (oCustomFilter.Status
                                                                                .indexOf(com.zespri.awct.util.Enums.DeliveryStatus.Locked) !== -1)) {
                                                                    sInfobarStatus = com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_CUSTOM_DATA_STATUS_TEXT");
                                                                    // Change the customFilters Applied flag to true
                                                                    oController._bCustomFiltersApplied = true;
                                                                }
                                                                // If only locked deliveries are to be shown
                                                                else if (oCustomFilter.Status
                                                                        .indexOf(com.zespri.awct.util.Enums.DeliveryStatus.Locked) !== -1) {
                                                                    sInfobarStatus = com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_CUSTOM_DATA_LOCKED_STATUS_TEXT");
                                                                    // Change the customFilters Applied flag to true
                                                                    oController._bCustomFiltersApplied = true;
                                                                }
                                                            }
                                                            // Supply GT Demand
                                                            // if "IsSupplyGtDemandFlag" has a value False , "IF" condition will fail . So,
                                                            // "toString()"
                                                            // method is used
                                                            if (oCustomFilter.IsSupplyGtDemandFlag !== undefined) {
                                                                // Since the view settings dialog is not opened ,manually Form the infobar text
                                                                // If status is filter is already applied / selected , preAppend the status info bar
                                                                // text
                                                                // Else , just get the supply greater than demand text as infobar text
                                                                if (sInfobarStatus) {
                                                                    sInfobarStatus = sInfobarStatus +
                                                                            ", " +
                                                                            com.zespri.awct.util.I18NHelper
                                                                                    .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_CUSTOM_DATA_SUPPLY_GT_DEMAND_TEXT");
                                                                } else {
                                                                    sInfobarStatus = com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_CUSTOM_DATA_SUPPLY_GT_DEMAND_TEXT");
                                                                }

                                                                oController._aCustomFilters.push(new sap.ui.model.Filter("IsSupplyGtDemandFlag",
                                                                        sap.ui.model.FilterOperator.EQ, oCustomFilter.IsSupplyGtDemandFlag));
                                                                // Change the customFilters Applied flag to true
                                                                oController._bCustomFiltersApplied = true;

                                                            }

                                                            // call _bindDeliveryList to bind the Master Delivery Work List based on default sorters
                                                            // and
                                                            // custom filters
                                                            this._bindDeliveryList("/DeliveryHeaderSet", oController._aCustomFilters, this
                                                                    ._getDefaultSorter());

                                                            // Initialize the view settings dialog and preselect the status and Supply GT Demand list
                                                            // items (which are coming from
                                                            // custom data)
                                                            this._initialiseViewSettingsDialog(oCustomFilter);

                                                            // Show info bar with filtering status
                                                            // When view settings dialog filters are cleared and nagivation happens , info bar
                                                            // visiblity
                                                            // will ba false.
                                                            // So setting it to true , to ensure it will be visible with text ("Status (Locked)" or
                                                            // "Supply > Demand")
                                                            this.byId("deliveryListFilterBar").setVisible(true);
                                                            this.byId("deliveryListFilterBar").setVisible(true);
                                                            // INFO Bar Text: Status - "LOCKED"
                                                            this.byId("deliveryListFilterBarLabel").setTooltip(sInfobarStatus);
                                                            this.byId("deliveryListFilterBarLabel").setText(sInfobarStatus);
                                                        }

                                                    } else {
                                                        // If the route doesnt have custom data , then check whether delivery worklist has been loaded
                                                        // If No , then bind the delivery worklist items to the list
                                                        if (!oList.getBinding("items")) {
                                                            // call _bindDeliveryList to bind the Master Delivery Work List based on default sorters
                                                            // and filters
                                                            this._bindDeliveryList("/DeliveryHeaderSet", this._getDefaultFilter(), this
                                                                    ._getDefaultSorter());

                                                            // Initialize the view settings dialog with statuses "Not Started" & "In Progress"
                                                            // preselected
                                                            // Selection has done in XML
                                                            this._initialiseViewSettingsDialog(null);

                                                            // Info Bar text : Status - "Not Started" & "In Progress"
                                                            this.byId("deliveryListFilterBar").setVisible(true);
                                                            this.byId("deliveryListFilterBarLabel").setTooltip(
                                                                    com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_TEXT"));
                                                            this.byId("deliveryListFilterBarLabel").setText(
                                                                    com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_ALLOCATION_DELIVERYWORLIST_MASTER_FILTERING_TEXT"));
                                                        }
                                                    }
                                                }

                                                // Listen to the SplitContianer route and set the _bSelectFirstItem flag true, byDefault show first
                                                // Item in the detail page
                                                if (oEvent.getParameter("name") === "Allocation/DeliveryWorkList") {
                                                    if (this._sLastRouteIDBeforeNoResults === "routeChanged") {
                                                        history.back();
                                                        return;
                                                    } else {
                                                        // if route is "Allocation/DeliveryWorkList", by default first List item will be selected
                                                        this._bSelectFirstItem = true;
                                                        this._bListItemClicked = true;
                                                        // Indicate app is loaded 1st time with URL "Allocation/DeliveryWorkList"
                                                        this._bWorkListLoadedFirstTime = true;
                                                    }
                                                }
                                                // Check the route is for detail page
                                                else if (oEvent.getParameter("name") === "Allocation/DeliveryWorkList/Detail") {
                                                    // Change the 1st time loading flag
                                                    this._bWorkListLoadedFirstTime = false;
                                                    // Refresh the list when this view is navigated from other views and list if list is already
                                                    // loaded
                                                    // If the delivery worklist item is not clicked and firstItem flag is false , then refresh the
                                                    // list
                                                    if (!this._bListItemClicked && !this._bSelectFirstItem) {

                                                        // Create deferred and promise objects before actually making the backend call
                                                        this._$deliveryWorkListReadDeferred = null;
                                                        this._$deliveryWorkListReadDeferred = jQuery.Deferred();
                                                        this._$deliveryWorkListReadPromise = this._$deliveryWorkListReadDeferred.promise();
                                                        this._oBusyDialog.open();

                                                        oList.getBinding("items").refresh(true);
                                                    }
                                                    // Promise variable to track asynchronous call for reading specific deliveryHeaderID when user
                                                    // enters the direct URL
                                                    var $deliveryHeaderItemReadPromise;

                                                    // Create deferred and promise objects before actually making the backend call
                                                    var $deliveryHeaderItemReadDeferred = jQuery.Deferred();
                                                    $deliveryHeaderItemReadPromise = $deliveryHeaderItemReadDeferred.promise();

                                                    // Set the _bSelectFirstItem to false , because we will get the DeliveryHeaderID to be selected in
                                                    // the master list
                                                    // from the context path of route URL .
                                                    this._bSelectFirstItem = false;
                                                    // Create the context from the RouteArguments
                                                    var oContext = new sap.ui.model.Context(oView.getModel(), '/' +
                                                            oEvent.getParameter("arguments").contextPath);
                                                    // Get the DeliveryHeaderID from the route URL
                                                    this._sRoutedDeliveryID = oContext.getProperty("DeliveryHeaderID");
                                                    // If DeliveryHeaderID from the route URL is undefined or null , get the DeliveryHeaderID
                                                    // using the getJSONModelForRead Helper method .
                                                    if (!this._sRoutedDeliveryID) {
                                                        // Create the path for calling the oModel().read method
                                                        var sPath = "/" + oEvent.getParameter("arguments").contextPath;
                                                        // Success function for oModel().read method
                                                        var fnSuccess = function(oData) {

                                                            oController._sRoutedDeliveryID = oData.DeliveryHeaderID;
                                                            // Resolve deferred object
                                                            $deliveryHeaderItemReadDeferred.resolve();
                                                        };
                                                        // Error function for oModel().read method
                                                        var fnError = function(oError) {
                                                            // Error Dialog
                                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                                                            // Navigate to Emtpy View
                                                            var sInfoText = com.zespri.awct.util.I18NHelper
                                                                    .getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_INFO_DELIVERY_TEXT");
                                                            var sViewTitle = com.zespri.awct.util.I18NHelper
                                                                    .getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_VIEW_TITLE");
                                                            oController._navToEmptyView(sViewTitle, sInfoText, false);
                                                            oController._oBusyDialog.close();
                                                        };

                                                        // call oDataModel Read method with parameters defined above
                                                        this.getView().getModel().read(sPath, {
                                                            success : fnSuccess,
                                                            error : fnError
                                                        });

                                                        // When all the asynchronous calls done (resolved), display the corresponding the detail page.
                                                        jQuery.when(oController._$deliveryWorkListReadPromise, $deliveryHeaderItemReadPromise).done(
                                                                function() {
                                                                    // Now Check whether DeliveryID from contextPath of the route is from master list
                                                                    // or it matches with the
                                                                    // _sLastRouteIDBeforeNoResults (Saved routeID when detail page is navigated
                                                                    // NoResults View) and proceed with
                                                                    // corresponding view navigation
                                                                    oController._updateViewBasedOnRoute();
                                                                });

                                                    } else {
                                                        // Now Check whether DeliveryID from contextPath of the route is from master list or it
                                                        // matches with the
                                                        // _sLastRouteIDBeforeNoResults (Saved routeID when detail page is navigated NoResults View)
                                                        // and proceed with
                                                        // corresponding view navigation

                                                        // When all the asynchronous calls done (resolved), display the corresponding the detail page.
                                                        jQuery.when(oController._$deliveryWorkListReadPromise).done(function() {

                                                            if (!oController._bListItemClicked) {
                                                                oController._updateViewBasedOnRoute();
                                                            } else {
                                                                oController._bListItemClicked = false;
                                                            }
                                                            oController._oBusyDialog.close();
                                                        });
                                                    }
                                                }
                                                // Listen for NoResults route
                                                else if (oEvent.getParameter("name") === "Allocation/DeliveryWorkList/NoResults") {
                                                    // Change the 1st time loading flag
                                                    this._bWorkListLoadedFirstTime = false;
                                                    var oArguments = oEvent.getParameter("arguments");
                                                    // check whether the NoResult view is empty page
                                                    if (oArguments.isEmptyView === "true") {
                                                        // if List Item is selected and detail page shows Empty View , do history.back()
                                                        if (oList.getSelectedItem()) {
                                                            history.back();
                                                            // change the status of the variable , to indicate route has changed and ListItem is
                                                            // filtered or missing in the
                                                            // current Master DeliveyWorkList
                                                            this._sLastRouteIDBeforeNoResults = "routeChanged";
                                                            return;
                                                        }
                                                    } else {
                                                        // Info with "Select a delivery to view more results" empty page, remove the listItem
                                                        // selections and
                                                        // save the deliveryHeaderID in "_sLastRouteIDBeforeNoResults" for corresponding actions
                                                        oList.removeSelections(true);
                                                        this._sLastRouteIDBeforeNoResults = this._sRoutedDeliveryID;
                                                    }
                                                }
                                            }, this);
                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        onBeforeRendering : function() {
                            // Check user authorizations
                            if (!com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                if (this.byId("masterPage")) {
                                    this.byId("masterPage").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This method handles the routing of delivery workList . It checks the lastRouteID with the current one to remove loop hole
                         * during routing . If lastRouteID and current one is same , it will skip the current navigation and change the browser
                         * history one back . Else , it will check the current RouteID in the masterWorkList and set it to show the details .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _updateViewBasedOnRoute : function() {
                            // Check for the lastRouteID and current RouteID
                            if (this._sLastRouteIDBeforeNoResults === this._sRoutedDeliveryID) {
                                history.back();
                                // change the status of the variable , to indicate route has changed and ListItem is filtered or missing in the
                                // current Master
                                // DeliveyWorkList
                                this._sLastRouteIDBeforeNoResults = "routeChanged";
                                return;
                            } else {
                                // Get the ListItem for the DeliveryHeaderID from the contextPath and If it is null , it will call NoResults Page
                                // , Else it will
                                // select the listItem from the master List .
                                this._selectListItemBasedOnRoute();
                            }
                        },
                        /**
                         * This method get the ListItem for the DeliveryHeaderID from the contextPath and If it is null , it will call NoResults Page ,
                         * Else it will select the listItem from the master List .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _selectListItemBasedOnRoute : function() {
                            var oList = this._getList();
                            // get the ListItem for the DeliveryHeaderID from the Route
                            var oItem = this._getListItemFromMasterList(this._sRoutedDeliveryID, oList);
                            // if oItem is not null , select the returned ListItem.
                            if (oItem) {
                                this._setSelectedListItem(oItem);

                                // Scroll to the selected delivery Item in the delivery WorkList
                                // If direct URL is entered in the address bar , scroll to the corresponding delivery in the list

                                if (oItem.getDomRef() && jQuery.device.is.desktop) {
                                    // Get the position of selected Item in the list
                                    var iSelectedItemDomPosition = oItem.getDomRef().offsetTop;

                                    // get the DOM Ref of delivery workList in the master page.
                                    var deliveryWorkListDom = oList.getParent().getDomRef().getElementsByTagName("section")[0];

                                    // Scroll the deliveryWorkList to the selected Item position
                                    deliveryWorkListDom.scrollTop = iSelectedItemDomPosition;
                                }
                            } else {
                                // if oItem is null , show the NoResults page with message "Select a Delivery to view more Details"
                                var sInfoText = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_INFO_DELIVERY_TEXT");
                                var sViewTitle = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_VIEW_TITLE");
                                this._navToEmptyView(sViewTitle, sInfoText, false);
                            }
                        },

                        /**
                         * This method returns the instance of the Master Delivery List
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * 
                         * @returns {sap.m.List}
                         * 
                         */
                        _getList : function() {
                            return this.getView().byId("deliveryList");
                        },

                        /**
                         * This method set the default filters required for the Master Delivery List. The filters include status of "Not Started" and
                         * "In Progress".
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @returns {Array}
                         */
                        _getDefaultFilter : function() {
                            var aFilters = [];
                            var oFilterOne = new sap.ui.model.Filter("Status", 'EQ', com.zespri.awct.util.Enums.DeliveryStatus.NotStarted);
                            aFilters.push(oFilterOne);
                            var oFilterTwo = new sap.ui.model.Filter("Status", 'EQ', com.zespri.awct.util.Enums.DeliveryStatus.InProgress);
                            aFilters.push(oFilterTwo);
                            return aFilters;
                        },

                        /**
                         * This method set the default sorters for grouping the Master Delivery List. Sorting and grouping is based on the Status .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @returns {Array}
                         */
                        _getDefaultSorter : function() {
                            var aSorters = [];
                            var oSorter = new sap.ui.model.Sorter({
                                path : "Status",
                                descending : false,
                                group : true
                            });

                            var oDeliveryHeaderIDSorter = new sap.ui.model.Sorter({
                                path : "DeliveryHeaderID",
                                descending : false
                            });
                            aSorters.push(oSorter);
                            aSorters.push(oDeliveryHeaderIDSorter);
                            return aSorters;
                        },

                        /**
                         * This method update the master delivery list title with count. It will check for the pagination . If list is paginated, it
                         * will take the count from growingInfo total. Else from the total items length property.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _updateListTitle : function() {
                            var oList = this._getList();
                            var iCount = 0;
                            iCount = oList.getBinding("items").iLength;
                            this.getView().byId("masterPage").setTitle(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_MASTER_PAGE_HEADER", [iCount]));
                        },
                        /**
                         * This method will be triggered once the data has been loaded . This method will fire the first list item selection to show
                         * the detail delivery for the first item and check the count of list items , if count is 0 , it will navigate to the empty
                         * view .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _onDataLoaded : function() {
                            var oList = this._getList();
                            var iCount = oList.getBinding("items").getLength();

                            // Update the header count
                            this._updateListTitle();

                            // if Count is zero , navigate to empty view with infoText
                            if (iCount === 0) {
                                var sViewTitle = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_VIEW_TITLE");
                                this._navToEmptyView(sViewTitle, " ", true);
                            } else {
                                // check for _bSelectFirstItem == true. If yes , then select the first ListItem from the master list.
                                if (this._bSelectFirstItem) {
                                    // Fire the first list item press , to show it in detail page by default
                                    this._setFirstSelection();
                                }
                            }
                            // Resolve deferred object
                            this._$deliveryWorkListReadDeferred.resolve();
                        },

                        /**
                         * 
                         * This method will bind the data to the master delivery list.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {String}
                         *            sItemPath The AggregationPath for doing bindAggregation
                         * @param {Array}
                         *            aFilters Contains array of Filters provided by the function call
                         * @param {Array}
                         *            aSorters Contains array of sorters provided by the function call
                         */
                        _bindDeliveryList : function(sItemPath, aFilters, aSorters) {
                            var oList = this._getList();
                            this._bSelectFirstItem = true;

                            // Create deferred and promise objects before actually making the backend call
                            this._$deliveryWorkListReadDeferred = jQuery.Deferred();
                            this._$deliveryWorkListReadPromise = this._$deliveryWorkListReadDeferred.promise();

                            oList.bindAggregation("items", {
                                path : sItemPath,
                                factory : jQuery.proxy(this._createObjectListItem, this),
                                sorter : aSorters,
                                filters : aFilters,
                                groupHeaderFactory : jQuery.proxy(this._createGroupHeader, this)
                            });

                        },
                        /**
                         * Factory function for creating list items for the Master list.This is required so that "Loading..." text is visible during
                         * the first load.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _createObjectListItem : function() {
                            return sap.ui.xmlfragment("com.zespri.awct.alloc.fragment.DeliveryWorkListMasterListItemTemplate", this);
                        },

                        /**
                         * Factory function for creating groupHeaderList item (status grouping) This method will create the text of the group header
                         * to plain texts from keys .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.base.Object}
                         *            oGroup
                         * @returns {sap.m.GroupHeaderListItem}
                         */
                        _createGroupHeader : function(oGroup) {
                            // variable to hold the status text
                            var sTitle = "";
                            // change the group header text based on status code
                            switch (oGroup.key) {
                                case com.zespri.awct.util.Enums.DeliveryStatus.NotStarted :
                                    // Case for Not Started
                                    sTitle = com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ALLOCATION_DELIVERYWORKLIST_SETTINGSDIALOG_NOT_STARTED_TEXT");
                                    break;

                                case com.zespri.awct.util.Enums.DeliveryStatus.InProgress :
                                    // Case for In Progress
                                    sTitle = com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ALLOCATION_DELIVERYWORKLIST_SETTINGSDIALOG_IN_PROGRESS_TEXT");
                                    break;

                                case com.zespri.awct.util.Enums.DeliveryStatus.Released :
                                    // Case for Released
                                    sTitle = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_SETTINGSDIALOG_RELEASED_TEXT");
                                    break;

                                case com.zespri.awct.util.Enums.DeliveryStatus.Locked :
                                    // Case for Locked
                                    sTitle = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_SETTINGSDIALOG_LOCKED_TEXT");
                                    break;
                            }

                            // create the groupHeaderItem
                            if (sTitle) {
                                return new sap.m.GroupHeaderListItem({
                                    title : sTitle,
                                    upperCase : false
                                });
                            }

                        },
                        /**
                         * 
                         * This method will be triggered automatically once the data has been loaded into the master delivery list. It will route to
                         * the detail page with the context of first list item.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _setFirstSelection : function() {
                            var oList = this._getList();
                            // Check if there is any list item selected .
                            if (!oList.getSelectedItem()) {
                                // Check for grouping . If yes ,fire press for second item (first one is for GroupHeader)
                                if (oList.getBindingInfo("items").binding.isGrouped()) {
                                    if (oList.getItems().length > 1) {
                                        var oGroupListItem = oList.getItems()[1];
                                        oGroupListItem.firePress();
                                    } else {
                                        jQuery.sap.log.error("Selection of the first list item failed as there is only one item in a grouped list");
                                    }

                                } else {
                                    // Fire first item for non-grouping list
                                    var oNoGroupListItem = oList.getItems()[0];
                                    oNoGroupListItem.firePress();
                                }
                            }
                        },

                        /**
                         * 
                         * This method will be triggered if list item is selected .
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleItemPress : function(oEvent) {
                            // Set the _bListItemClicked to true once listItem is clicked .
                            // It will avoid checking of DeliveryHeaderID from route URL in the master deliveryWorkList items
                            var oList = this._getList();
                            if (oEvent.getSource() !== oList.getSelectedItem()) {
                                this._bListItemClicked = true;
                            }

                            this._sLastRouteIDBeforeNoResults = null;
                            // route to detail page for the selected list item along with selected contextPath
                            this._setSelectedListItem(oEvent.getSource());
                        },

                        /**
                         * 
                         * This method route to detail page for the selected list item along with selected contextPath.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.m.ListItemBase}
                         *            oItem Selected List Item
                         */
                        _setSelectedListItem : function(oItem) {
                            var oList = this._getList();
                            if (oList) {
                                oList.removeSelections(true);
                            }
                            oItem.setSelected(true);

                            // route to the detail page with selected context path
                            this.getRouter().navTo("Allocation/DeliveryWorkList/Detail", {
                                contextPath : oItem.getBindingContext().getPath().substr(1),
                                customData : {
                                    ItemClicked : true
                                }
                            }, this._bWorkListLoadedFirstTime);
                        },

                        /**
                         * 
                         * This method will triggered on search in the master list subHeader searchField. Searching is based on the currently
                         * available items in the master list.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */

                        handleShipmentSearch : function() {
                            // set _bSelectFirstItem = true , byDefault after search show first listItem as selected
                            this._bSelectFirstItem = true;
                            // apply searched value along with selected filters / sorters from view settings dialog....
                            this._applyFiltersAndSortersToList();
                        },

                        /**
                         * Navigate to Empty View if there is no data in the master DeliveryList .
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {String}
                         *            sViewTitle The View title string for page header title.
                         * @param {String}
                         *            sInfoText The InfoText (Reason) to be displayed in the content of the page .
                         * @param {Boolean}
                         *            bEmpty Boolean to represent empty page (true).
                         */
                        _navToEmptyView : function(sViewTitle, sInfoText, bEmpty) {
                            this.getRouter().navTo("Allocation/DeliveryWorkList/NoResults", {
                                viewTitle : sViewTitle,
                                infoText : sInfoText,
                                isEmptyView : bEmpty
                            });
                        },

                        /**
                         * 
                         * This method will be triggered, DropDownList is pressed on the master List footer bar. This method will open the fragment of
                         * viewSettingsDialog , which contains fields for sorting and filtering.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        handleViewSettingsDialogOpen : function() {
                            this._oViewSettingsDialog.open();
                            // Disable the default view settings dialog page scroll bar
                            var oPage = this._oViewSettingsDialog._getPage2();
                            oPage.setEnableScrolling(false);
                        },
                        /**
                         * This method will initialize the view settings dialog and select the filters based on route custom data or default filters
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {Object}
                         *            oCustomDataFilters Object Contains custom data with filters (Status and Supply > Demand) (or) NULL (no
                         *            CustomData in the route URL)
                         */
                        _initialiseViewSettingsDialog : function(oCustomDataFilters) {
                            var oController = this;
                            var $viewSettingsDialogShipmentReadPromise, $viewSettingsDialogDeliveryReadPromise;

                            if (!this._oViewSettingsDialog) {
                                // Initialize a new dialog
                                this._oViewSettingsDialog = sap.ui.xmlfragment("deliveryWorkListSettingsDialog",
                                        "com.zespri.awct.alloc.fragment.DeliveryWorkListSettingsDialog", this);
                                this.getView().addDependent(this._oViewSettingsDialog);
                                // set the dialog busy by getting private reference of the dialog
                                this._oViewSettingsDialog._getDialog().setBusyIndicatorDelay(0);
                                this._oViewSettingsDialog._getSubHeader().setBusyIndicatorDelay(0);
                                this._oViewSettingsDialog._getDialog().setBusy(true);
                                this._oViewSettingsDialog._getSubHeader().setBusy(true);

                                // Get current season
                                var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                                // Create filter String for current season
                                var sSeasonFilterString = "Season eq '" + sCurrentSeason + "'";

                                // Bind items to shipment and delivery no filter lists
                                // Create the Deferred and promise object for Shipment List read
                                $viewSettingsDialogShipmentReadPromise = this._bindItemsToShipmentFilterList(sSeasonFilterString);

                                $viewSettingsDialogDeliveryReadPromise = this._bindItemsToDeliveryFilterList("");

                                // When all the asynchronous calls done (resolved), release busy State of the view settings dialog
                                jQuery.when($viewSettingsDialogShipmentReadPromise, $viewSettingsDialogDeliveryReadPromise).done(function() {
                                    oController._oViewSettingsDialog._getDialog().setBusy(false);
                                    oController._oViewSettingsDialog._getSubHeader().setBusy(false);
                                });
                            }

                            // If the route URL contains custom data , select List items based on the filter object
                            if (oCustomDataFilters) {
                                // STATUS List
                                if (oCustomDataFilters.Status) {
                                    var oViewSettingsDialogStatusList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                            "viewSettingStatus");
                                    var oStatusListItems = oViewSettingsDialogStatusList.getItems();

                                    $.each(oStatusListItems, function(iIndex, oItem) {
                                        // To Remove selections which are selected by default
                                        oItem.setSelected(false);
                                        $.each(oCustomDataFilters.Status, function(i, sStatus) {
                                            var sStatusKey = "Status__EQ__" + sStatus;
                                            // Select the item which has key === "sStatusKey" from the custom filters object
                                            if (oItem.getKey() === sStatusKey) {
                                                oItem.setSelected(true);
                                            }
                                        });
                                    });
                                }
                                // Supply > Demand
                                // Get the Supply GT Demand List
                                var oViewSettingsDialogSupplyGtDemandList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                        "viewSettingsSuppplyGTDemand");
                                // Get the First Filter Item (since only one item is there for supply GT Demand) and make it as selected
                                var oSupplyGTDemandListItem = oViewSettingsDialogSupplyGtDemandList.getItems()[0];

                                if (oCustomDataFilters.IsSupplyGtDemandFlag !== undefined) {
                                    oSupplyGTDemandListItem.setSelected(true);
                                } else {
                                    oSupplyGTDemandListItem.setSelected(false);
                                }

                            }
                        },
                        /**
                         * This method is a helper method that returns the CustomData that matches the value of the key
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.core.Control}
                         *            Search field Input control
                         * @param {String}
                         *            sKey key of the CustomData to be found
                         * @returns CustomData that matches the key. If no key is matched, returns ""
                         */
                        _getCustomDataForKey : function(oControl, sKey) {
                            var aCustomData = oControl.getCustomData();
                            if (aCustomData.length) {
                                // Loop through the customData to find entry(value) for the sKey.
                                for ( var iCustomData = 0; iCustomData < aCustomData.length; iCustomData++) {
                                    if (aCustomData[iCustomData].getKey() === sKey) {
                                        return aCustomData[iCustomData];
                                    }
                                }
                            }
                            return "";
                        },
                        /**
                         * This method is triggered when user select a shipment number in the view setting dialog. Once user select a shipment number ,
                         * this method will form the filers for selected items for filtering delivery number based on selected shipments.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleShipmentFilterSelect : function(oEvent) {
                            var oSource = oEvent.getSource();
                            var aSelectedItems = oSource.getSelectedItems();
                            var sDeliveryFilterString = "";
                            var oShipmentFilter = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog", "viewSettingsFilterShipment");
                            // If no items are selected , change the delivery list items binding and make shipment list items selected to false
                            if (aSelectedItems.length === 0) {
                                // If shipment Number is unselected .
                                this._bShipmentNumberFiltered = false;
                                // change the binding of delivery number list.
                                this._bindItemsToDeliveryFilterList("");
                                oShipmentFilter.setSelected(false);
                                // Set the filter count to 0
                                oShipmentFilter.setFilterCount(0);

                            } else {
                                // If shipment Number is selected .
                                this._bShipmentNumberFiltered = true;
                                // if shipment is selected , loop through the selection and form the filter to bind items for delivery number list.
                                for ( var i = 0; i < aSelectedItems.length; i++) {
                                    var sSelectedShipmentCustomData = this._getCustomDataForKey(aSelectedItems[i], "key");
                                    var sSelectedShipmentKey = sSelectedShipmentCustomData.getValue();

                                    // Form the Filter string for Delivery List
                                    if (sDeliveryFilterString) {
                                        sDeliveryFilterString = sDeliveryFilterString + " or ShipmentID eq '" + sSelectedShipmentKey + "'";
                                    } else {
                                        sDeliveryFilterString = "ShipmentID eq '" + sSelectedShipmentKey + "'";
                                    }

                                    // aDeliveryFilters.push(new sap.ui.model.Filter("ShipmentID", "EQ", sSelectedShipmentKey));
                                }
                                // Set the filter count based on selected items
                                oShipmentFilter.setFilterCount(aSelectedItems.length);
                                oShipmentFilter.setSelected(true);
                                // SetText with same as ITEM title (used for filter string to show it in the infoBar for deliveryWorkList)
                                oShipmentFilter.setText(com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_SHIPMENT_NUMBER"));
                                // bind items to deliveryNumber based on selected shipments
                                this._bindItemsToDeliveryFilterList(sDeliveryFilterString);
                            }
                        },
                        /**
                         * This method is triggered when user select a Delivery number in the view setting dialog. This method is used for making the
                         * customItem as selected to push the item to standard filterItems array and for creating filter string to show it in the list
                         * infoBar
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleDeliveryFilterSelect : function(oEvent) {
                            var oDeliveryFilter = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog", "viewSettingsFilterDelivery");
                            var oSource = oEvent.getSource();
                            var aSelectedItems = oSource.getSelectedItems();

                            // If delivery number is selected
                            if (aSelectedItems.length > 0) {
                                // set count as per selected delivery items
                                oDeliveryFilter.setFilterCount(aSelectedItems.length);
                                oDeliveryFilter.setSelected(true);
                                // set the text (used for filter string to show it in the infoBar for deliveryWorkList)
                                oDeliveryFilter.setText(com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_DELIVERY_NUMBER"));
                            } else {
                                // if no items are selected ,
                                // Revert the count back to 0
                                oDeliveryFilter.setFilterCount(0);
                                // removed from selected items list
                                oDeliveryFilter.setSelected(false);
                            }
                        },
                        /**
                         * This method will bind items to delivery filter list based on shipment selection or season selection.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {String}
                         *            sDeliveryFilterString Filter String based on shipment selection or season
                         */
                        _bindItemsToDeliveryFilterList : function(sDeliveryFilterString) {

                            var $viewSettingsDialogDeliveryReadDeferred, $viewSettingsDialogDeliveryReadPromise;

                            var oViewSettingsCustomDeliveryList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterDeliveryList");
                            var oUrlParameter = {};

                            // Success Handler for Delivery List Read
                            var fnReadSuccess = function(oJSONModel) {
                                // Set the Model to the List
                                oViewSettingsCustomDeliveryList.setModel(oJSONModel);
                                // bind items to delivery customItem based on shipment
                                oViewSettingsCustomDeliveryList.bindAggregation("items", {
                                    path : "/results",
                                    template : oViewSettingsCustomDeliveryList.getBindingInfo("items") ? oViewSettingsCustomDeliveryList
                                            .getBindingInfo("items").template : oViewSettingsCustomDeliveryList.getItems()[0].clone()
                                });
                                $viewSettingsDialogDeliveryReadDeferred.resolve();
                            };

                            // Error handler for this read
                            var fnReadError = function(oError) {
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                $viewSettingsDialogDeliveryReadDeferred.resolve();
                            };

                            // Form the URL Parameter object
                            if (sDeliveryFilterString) {
                                oUrlParameter = {
                                    "$filter" : sDeliveryFilterString
                                };
                            }

                            // Create the Deferred and Promise object for Delivery List Read
                            $viewSettingsDialogDeliveryReadDeferred = $.Deferred();
                            $viewSettingsDialogDeliveryReadPromise = $viewSettingsDialogDeliveryReadDeferred.promise();

                            // Trigger the read
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                                urlParameters : oUrlParameter
                            }, fnReadSuccess, fnReadError);

                            return $viewSettingsDialogDeliveryReadPromise;
                        },
                        /**
                         * This method will bind items to the shipment filter list to the viewSettingsDialog based on season selection.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {String}
                         *            sSeasonFilterString Filter based on season
                         */
                        _bindItemsToShipmentFilterList : function(sSeasonFilterString) {
                            var $viewSettingsDialogShipmentReadDeferred, $viewSettingsDialogShipmentReadPromise;

                            var oViewSettingsCustomShipmentList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterShipmentList");

                            // Success handler for Shipment List Read
                            var fnReadSuccess = function(oJSONModel) {
                                // Set the Model to ShipmentList
                                oViewSettingsCustomShipmentList.setModel(oJSONModel);
                                // bind items to shipment customItem based on season selection
                                oViewSettingsCustomShipmentList.bindAggregation("items", {
                                    path : "/results",
                                    template : oViewSettingsCustomShipmentList.getBindingInfo("items") ? oViewSettingsCustomShipmentList
                                            .getBindingInfo("items").template : oViewSettingsCustomShipmentList.getItems()[0].clone()
                                });
                                $viewSettingsDialogShipmentReadDeferred.resolve();
                            };

                            // Error handler for this read
                            var fnReadError = function(oError) {
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                $viewSettingsDialogShipmentReadDeferred.resolve();
                            };

                            // Create the Deferred and Promise object for Shipment List Read
                            $viewSettingsDialogShipmentReadDeferred = $.Deferred();
                            $viewSettingsDialogShipmentReadPromise = $viewSettingsDialogShipmentReadDeferred.promise();

                            // Trigger the read
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                                urlParameters : {
                                    "$filter" : sSeasonFilterString
                                }
                            }, fnReadSuccess, fnReadError);

                            return $viewSettingsDialogShipmentReadPromise;
                        },
                        /**
                         * This method will be triggered when user clicks reset icon button in the view settings dialog.. This method will reset the
                         * customItems selections and set counter back to 0.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        handleResetViewSettingDialogFilters : function() {
                            var oController = this;
                            var $viewSettingsDialogShipmentReadPromise, $viewSettingsDialogDeliveryReadPromise;

                            // Shipment Number List selection flag .
                            this._bShipmentNumberFiltered = false;

                            // RESET shipment customItem
                            var oViewSettingsShipmentFilter = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterShipment");
                            var oViewSettingsCustomShipmentList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterShipmentList");
                            // set the dialog to busy
                            this._oViewSettingsDialog._getDialog().setBusyIndicatorDelay(0);
                            this._oViewSettingsDialog._getSubHeader().setBusyIndicatorDelay(0);
                            this._oViewSettingsDialog._getDialog().setBusy(true);
                            this._oViewSettingsDialog._getSubHeader().setBusy(true);

                            // Destroy the items
                            oViewSettingsCustomShipmentList.destroyItems();
                            // make the FilterCount 0
                            oViewSettingsShipmentFilter.setFilterCount(0);

                            // RESET delivery customItem
                            var oViewSettingsDeliveryFilter = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterDelivery");
                            var oViewSettingsCustomDeliveryList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterDeliveryList");

                            // Destroy the delivery items
                            oViewSettingsCustomDeliveryList.destroyItems();
                            // make the FilterCount 0
                            oViewSettingsDeliveryFilter.setFilterCount(0);

                            // Get current season
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                            // Create filter string for current season
                            var sSeasonFilterString = "Season eq '" + sCurrentSeason + "'";

                            // Clear the SearchField values if any
                            sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog", "viewSettingsDialogShipmentSearch").setValue();
                            sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog", "viewSettingsDialogDeliverySearch").setValue();

                            // Bind items with no filters
                            // REVERT back to initial state..
                            $viewSettingsDialogShipmentReadPromise = this._bindItemsToShipmentFilterList(sSeasonFilterString);

                            $viewSettingsDialogDeliveryReadPromise = this._bindItemsToDeliveryFilterList("");

                            // When all the asynchronous calls done (resolved), release busy State of the view settings dialog
                            jQuery.when($viewSettingsDialogShipmentReadPromise, $viewSettingsDialogDeliveryReadPromise).done(function() {
                                oController._oViewSettingsDialog._getDialog().setBusy(false);
                                oController._oViewSettingsDialog._getSubHeader().setBusy(false);
                            });

                            // Set the Status List to initial state (Select "Not Started" & "InProgress")
                            var oViewSettingsDialogNotStartedStatus = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingStatusNotStarted");
                            oViewSettingsDialogNotStartedStatus.setSelected(true);

                            var oViewSettingsDialogInProgressStatus = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingStatusInProgress");
                            oViewSettingsDialogInProgressStatus.setSelected(true);

                        },
                        /**
                         * This method will create filters for the customItems selection. It will loop through the custom items and form filters based
                         * on selected items.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @returns {Array} aCustomFilters Array of selected Filters from the view setting dialog
                         */
                        _createFiltersForCustomItems : function() {
                            var aCustomFilters = [];

                            var oViewSettingsCustomShipmentList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterShipmentList");
                            var aSelectedShipmentItems = oViewSettingsCustomShipmentList.getSelectedItems();
                            for ( var iShipmentCount = 0; iShipmentCount < aSelectedShipmentItems.length; iShipmentCount++) {
                                var sSelectedShipmentCustomData = this._getCustomDataForKey(aSelectedShipmentItems[iShipmentCount], "key");
                                var sSelectedShipmentKey = sSelectedShipmentCustomData.getValue();
                                aCustomFilters.push(new sap.ui.model.Filter("ShipmentID", sap.ui.model.FilterOperator.EQ, sSelectedShipmentKey));
                            }

                            var oViewSettingsCustomDeliveryList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterDeliveryList");
                            var aSelectedDeliveryItems = oViewSettingsCustomDeliveryList.getSelectedItems();
                            for ( var iDeliveryListCount = 0; iDeliveryListCount < aSelectedDeliveryItems.length; iDeliveryListCount++) {
                                var sSelectedDeliveryCustomData = this._getCustomDataForKey(aSelectedDeliveryItems[iDeliveryListCount], "key");
                                var sSelectedDeliveryKey = sSelectedDeliveryCustomData.getValue();
                                aCustomFilters
                                        .push(new sap.ui.model.Filter("DeliveryHeaderID", sap.ui.model.FilterOperator.EQ, sSelectedDeliveryKey));
                            }
                            return aCustomFilters;
                        },
                        /**
                         * 
                         * This method is to handle the confirm button in the viewSettingsDialog fragment. It will trigger the _bindDeliveryList
                         * method with selected filters and sorters.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleViewSettingsDialogClose : function(oEvent) {
                            var oDeliverySearch = this.byId("deliveryWorkListSearch");
                            if (oDeliverySearch.getValue() && this._bShipmentNumberFiltered) {
                                // Clear the SearchField , if shipment Number is selected from ViewSettings Dialog.
                                oDeliverySearch.setValue("");
                            }
                            // On clicking confirm in the ViewSettings Dialog
                            var mParams = oEvent.getParameters();
                            this._bViewSettingsDialogChanged = true;
                            var aFilters = [];
                            jQuery.each(mParams.filterItems, function(i, oItem) {
                                // form the filter only if the current selected item is instance of "ViewSettingsFilterItem"
                                if (!(oItem instanceof sap.m.ViewSettingsCustomItem)) {
                                    var aSplit = oItem.getKey().split("__");
                                    var sPath = aSplit[0];
                                    var sOperator = aSplit[1];
                                    var sValue1 = aSplit[2];
                                    var oFilter = new sap.ui.model.Filter(sPath, sOperator, sValue1);
                                    aFilters.push(oFilter);
                                }
                            });

                            // Push the custom filters to the FILTERS array to bind it to DELIVERY WORKLIST.
                            var aCustomFilters = this._createFiltersForCustomItems();
                            // Get filters from custom items
                            for ( var i = 0; i < aCustomFilters.length; i++) {
                                aFilters.push(aCustomFilters[i]);
                            }

                            // If filters are there , show info bar with the text of filtered information
                            if (aFilters.length > 0) {
                                this.byId("deliveryListFilterBar").setVisible(true);
                                this.byId("deliveryListFilterBarLabel").setTooltip(mParams.filterString);
                                this.byId("deliveryListFilterBarLabel").setText(mParams.filterString);
                            } else {
                                this.byId("deliveryListFilterBar").setVisible(false);
                                // reset the last route variable to avoid looping problem
                                // If a delivery is filtered , it will show no results detail page . Then it will be stored in
                                // _sLastRouteIDBeforeNoResults variable
                                // If the filters are removed , we have to clear the "_sLastRouteIDBeforeNoResults" instance to avoid looping of
                                // noResults
                                this._sLastRouteIDBeforeNoResults = null;
                            }

                            // put the created filters to global array ...
                            this._aFiltersFromSettingsDialog = aFilters;

                            // Get the Sorting Items
                            var aSorters = [];
                            // apply the group based on status
                            aSorters.push(new sap.ui.model.Sorter({
                                path : "Status",
                                descending : false,
                                group : true
                            }));
                            if (mParams.sortItem) {
                                var sPath = mParams.sortItem.getKey();
                                var bDescending = mParams.sortDescending;
                                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
                                this.aSorterCopy = aSorters;
                            }
                            // put the created sorters to global array of sorters...
                            this._aSortersFromSettingsDialog = aSorters;
                            // apply searched value along with selected filters / sorters from view settings dialog....
                            this._applyFiltersAndSortersToList();
                        },
                        /**
                         * This method will apply filters and sorters to the table based on view setting dialog selection and search
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         */
                        _applyFiltersAndSortersToList : function() {
                            var oDeliverySearch = this.byId("deliveryWorkListSearch");
                            var sQuery = oDeliverySearch.getValue();

                            // if view settings dialog is not changed , use default filters and sorters...
                            if (!this._bViewSettingsDialogChanged) {
                                // If navigated from Dashboard with customData , use aCustomFilters array for filtering else , Use Default sorters and
                                // filters
                                if (this._bCustomFiltersApplied) {
                                    this._aFiltersFromSettingsDialog = this._aCustomFilters;
                                    this._aSortersFromSettingsDialog = this._getDefaultSorter();
                                } else {
                                    this._aFiltersFromSettingsDialog = this._getDefaultFilter();
                                    this._aSortersFromSettingsDialog = this._getDefaultSorter();
                                }
                            }

                            // get the local copy of filters and sorters which are selected from view settings dialog ....
                            var aFilters = [];
                            aFilters = this._aFiltersFromSettingsDialog.slice();
                            var aSorters = [];
                            aSorters = this._aSortersFromSettingsDialog.slice();

                            // Search query in the search bar , should be effective in the filtering .
                            if (sQuery) {
                                if (/^\d+$/.test(sQuery)) {
                                    if (this._bShipmentNumberFiltered) {
                                        oDeliverySearch.setValue("");
                                        // Show Error Toast
                                        com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_ALLOCATION_DELIVERYWORKLIST_SHIPMENT_NUMBER_FILTER_ERROR"));
                                        return;
                                    }
                                    // Create a filter based on search
                                    var oSearchFilter = new sap.ui.model.Filter("ShipmentID", sap.ui.model.FilterOperator.Contains, sQuery);
                                    // For MultiSelect with bAnd = true
                                    var oSearchMultiFilterTrue = new sap.ui.model.Filter([oSearchFilter], true);
                                    aFilters.push(oSearchMultiFilterTrue);
                                } else {
                                    com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ALLOCATION_DELIVERYWORKLIST_MASTER_SEARCH_INVALID"));
                                    return;
                                }
                            }

                            // call _bindDeliveryList with selected filters and sorters
                            this._bindDeliveryList("/DeliveryHeaderSet", aFilters, aSorters);
                        },
                        /**
                         * This method returns the ListItem in the master delivery list which corresponds to the deliveryID passed as parameter
                         * 
                         * @priavte
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param {String}
                         *            sDeliveryID DeliveryHeaderID from the route contextPath.
                         * @param {sap.m.List}
                         *            oList Master DeliveryList.
                         * @returns {sap.m.ListItem} Returns ListItem .
                         */
                        _getListItemFromMasterList : function(sDeliveryID, oList) {
                            // get the list items count
                            var iListLength = oList.getItems().length;
                            // Loop through all currently available items in the list .
                            for ( var i = 0; i < iListLength; i++) {
                                if (oList.getItems()[i].getBindingContext()) {
                                    // get the DeliveryHeaderID for the current ListItem in the LOOP .
                                    var sListDeliveryID = oList.getItems()[i].getBindingContext().getProperty("DeliveryHeaderID");
                                    // Check the current ListItem ID with DeliveryHeaderID from the route ContextPath
                                    if (sDeliveryID === sListDeliveryID) {
                                        return oList.getItems()[i];
                                    }
                                }
                            }
                            // if no ListItem is matched with the sDeliveryID (DeliveryHeaderID from the route ContextPath) , return null .
                            return null;
                        },
                        /**
                         * This method will be triggered when search field inside view settings dialog for Shipment List is clicked . This method will
                         * filter the list based on the entered query in JSON Model .
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param oEvent
                         */
                        handleviewSettingShipmentListSearch : function(oEvent) {
                            // Query eneterd in the SearchField
                            var sQuery = oEvent.getParameter("query");
                            var oSearchFilter = null;

                            var oViewSettingsDialogShipmentList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterShipmentList");

                            // Other than space and empty string , form the Filter
                            if (sQuery && sQuery.trim().length > 0) {
                                oSearchFilter = new sap.ui.model.Filter("ShipmentID", sap.ui.model.FilterOperator.Contains, sQuery);
                            }
                            oViewSettingsDialogShipmentList.getBinding("items").filter(oSearchFilter);
                        },
                        /**
                         * This method will be triggered when search field inside view settings dialog for Delivery List is clicked . This method will
                         * filter the list based on the entered query in JSON Model .
                         * 
                         * @memberOf com.zespri.awct.alloc.view.MasterDeliveryWorkList
                         * @param oEvent
                         */
                        handleviewSettingDeliveryListSearch : function(oEvent) {
                            // Query eneterd in the SearchField
                            var sQuery = oEvent.getParameter("query");
                            var oSearchFilter = null;

                            var oViewSettingsDialogDeliveruyList = sap.ui.core.Fragment.byId("deliveryWorkListSettingsDialog",
                                    "viewSettingsFilterDeliveryList");

                            // Other than space and empty string , form the Filter
                            if (sQuery && sQuery.trim().length > 0) {
                                oSearchFilter = new sap.ui.model.Filter("DeliveryHeaderID", sap.ui.model.FilterOperator.Contains, sQuery);
                            }
                            oViewSettingsDialogDeliveruyList.getBinding("items").filter(oSearchFilter);
                        }

                    });
})();
