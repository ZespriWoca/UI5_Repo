(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterDateInputList");
    jQuery.sap.require("com.zespri.awct.control.FacetFilterList");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.control.DatePicker");

    /**
     * @classdesc This control is to be used for lists within the com.zespri.awct.control.FacetFilter control that need to get a Date as input from the user.
     * 
     * <p>
     * Usage
     * </p>
     * <ul>
     * <li>getSelectedItems() returns an array of exactly one object. This object has a getKey() method which returns the selected date as a string.
     * This string has the structure : "2014-01-23". If there is no date selected, an empty array is returned.</li>
     * <li>To clear the selected date, setSelectedKeys() must be invoked without any parameters.</li>
     * </ul>
     * 
     * <p>
     * Known Limitations
     * </p>
     * <ul>
     * <li>There is currently no API for 'setting' (e.g prefilling) a value in the DateTimeInput control within this list. This is planned to be
     * developed when (and if) the need arises.</li>
     * </ul>
     * @class
     * @name com.zespri.awct.control.FacetFilterDateInputList
     * @class
     */
    com.zespri.awct.control.FacetFilterList.extend("com.zespri.awct.control.FacetFilterDateInputList",
    /** @lends com.zespri.awct.control.FacetFilterDateInputList */
    {
        metadata : {
            associations : {
                "dateInput" : {
                    type : "com.zespri.awct.control.DatePicker"
                }
            }
        },
        renderer : "com.zespri.awct.control.FacetFilterDateInputListRenderer",

        /**
         * Standard lifecycle init method. Here, a new instance of <i>sap.ui.commons.DatePicker</i> is created and associated with this control.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         */
        init : function() {
            com.zespri.awct.control.FacetFilterList.prototype.init.apply(this);
            var oControl = this;
            // Creating a datepicker
            this.setDateInput(new com.zespri.awct.control.DatePicker({
                change : [this._handleDateInputChange, oControl]
            }));
        },

        /**
         * This method overrides the standard method with the same name. This is done, so that this FacetFilterList control can be consumed in a
         * similar way to standard <i>sap.m.FacetFilterList</i>s. This is invoked without parameters, for resetting the control. The keys aren't
         * actually set (as one would expect from setSelectedKeys). This is deliberate, as programmatically setting the selected date is not supported
         * as of now (as mentioned in the control's JsDoc)
         * 
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         */
        setSelectedKeys : function(aKeys) {
            if (!aKeys) {
                var oDateTimeInput = sap.ui.getCore().byId(this.getDateInput());
                oDateTimeInput.setValue(null);
                oDateTimeInput.rerender();
                // Set Filter applied = false , when facet filter is reseted
                this.setProperty("filterApplied", false);
            }
        },

        /**
         * Event handler for the 'change' event of the CheckBox. This is used to notify the associated FacetFilter control that the user has modified
         * it.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         */
        _handleDateInputChange : function() {
            var oFacetFilter = sap.ui.getCore().byId(this.getAssociation("facetFilter"));
            oFacetFilter.setProperty("filtersModifiedAfterListOpen", true, true);

            // Set FilterApplied = true , when date input field is changed
            this.setProperty("filterApplied", true);
        },

        /**
         * This method converts a YYYYMMDD string into its corresponding Edm.DateTime representation. (e.g datetime'2000-12-25T12:00')
         * 
         * 
         * @private
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         */
        _getExternalFormatValue : function(sDateValue) {
            var sYear = sDateValue.substring(0, 4);
            var sMonth = sDateValue.substring(4, 6);
            var sDate = sDateValue.substring(6, 8);
            return sYear + "-" + sMonth + "-" + sDate;
        },

        /**
         * Event handler for press of the 'Clear' button.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         * @private
         */
        _handleClearButtonPress : function() {
            this.setSelectedKeys();

            // Set fiterApplied = false , when date input field is cleared
            this.setProperty("filterApplied", false);
        },

        /**
         * This method overrides the standard method with the same name. This has been done to keep the consumption of this control's APIs as similar
         * as possible to the standard <i>sap.m.FacetFilterList</i>
         * 
         * @return {Array} Returns an array with exactly one object with a 'getKey' method (this is used while consuming this control, to get the
         *         selected date)
         * @memberOf com.zespri.awct.control.FacetFilterDateInputList
         */
        getSelectedItems : function() {
            // The standard control returns an array of list items, with getKey() being one of each list item's methods. Trying to 'fake' the same
            // thing here to make the control easy to consume.
            var oDateTimeInput = sap.ui.getCore().byId(this.getDateInput());
            if (oDateTimeInput && oDateTimeInput.getValue()) {
                return [{
                    _sKey : this._getExternalFormatValue(oDateTimeInput.getYyyymmdd()),
                    getKey : function() {
                        return this._sKey;
                    }
                }];
            } else {
                return [];
            }
        }
    });

})();
