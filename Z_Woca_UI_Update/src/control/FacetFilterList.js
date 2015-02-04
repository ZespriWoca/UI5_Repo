(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterList");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("sap.m.library");
    jQuery.sap.require("sap.m.List");

    /**
     * @classdesc The standard <i>sap.m.FacetFilterList</i> control is copied into a custom control (<i>com.zespri.awct.control.FacetFilterList</i>).
     *            This was necessary because of the following : The <i>FacetFilter</i> control was also copied in a similar way, as changes to some
     *            of its private methods were necessary. Since the FacetFilter control uses private methods and attributes of the FacetFilterList
     *            control, it was necessary to copy it too.. to ensure that future UI5 upgrades don't break the application.
     * 
     * A new property <i>showInFacetFilterBar</i> has been introduced. This property is checked in the <i>FacetFilterRenderer</i> to determine
     * whether a particular <i>FacetFilterList</i> needs to be rendered on the facet filter bar (OR) needs to only be available on click of the 'more
     * filters' button in the facet filter bar.
     * 
     * A new property <i>filterApplied</i> has been introduced. This property is checked in the <i>FacetFilterRenderer</i> to change the styling of
     * the facet filter reset button icon's styling and tooltip when secondary filters (filters which are not displayed on the facet filter
     * bar)applied . This will allow us to indicate secondary filters has been applied to the user .
     * 
     * Custom additions are marked with "CUSTOM CODE START" and "CUSTOM CODE END" annotations.
     * @class
     * @name com.zespri.awct.control.FacetFilterList
     * @extends sap.m.List
     */
    sap.m.List.extend("com.zespri.awct.control.FacetFilterList", {
        metadata : {

            publicMethods : [
            // methods
            "getSelectedKeys", "setSelectedKeys", "removeSelectedKey", "removeSelectedKeys", "clearSearchField"],
            library : "sap.m",
            properties : {
                "title" : {
                    type : "string",
                    group : "Appearance",
                    defaultValue : null
                },
                "multiSelect" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : true,
                    deprecated : true
                },
                "active" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : true
                },
                "allCount" : {
                    type : "int",
                    group : "Appearance",
                    defaultValue : null
                },
                "sequence" : {
                    type : "int",
                    group : "Behavior",
                    defaultValue : -1
                },
                "key" : {
                    type : "string",
                    group : "Identification",
                    defaultValue : null
                },
                "showRemoveFacetIcon" : {
                    type : "boolean",
                    group : "Misc",
                    defaultValue : true
                },
                "retainListSequence" : {
                    type : "boolean",
                    group : "Misc",
                    defaultValue : false
                },
                // CUSTOM CODE START ---
                "showInFacetFilterBar" : {
                    type : "boolean",
                    defaultValue : false
                },
                "filterApplied" : {
                    type : "boolean",
                    defaultValue : false
                }
            // --- CUSTOM CODE END
            },
            events : {
                "listOpen" : {},
                "listClose" : {}
            }
        },

        renderer : "sap.m.FacetFilterListRenderer"
    });

    com.zespri.awct.control.FacetFilterList.M_EVENTS = {
        'listOpen' : 'listOpen',
        'listClose' : 'listClose'
    };

    // CUSTOM CODE START ---
    // Added Enabled propagator to provide feature of enable and disable control
    jQuery.sap.require("sap.ui.core.EnabledPropagator");
    sap.ui.core.EnabledPropagator.call(com.zespri.awct.control.FacetFilterList.prototype);
    // CUSTOM CODE END ---

    // Start of sap\m\FacetFilterList.js
    com.zespri.awct.control.FacetFilterList.prototype.setTitle = function(sTitle) {

        this.setProperty("title", sTitle, true);
        if (this.getParent() && this.getParent()._setButtonText) {
            this.getParent()._setButtonText(this);
        }
        return this;
    };

    // CUSTOM CODE START
    com.zespri.awct.control.FacetFilterList.prototype.clearSearchField = function() {
        // Get the associated search field
        var oSearchField = sap.ui.getCore().byId(this.getAssociation("search"));
        if (oSearchField) {
            oSearchField.setValue("");
        } else {
            // If the search field isn't available yet, this action needs to be done later (see FacetFilter.js for usage)
            this._bPendingClearSearchField = true;
        }
    };

    com.zespri.awct.control.FacetFilterList.prototype.setBusy = function(bBusy) {
        sap.ui.core.Control.prototype.setBusy.call(this, bBusy);

        // Get the associated search field
        var oSearchField = sap.ui.getCore().byId(this.getAssociation("search"));
        // When the facet list is opened for the first time , search field will not be ready . So Use the private instance variable
        // (_bSearchFieldEnabled) to set enable property.
        // If search field is initialized in the facetFilter (list and search field is ready), setEnabled = !bBusy
        if (oSearchField) {
            oSearchField.setEnabled(!bBusy);
        } else {
            this._bSearchFieldEnabled = !bBusy;
        }
    };
    // CUSTOM CODE END

    com.zespri.awct.control.FacetFilterList.prototype.setMultiSelect = function(bVal) {

        this.setProperty("multiSelect", bVal, true);
        var mode = bVal ? sap.m.ListMode.MultiSelect : sap.m.ListMode.SingleSelectMaster;
        this.setMode(mode);
        return this;
    };

    /**
     * Override to allow only MultiSelect and SingleSelectMaster list modes. If an invalid mode is given then the mode will not be changed.
     * 
     * @param {sap.m.ListMode}
     *            mode The list mode
     * @public
     */
    com.zespri.awct.control.FacetFilterList.prototype.setMode = function(mode) {

        if (mode === sap.m.ListMode.MultiSelect || mode === sap.m.ListMode.SingleSelectMaster) {

            sap.m.List.prototype.setMode.call(this, mode);
            this.setProperty("multiSelect", mode === sap.m.ListMode.MultiSelect ? true : false, true);
        }
        return this;
    };

    com.zespri.awct.control.FacetFilterList.prototype._applySearch = function() {
        var searchVal = this._getSearchValue();
        if (searchVal != null) {
            this._search(searchVal, true);

        }
    };

    com.zespri.awct.control.FacetFilterList.prototype.getSelectedItems = function() {

        var aSelectedItems = [];
        // Track which items are added from the aggregation so that we don't add them again when adding the remaining selected key items
        var oCurrentSelectedItemsMap = {};
        var aCurrentSelectedItems = sap.m.ListBase.prototype.getSelectedItems.apply(this, arguments);

        // First add items according to what is selected in the 'items' aggregation. This maintains indexes of currently selected items in the
        // returned array.
        aCurrentSelectedItems.forEach(function(oItem) {

            aSelectedItems.push(new sap.m.FacetFilterItem({
                text : oItem.getText(),
                key : oItem.getKey(),
                selected : true
            }));
            oCurrentSelectedItemsMap[oItem.getKey()] = true;
        });

        var oSelectedKeys = this.getSelectedKeys();
        var aSelectedKeys = Object.getOwnPropertyNames(oSelectedKeys);

        // Now add items that are not present in the aggregation. These have no index since they are not in the aggregation,
        // so just add them to the end in non-deterministic order.
        if (aCurrentSelectedItems.length < aSelectedKeys.length) {

            aSelectedKeys.forEach(function(sKey) {

                if (!oCurrentSelectedItemsMap[sKey]) {
                    aSelectedItems.push(new sap.m.FacetFilterItem({
                        text : oSelectedKeys[sKey],
                        key : sKey,
                        selected : true
                    }));
                }
            });
        }
        return aSelectedItems;
    };

    com.zespri.awct.control.FacetFilterList.prototype.getSelectedItem = function() {

        var oItem = sap.m.ListBase.prototype.getSelectedItem.apply(this, arguments);
        var aSelectedKeys = Object.getOwnPropertyNames(this.getSelectedKeys());
        if (!oItem && aSelectedKeys.length > 0) {
            oItem = new sap.m.FacetFilterItem({
                text : this.getSelectedKeys()[aSelectedKeys[0]],
                key : aSelectedKeys[0],
                selected : true
            });
        }
        return oItem;
    };

    com.zespri.awct.control.FacetFilterList.prototype.removeSelections = function(bAll) {

        // See _resetItemsBinding to understand why we override the ListBase method
        if (this._allowRemoveSelections) {
            if (bAll) {
                this.setSelectedKeys();
            } else {
                sap.m.ListBase.prototype.removeSelections.call(this, bAll);
            }
        }
        return this;
    };

    com.zespri.awct.control.FacetFilterList.prototype.getSelectedKeys = function() {
        var oResult = {};
        var oKeys = this._oSelectedKeys;
        Object.getOwnPropertyNames(oKeys).forEach(function(key) {
            oResult[key] = oKeys[key];
        });
        return oResult;
    };

    com.zespri.awct.control.FacetFilterList.prototype.setSelectedKeys = function(oKeys) {

        this._oSelectedKeys = {};
        var bKeyAdded = false;
        if (oKeys) {
            Object.getOwnPropertyNames(oKeys).forEach(function(key) {
                this._addSelectedKey(key, oKeys[key]);
                bKeyAdded = true;
            }, this);
        }
        if (bKeyAdded) {
            this.setActive(true);
            this._selectItemsByKeys();
        } else {
            sap.m.ListBase.prototype.removeSelections.call(this);

            // CUSTOM CODE START
            // Clear the search bar
            this._searchValue = "";
            // CUSTOM CODE END
        }

        // CUSTOM CODE START
        this._updateFilterAppliedState();
        // CUSTOM CODE END
    };

    com.zespri.awct.control.FacetFilterList.prototype.removeSelectedKey = function(sKey, sText) {

        if (this._removeSelectedKey(sKey, sText)) {

            this.getItems().forEach(function(oItem) {
                var sItemKey = oItem.getKey() || oItem.getText();
                if (sKey === sItemKey) {
                    oItem.setSelected(false);
                }
            });
        }
    };

    com.zespri.awct.control.FacetFilterList.prototype.removeSelectedKeys = function() {
        this._oSelectedKeys = {};
        sap.m.ListBase.prototype.removeSelections.call(this, true);
    };

    com.zespri.awct.control.FacetFilterList.prototype.removeItem = function() {
        // Update the selected keys cache if an item is removed
        var oItem = sap.m.ListBase.prototype.removeItem.apply(this, arguments);
        if (!this._filtering) {
            if (oItem && oItem.getSelected()) {
                this.removeSelectedKey(oItem.getKey(), oItem.getText());
            }
            return oItem;
        }
    };

    /**
     * Control initialization.
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype.init = function() {
        this._firstTime = true;
        this._saveBindInfo = undefined;

        // The internal associative array of keys for selected items.
        // Items that were selected but currently are not in the model are included as well.
        this._oSelectedKeys = {};

        sap.m.List.prototype.init.call(this);
        this.setMode(sap.m.ListMode.MultiSelect);
        this.setIncludeItemInSelection(true);
        this.setGrowing(true);
        this.setRememberSelections(false);

        // Remember the search value so that it can be seeded into the search field
        this._searchValue = null;

        // Select items set from a variant when the growing list is updated
        this.attachUpdateFinished(function(oEvent) {

            // Make sure we don't call _selectItemsByKeys twice in the case when the
            // list is being filtered. The process of selecting items gets more and more
            // expensive as the number of items increases.
            // 
            // If the list is being filtered then items are already selected in updateItems.
            var sUpdateReason = oEvent.getParameter("reason");
            if (sUpdateReason) {
                sUpdateReason = sUpdateReason.toLowerCase();
                if (sUpdateReason !== sap.ui.model.ChangeReason.Filter.toLowerCase()) {
                    this._selectItemsByKeys();
                }
            } else {
                this._selectItemsByKeys();
            }
        });

        this._allowRemoveSelections = true;

        // CUSTOM CODE START ---
        // Listen for own 'selectionChange' event.
        this.attachSelect(this._handleSelect);
        this.attachListOpen(this._handleListOpen);

        // The 'select all' checkbox (if available) is an association of the standard FacetFilterList. The select / selectionChange events are not
        // fired for
        // checkbox select/deselect, so listening for that separately.
        if (this.getAssociation("allcheckbox")) {
            sap.ui.getCore().byId(this.getAssociation("allcheckbox")).attachSelect(this._handleAllCheckboxSelect);
        }
        // Manage NoData Texts , listen for list update EVENT
        com.zespri.awct.util.CommonHelper.manageNoDataText(this);
        // --- CUSTOM CODE END
    };

    /**
     * Event handler for the 'select' event of the FacetFilterList.
     * 
     * @memberOf com.zespri.awct.control.FacetFilterList
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._handleSelect = function() {
        this._setFilterModified(true);
    };

    /**
     * Event handler for the 'listOpen' event of the FacetFilterList
     * 
     * @memberOf com.zespri.awct.control.FacetFilterList
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._handleListOpen = function() {
        // Clear the 'filtersModifiedAfterListOpen' property of the FacetFilter
        this._setFilterModified(false);
    };

    /**
     * Event handler for the 'select' event of the "Select All" checkbox.
     * 
     * @memberOf com.zespri.awct.control.FacetFilterList
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._handleAllCheckboxSelect = function() {
        // If the user checked/unchecked the 'Select all' checkbox, it counts as a modification.
        this._setFilterModified(true);
    };

    /**
     * Helper method to set the filtersModifiedAfterListOpen custom property on the associated FacetFilter.
     * 
     * @param {Boolean}
     *            bModified True, if the 'FacetFilter' control (that contains all the FacetFilterList controls) should be set to 'dirty' state to
     *            indicate that it has been modified by the user. False, otherwise. *
     * @memberOf com.zespri.awct.control.FacetFilterList
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._setFilterModified = function(bModified) {
        // Set the filtersModifiedAfterListOpen custom property on the associated FacetFilter control.
        var oFacetFilter = sap.ui.getCore().byId(this.getAssociation("facetFilter"));
        oFacetFilter.setProperty("filtersModifiedAfterListOpen", bModified, true);
    };

    /**
     * ListBase method override needed to prevent selected keys from being removed by removeSelections when the 'items' binding is reset.
     * 
     * ListBase._resetItemsBinding calls removeSelections(), which is also overridden by FacetFilterList so that selected keys (i.e. cached selected
     * items) are removed if bAll is true. If this method was not overridden then selected keys will be removed when 'items' is bound or when the
     * model is set. This presents a dilemma for applications that want to load items from a listOpen event handler by setting the model. In that
     * scenario it would be impossible to restore selections from a variant since selected keys must be set outside of the listOpen handler (otherwise
     * the facet button or summary bar would not display pre-selected items until after the list was opened and then closed).
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._resetItemsBinding = function() {

        if (this.isBound("items")) {

            this._searchValue = null; // Clear the search value since items are being reinitialized
            this._allowRemoveSelections = false;
            sap.m.ListBase.prototype._resetItemsBinding.apply(this, arguments);
            this._allowRemoveSelections = true;
        }
    };

    /**
     * @private
     */

    com.zespri.awct.control.FacetFilterList.prototype._fireListCloseEvent = function() {

        var aSelectedItems = this.getSelectedItems();
        var oSelectedKeys = this.getSelectedKeys();

        var bAllSelected = aSelectedItems.length === 0;

        this._firstTime = true;

        this.fireListClose({
            selectedItems : aSelectedItems,
            selectedKeys : oSelectedKeys,
            allSelected : bAllSelected
        });

    };

    /**
     * Set this list active if at least one list item is selected, or the all checkbox is selected
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._updateActiveState = function() {

        var oCheckbox = sap.ui.getCore().byId(this.getAssociation("allcheckbox"));
        if (Object.getOwnPropertyNames(this._oSelectedKeys).length > 0 || (oCheckbox && oCheckbox.getSelected())) {
            this.setActive(true);
        }
    };

    /**
     * Handle both liveChange and search events.
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._handleSearchEvent = function(oEvent) {

        var sSearchVal = oEvent.getParameters().query;
        if (sSearchVal === undefined) {
            sSearchVal = oEvent.getParameters().newValue;
        }
        this._search(sSearchVal);

        // If search was cleared and a selected item is made visible, make sure to set the
        // checkbox accordingly.
        this._updateSelectAllCheckBox();
    };

    /**
     * Filter list items with the given search value. If an item's text value does not contain the search value then it is filtered out of the list.
     * 
     * No search is done if the list is not bound to a model.
     * 
     * @private
     */

    com.zespri.awct.control.FacetFilterList.prototype._search = function(sSearchVal, force) {

        var bindingInfoaFilters;
        var numberOfsPath = 0;

        if (force || (sSearchVal !== this._searchValue)) {
            this._searchValue = sSearchVal;
            var oBinding = this.getBinding("items");
            var oBindingInfo = this.getBindingInfo("items");
            if (oBindingInfo && oBindingInfo.binding) {
                bindingInfoaFilters = oBindingInfo.binding.aFilters;
                if (bindingInfoaFilters.length > 0) {
                    numberOfsPath = bindingInfoaFilters[0].aFilters.length;
                    if (this._firstTime) {
                        this._saveBindInfo = bindingInfoaFilters[0].aFilters[0];
                        this._firstTime = false;
                    }
                }
            }

            if (oBinding) { // There will be no binding if the items aggregation has not been bound to a model, so search is not
                // possible
                var oFinalFilter = [];
                if (sSearchVal || numberOfsPath > 0) {
                    var path = this.getBindingInfo("items").template.getBindingInfo("text").parts[0].path;
                    if (path) {
                        var oUserFilter = new sap.ui.model.Filter(path, sap.ui.model.FilterOperator.Contains, sSearchVal);
                        if (numberOfsPath > 1) {
                            oFinalFilter = new sap.ui.model.Filter([oUserFilter, this._saveBindInfo], true);
                        } else {
                            if (this._saveBindInfo > "" && oUserFilter.sPath !== this._saveBindInfo.sPath) {
                                oFinalFilter = new sap.ui.model.Filter([oUserFilter, this._saveBindInfo], true);
                            } else {
                                if (sSearchVal === "") {
                                    oFinalFilter = [];
                                } else {
                                    oFinalFilter = new sap.ui.model.Filter([oUserFilter], true);
                                }
                            }
                        }
                        oBinding.filter(oFinalFilter, sap.ui.model.FilterType.Control);
                    }
                } else {
                    oBinding.filter([], sap.ui.model.FilterType.Control);
                }
            } else {
                jQuery.sap.log.warning("No filtering performed", "The list must be defined with a binding for search to work", this);
            }
        }

    };

    /**
     * 
     * @returns The last searched value
     */
    com.zespri.awct.control.FacetFilterList.prototype._getSearchValue = function() {

        return this._searchValue;
    };

    /**
     * Update the select all checkbox according to the state of selections in the list and the list active state. This has no effect for lists not in
     * MultiSelect mode.
     * 
     * @param bItemSelected
     *            The selection state of the item currently being selected or deselected.
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._updateSelectAllCheckBox = function(bItemSelected) {

        if (this.getMultiSelect()) {
            var oCheckbox = sap.ui.getCore().byId(this.getAssociation("allcheckbox"));

            if (oCheckbox) {
                if (bItemSelected) {
                    oCheckbox.setSelected(false);
                } else {
                    // Checkbox may not be defined if an item is selected and the list is not displayed
                    oCheckbox.setSelected(Object.getOwnPropertyNames(this._oSelectedKeys).length === 0 && this.getActive());
                }
            }
        }
    };

    // CUSTOM CODE START ---
    /**
     * Update the filterApplied state for the Facet filter list . If list item is selected , filterApplied state will be true else false.
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._updateFilterAppliedState = function() {
        if (Object.getOwnPropertyNames(this._oSelectedKeys).length === 0) {
            this.setProperty("filterApplied", false);
        } else {
            this.setProperty("filterApplied", true);
        }
    };
    // --- CUSTOM CODE END

    /**
     * Add a key to the selected keys cache.
     * 
     * @param sKey
     * @param sText
     */
    com.zespri.awct.control.FacetFilterList.prototype._addSelectedKey = function(sKey, sText) {

        if (!sKey && !sText) {
            jQuery.sap.log.error("Both sKey and sText are not defined. At least one must be defined.");
            return;
        }
        if (this.getMode() === sap.m.ListMode.SingleSelectMaster) {
            this.removeSelectedKeys();
        }
        if (!sKey) {
            sKey = sText;
        }
        this._oSelectedKeys[sKey] = sText || sKey;
    };

    /**
     * Remove the given key from the selected keys cache. This does not deselect the associated item and therefore does not cause onItemSetSelected to
     * be called.
     * 
     * @param sKey
     *            The key to remove. If null, then the value of sText will be used as the key.
     * @param sText
     *            If key is null then this parameter will be used as the key.
     * @returns {Boolean} true if the key was removed
     */
    com.zespri.awct.control.FacetFilterList.prototype._removeSelectedKey = function(sKey, sText) {

        if (!sKey && !sText) {
            jQuery.sap.log.error("Both sKey and sText are not defined. At least one must be defined.");
            return false;
        }

        // Since it is common for applications to use text as the key (and not set key), set the key to the text value if no key is given
        if (!sKey) {
            sKey = sText;
        }
        delete this._oSelectedKeys[sKey];
        return true;
    };

    /**
     * Determine the selected state of the given item. The item's text value will be used as the lookup key if the item does not have a key set. This
     * is done for convenience to allow applications to only set the item text and have it used also as the key.
     * 
     * @param oItem
     * @returns true if the item is selected, false otherwise
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._isItemSelected = function(oItem) {
        return !!(this._oSelectedKeys[oItem && (oItem.getKey() || oItem.getText())]);
    };

    /**
     * For each item key in the selected keys cache, select the matching FacetFilterItem present in the 'items' aggregation.
     * 
     * @private
     */
    com.zespri.awct.control.FacetFilterList.prototype._selectItemsByKeys = function() {
        this.getItems().forEach(function(oItem) {
            oItem.setSelected(this._isItemSelected(oItem));
        }, this);
    };

    com.zespri.awct.control.FacetFilterList.prototype.onItemSetSelected = function(oItem, bSelect) {

        // This method override runs when setSelected is called from ListItemBase. Here we update
        // the selected keys cache based on whether the item is being selected or not. We also
        // update the select all checkbox state and list active state based on the selected
        // state of all items taken as a whole.
        if (bSelect) {
            this._addSelectedKey(oItem.getKey(), oItem.getText());
        } else {
            this._removeSelectedKey(oItem.getKey(), oItem.getText());
        }
        sap.m.ListBase.prototype.onItemSetSelected.apply(this, arguments);

        this._updateSelectAllCheckBox(bSelect);

        // CUSTOM CODE START
        // Update the filters applied flag state
        this._updateFilterAppliedState();
        // CUSTOM CODE END

        this.setActive(this.getActive() || bSelect);
        if (!this.getDomRef() && this.getParent() && this.getParent().getDomRef()) {
            this.getParent().invalidate();
        }
    };

    com.zespri.awct.control.FacetFilterList.prototype.updateItems = function(sReason) {

        // This method override runs when the list updates its items. The reason
        // for the update is given by sReason, which for example can be when the
        // list is filtered or when it grows.
        this._filtering = sReason === sap.ui.model.ChangeReason.Filter;
        sap.m.ListBase.prototype.updateItems.apply(this, arguments);
        this._filtering = false;
        // If this list is not set to growing or it has been filtered then we must make sure that selections are
        // applied to items matching keys contained in the selected keys cache. Selections
        // in a growing list are handled by the updateFinished handler.
        if (!this.getGrowing() || sReason === sap.ui.model.ChangeReason.Filter) {
            this._selectItemsByKeys();
        }
    };
})();
