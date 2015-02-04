/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    /**
     * @classdesc The helper class provides utility methods for common functionality that are not classified among other helper classes
     * @class
     * @name com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.util.CommonHelper = {};

    /**
     * This method is used to retrieve the CSRF token and return the same.
     * 
     * @returns {String} CSRF Token that needs to be sent along with the request header
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.util.CommonHelper.getCSRFToken = function() {
        // get the token from the OData model attached to the component
        var sToken = "";

        try {
            sToken = sap.ui.getCore().getRootComponent().getModel().oServiceData.securityToken;
        } catch (e) {
            sToken = "";
        }

        if (sToken.length === 0) {
            // if the token is not available, then refresh the token
            sap.ui.getCore().getRootComponent().getModel().refreshSecurityToken();
            // re-attempt security token fetch
            sToken = sap.ui.getCore().getRootComponent().getModel().oServiceData.securityToken;
        }

        return sToken;
    };

    /**
     * Returns the logoff URL for the application.
     * 
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.util.CommonHelper.getLogoffURL = function() {
        return (com.zespri.awct.util.Constants.C_LOGOFF_URL + "?" + com.zespri.awct.util.Constants.C_REDIRECT_URL_PARAM);
    };

    /**
     * This Method will return true / false based on the user authorization Model and requested Authorizations.
     * 
     * @param {String}
     *            sRequestedMode Requested Mode for the Authorization Object
     * @param {String}
     *            sAuthorizationObjectName Requested Authorization Object
     * @param {String}
     *            sFunction Requested Function within the Authorization Object
     * @returns {Boolean} True - If User is allowed for the requested Authorization , Mode and Function(Optional) . Else, False.
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.util.CommonHelper.isUserAuthorized = function(sRequestedMode, sAuthorizationObjectName, sFunction) {
        if (!sap.ui.getCore().getRootComponent().getModel("currentUserDetails")) {
            return;
        }
        // Get the AuthorizationSet from the currentUser Model
        var oAuthorizationSet = sap.ui.getCore().getRootComponent().getModel("currentUserDetails").getData().AuthorizationSet;
        // Flag to indicate Requested authorization has matched in the authorizationSet Model.
        var bAuthorizationMatched = false;

        // If authorizationObjectName alone passed as parameter, just loop through the model and find for the match (special case- Eg.Reports)
        if (sAuthorizationObjectName && !(sRequestedMode && sFunction)) {
            // Loop through the authorization set object and find the requested authorization
            $.each(oAuthorizationSet, function(iIndex, oAuthorizationObject) {
                var sAuthorization = oAuthorizationObject.AuthorizationObject.toLowerCase();
                if (sAuthorization === sAuthorizationObjectName.toLowerCase()) {
                    bAuthorizationMatched = true;
                }
            });
        } else {
            // If Mode function and AuthorizationObjectName is not specified , return false
            if (!sRequestedMode || !sAuthorizationObjectName || !sFunction || (sRequestedMode === com.zespri.awct.util.Enums.AuthorizationMode.None)) {
                return false;
            }

            // Loop through the authorization set object and find the requested authorization
            $.each(oAuthorizationSet,
                    function(iIndex, oAuthorizationObject) {
                        // Check if Authorization Object matches with * or specific if yes proceed, else next loop please
                        var sAuthorization = oAuthorizationObject.AuthorizationObject.toLowerCase();
                        if (sAuthorization === com.zespri.awct.util.Enums.AuthorizationFunctions.All ||
                                sAuthorization === sAuthorizationObjectName.toLowerCase()) {
                            // Check if function matches with * or specific. If yes proceed, else next loop please
                            var sExistingFunction = oAuthorizationObject.Function.toLowerCase();
                            if (sExistingFunction === com.zespri.awct.util.Enums.AuthorizationFunctions.All ||
                                    sExistingFunction === sFunction.toLowerCase()) {
                                // Check if mode matches with * or specific. Exception - If request for 03 (Display) and if you encounter ('02')(Maintain)
                                // then proceed.If yes proceed, else next loop please
                                var sExistingFunctionMode = oAuthorizationObject.Mode.toLowerCase();
                                if (sExistingFunctionMode === com.zespri.awct.util.Enums.AuthorizationFunctions.All ||
                                        sExistingFunctionMode === sRequestedMode.toLowerCase() ||
                                        sExistingFunctionMode === com.zespri.awct.util.Enums.AuthorizationMode.Maintain) {
                                    bAuthorizationMatched = true;
                                    return;
                                }
                            }
                        }
                    });
        }

        return bAuthorizationMatched;
    };

    /**
     * Manage FacetFilter enable Property . Facet Filter will be disabled until table is loaded.
     * 
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     * @param {sap.m.Table}
     *          oTable Table control in the view which disables the facet filter until its loaded.
     * @param {com.zespri.awct.control.FacetFilter}
     *          oFacetFilter FacetFilter Control to be disabled / enabled based on table loading        
     */
    com.zespri.awct.util.CommonHelper.manageFacetFilterState = function(oTable, oFacetFilter) {
        // Map To store tables which depends on facet filter.
        // This map is used to set the Enable property of facet filter, if all the tables linked to the facet filter is loaded.
        // Initialize the map , if its not already initialized
        if (!this._mFacetFilterStates) {
            this._mFacetFilterStates = {};
        }
        var oCommonHelper = this;

        // ByDefault , Disable the FacetFilter.
        oFacetFilter.setEnabled(false);

        // Disable the Facet Filter, until table is loaded.
        oTable.attachEvent("updateStarted", function() {
            oFacetFilter.setEnabled(false);

            // Check whether the facet filter is already in the MAP , If yes add the table to the array.
            // Else, create the array and add to it.
            if (oCommonHelper._mFacetFilterStates[oFacetFilter.getId()]) {
                oCommonHelper._mFacetFilterStates[oFacetFilter.getId()].push(oTable);
            } else {
                oCommonHelper._mFacetFilterStates[oFacetFilter.getId()] = [oTable];
            }
        });

        // Enable the Facet Filter once table is loaded
        oTable.attachEvent("updateFinished", function() {
            // To set Enable property true, check no more tables are loading for the current FacetFilter and delete the map entry
            if (oCommonHelper._mFacetFilterStates[oFacetFilter.getId()].length === 1) {
                delete oCommonHelper._mFacetFilterStates[oFacetFilter.getId()];
                oFacetFilter.setEnabled(true);
            } else {
                // If other tables linked to the facet filter is still loading, Remove current oTable from the map and facet filter will be in disabled state.
                var iIndex = oCommonHelper._mFacetFilterStates[oFacetFilter.getId()].indexOf(oTable);
                if (iIndex > -1) {
                    oCommonHelper._mFacetFilterStates[oFacetFilter.getId()].splice(iIndex, 1);
                }
            }
        });
    };

    /**
     * Manages NoData Text of Lists for the application.
     * 
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     * @param {sap.m.ListBase}
     *            oList Displays NoData Text for List or Table based on the Reason from attachUpdateFinished Event.
     */
    com.zespri.awct.util.CommonHelper.manageNoDataText = function(oList) {
        // The 'require' is inside the method to avoid a circular dependency between FacetFilterList and CommonHelper. This causes an inconsistent
        // build.
        jQuery.sap.require("com.zespri.awct.control.FacetFilterList");

        // If the list is bound with the model, then set busy = true
        // Other wise (if list is not bound with the model) , busy state will be set and it would not be released (no updateStarted and
        // updateFinsihsed event will be called)
        // For Tables , set busy state byDefault (fix for version 1.22)
        if (oList.getBinding("items") || (oList instanceof sap.m.Table)) {
            // Set the list / table to busy state.
            oList.setBusyIndicatorDelay(0);
            oList.setBusy(true);
        }
        var sLoadingText = com.zespri.awct.util.I18NHelper.getText("TXT_LIST_LOADING_LABEL");
        // Show "Loading..."
        oList.setNoDataText(sLoadingText);

        // While Updating the list , show "Loading" text
        oList.attachEvent("updateStarted", function() {
            // In Facet Filter List , set busy (while list update started)making the list to close when we live search in the search bar .
            // To Avoid closing of facet list while typing in the search field , busy state is avoided for facet list .
            if (!(oList instanceof com.zespri.awct.control.FacetFilterList)) {
                oList.setBusy(true);
            }
            oList.setNoDataText(sLoadingText);
        });

        // After update has finished ,
        // If count ===0 , show no Data text based on the filters
        oList.attachEvent("updateFinished", function(oEvent) {
            // If the list has the 'loadingData' custom data set to indicate that it is still loading data, ignore the updateFinished event.
            // TODO : Have a helper method to read custom data by value (current implementation always checks the first customData)
            if (oList.getCustomData() && oList.getCustomData()[0] && oList.getCustomData()[0].getKey() === "loadingData" &&
                    oList.getCustomData()[0].getValue() === true) {
                return;
            }

            var iActualCount = oEvent.getParameter("actual");
            var bIsFiltersApplied = (oList.getBinding("items").aFilters.length > 0) || (oList.getBinding("items").aApplicationFilters.length > 0);

            // If Count === 0 and no Filters Applied on the list , then show "No Items are currently available" text
            if (iActualCount === 0 && !bIsFiltersApplied) {
                var sNoItemsAvailableText = com.zespri.awct.util.I18NHelper.getText("TXT_LIST_NO_ITEMS_LABEL");
                oList.setNoDataText(sNoItemsAvailableText);
            }
            // If Count === 0 and Filters are applied on the list , then show "no Matching items found" text
            else if (iActualCount === 0 && bIsFiltersApplied) {
                var sNoMatchingItemsText = com.zespri.awct.util.I18NHelper.getText("TXT_LIST_NO_MATCHING_ITEMS_LABEL");
                oList.setNoDataText(sNoMatchingItemsText);
            }
            oList.setBusy(false);
        });
    };
    /**
     * This method will bind the items to facet filter list and it will check whether list has already items . If no , then it will bind items to it .
     * 
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     * @param {Object}
     *            oFilterDetails Object contains the details of facet filter list.
     * @param {Boolean}
     *            bDependentList Boolean to indicate whether the list is dependent or not
     */
    com.zespri.awct.util.CommonHelper.createFacetFilterListItems = function(oFilterDetails, bDependentList) {
        // Get the details of the facet list to bind items
        var oFacetFilterListControl = oFilterDetails.facetListControl;
        var sPath = "/" + oFilterDetails.entitySetName;
        var sFilterString = oFilterDetails.filterString;
        var sSelectString = oFilterDetails.selectString;

        // If list is not bind with items or the list control is dependent on other list, do binding
        if (!oFacetFilterListControl.getBinding("items") || bDependentList) {
            oFacetFilterListControl.setBusy(true);
            var fnReadSuccess = function(oJSONModel) {
                // Success handler
                // Set the JSOM Model to the list (Json model is used to perform search locally on the list , without calling backend)
                oFacetFilterListControl.setModel(oJSONModel);
                // bind items to the list
                oFacetFilterListControl.bindItems({
                    path : "/results",
                    template : oFacetFilterListControl.getBindingInfo("items") ? oFacetFilterListControl.getBindingInfo("items").template
                            : oFacetFilterListControl.getItems()[0].clone()
                });
                // Release Busy State
                oFacetFilterListControl.setBusy(false);
            };

            var fnReadError = function(oError) {
                // Error Handler
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                // Release busy state
                oFacetFilterListControl.setBusy(false);
            };

            // Form the URL Parameters , need to be send along with oData read
            var oUrlParameters = {};
            // If for filterString and selectString , then form the url Parameter .
            // For both filterString and selectString
            if (sFilterString && sSelectString) {
                oUrlParameters = {
                    "$filter" : sFilterString,
                    "$select" : sSelectString
                };

            }
            // if filterString is not empty and select string is empty
            else if (sFilterString && !sSelectString) {
                oUrlParameters = {
                    "$filter" : sFilterString
                };
            }
            // if filterString is empty and select string is not empty
            else if (!sFilterString && sSelectString) {
                oUrlParameters = {
                    "$select" : sSelectString
                };
            } else if (oFilterDetails.urlParameter) {
                // Special case for "function import" calls
                // For Function imports , the url parameters will be formed "property name" as key and value with string of QUERY (either filter or
                // select query string)
                oUrlParameters = oFilterDetails.urlParameter;
            } else {
                // Default
                oUrlParameters = {};
            }

            // Trigger a read with URL Parameters
            com.zespri.awct.util.ModelHelper.getJSONModelForRead(sPath, {
                urlParameters : oUrlParameters
            }, fnReadSuccess, fnReadError);
        } else {
            oFacetFilterListControl.setBusy(false);
        }

    };
})();