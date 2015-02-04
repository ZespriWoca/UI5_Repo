(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.TableRowActionsExtension");

    /**
     * @classdesc This extension class is built for having row-level actions in tables.
     * 
     * <p>
     * <b>Usage and behavior</b><br/> The controller must instantiate an instance of this class and provide an sap.m.Table as an association. It
     * must also set a control for the 'actionsContent' aggregation (for example, a Horizontal Layout with buttons). When the <i>showRowActions</i>
     * method is called with the context of one of the rows, the corresponding row is faded out and the <i>actionsContent</i> control slides in from
     * the right. Clicking anywhere outside the actionsContent will result in the row fading back in, and the <i>actionsContent</i> control slides
     * out of the screen.
     * </p>
     * 
     * <p>
     * <b>Associations</b><br/>
     * <ul>
     * <li> table : The table that is associated with this instance of TableRowActionsExtension </li>
     * </ul>
     * </p>
     * 
     * <p>
     * <b>Aggregations</b><br/>
     * <ul>
     * <li> actionsContent : The UI5 control that slides in from the right-edge of the table when the showRowActions method is called. </li>
     * </ul>
     * </p>
     * 
     * <p>
     * <b>Events</b><br/>
     * <ul>
     * <li> onBeforeActionsVisible : This event is fired just before the <i>actionsContent</i> control slides into a row. This event can be handled
     * by the controller to either modify the <i>actionsContent</i> control based on the row context, or to cancel the event.</li>
     * </ul>
     * </p>
     * @class
     * @name com.zespri.awct.util.TableRowActionsExtension
     */
    sap.ui.base.ManagedObject.extend("com.zespri.awct.util.TableRowActionsExtension", /** @lends com.zespri.awct.util.TableRowActionsExtension */
    {
        metadata : {
            associations : {
                "table" : {
                    type : "sap.m.Table"
                }
            },
            aggregations : {
                "actionsContent" : {
                    multiple : false,
                    type : "sap.ui.core.Control"
                }
            },
            events : {
                "onBeforeActionsVisible" : {}
            }
        },

        // Stores a reference to the jQuery object representing the currently active row.
        _$activeRow : null,
        // Boolean flag to represent an internal state : whether a row is currently 'being' deactivated.. ie, whether there are animations in
        // progress. If another row needs to be activated while this flag is true, the activation needs to wait till the ongoing animation ends.
        _bDeactivating : null,
        // Stores a reference to the jQuery object representing the row that needs to be activated, but is waiting for an ongoing animation to end.
        _$queuedRow : null,
        // The binding context of _$queuedRow.
        _oQueuedContext : null,

        /**
         * Shows the 'actionsContent' control for the row for which binding context is passed as an argument. This row must be within the associated
         * table.
         * 
         * @param {sap.ui.model.Context}
         *            oRowContext The context of the row within the associated table, that needs to be activated.
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        showRowActions : function(oRowContext) {
            // Get the DOM ref for the row for which actions need to be shown
            var $row = this._getRowDomRefByContext(oRowContext);

            // This will never happen, but still..
            if (!$row) {
                return;
            }

            // Ready!
            if (this._bDeactivating) {
                // A row is already being deactivated.. Queue this activation (will be done after deactivation is complete)
                this._$queuedRow = $row;
                this._oQueuedContext = oRowContext;
            } else {
                // Activate!
                this._activateRow($row, oRowContext);
            }

            // Listen for clicks/taps (based on device type) anywhere in the document
            var sEventName = (jQuery.device.is.tablet || jQuery.device.is.phone) ? 'touchend' : 'mouseup';
            $(document).on(sEventName, jQuery.proxy(this._handleOutsideClick, this));
        },

        /**
         * Hides the 'actionsContent' control if it is being shown.
         * 
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        hideRowActions : function() {
            if (this._$activeRow) {
                this._deactivateRow(this._$activeRow);
            }
        },

        /**
         * Event handler for clicks outside the 'actionsContent' container. This is used to detect when 'actionsContent' needs to be hidden.
         * 
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        _handleOutsideClick : function() {
            // Event is relevant only if the click is NOT within .zAwctTableRowActions
            if ($(event.target).closest('.zAwctTableRowActions').length) {
                return;
            }

            // We've got our event. Stop listening for it further.
            var sEventName = (jQuery.device.is.tablet || jQuery.device.is.phone) ? 'touchend' : 'mouseup';
            $(document).off(sEventName, jQuery.proxy(this._handleOutsideClick, this));

            // Deactivate the active row.
            this._deactivateRow(this._$activeRow);
        },

        /**
         * Event handler for window resize events. If the window is resized while table row actions are being shown, the height and position of the
         * 'row actions' DIV also needs to be recalculated and updated (because as a result of the resize, the table's row's height could have changed
         * due to text wrapping)
         * 
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        _handleWindowResize : function() {
            // Get the active row's height and top
            var iHeight = this._$activeRow.height();
            var iTop = this._$activeRow.position().top;

            // Update the height of the row actions DIV
            var $actionsContainer = $(".zAwctTableRowActions");
            $actionsContainer.css("height", iHeight);
            $actionsContainer.css("top", iTop);
        },

        /**
         * Deactivates a row (restores opacity + slides out 'actionsContent')
         * 
         * @param {jQuery.Object}
         *            $row jQuery reference to the DOM \<tr\> that needs to be deactivated.
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        _deactivateRow : function($row) {
            this._bDeactivating = true;
            var oExtension = this;

            // Fade in row
            $row.animate({
                opacity : 1
            }, 'fast');

            // Fly out actions
            var $actionsContainer = $(".zAwctTableRowActions");
            var iNewRight = -1 * $actionsContainer.width();
            $actionsContainer.animate({
                right : iNewRight
            }, 'fast', function() {
                oExtension._bDeactivating = false;
                $actionsContainer.hide();

                // If no row is active, we are no longer interested in the window's 'resize' event!
                $(window).off("resize", jQuery.proxy(this._handleWindowResize, this));

                // If there is a row waiting to get activated, now it's its turn.
                if (oExtension._$queuedRow) {
                    oExtension._activateRow(oExtension._$queuedRow, oExtension._oQueuedContext);
                    oExtension._$queuedRow = null;
                    oExtension._oQueuedContext = null;
                }
            });
        },

        /**
         * Activates a row (reduces opacity + slides in 'actionsContent')
         * 
         * @param {jQuery.Object}
         *            $row jQuery reference to the DOM \<tr\> that needs to be activated.
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        _activateRow : function($row, oRowContext) {
            // Bind the 'actions' content to the row's context
            var oContent = this.getActionsContent();

            // Force the formatters to fire again, by resetting the binding context
            oContent.setBindingContext(null);
            oContent.setBindingContext(oRowContext);

            // Fire the onBeforeActionsVisible event. Give the controller a chance to change the actions content (or cancel showing row actions)
            // before it is shown.
            var bProceed = this.fireOnBeforeActionsVisible({
                actionsContent : oContent,
                rowContext : oRowContext
            }, true);

            // If the event was cancelled, don't do anything.
            if (!bProceed) {
                return;
            }

            // The '.zAwctTableRowActions' DIV might be open for a different table (that's still in the DOM, but not visible). If the parent isn't
            // the current table, then destroy this DIV (and re-create it in the right place later)
            if ($(".zAwctTableRowActions").parent()[0] !== sap.ui.getCore().byId(this.getTable()).$()[0]) {
                $(".zAwctTableRowActions").remove();
            }

            // Prepare
            if (!$(".zAwctTableRowActions").length) {
                sap.ui.getCore().byId(this.getTable()).$().append("<div class='zAwctTableRowActions'/>");
            }

            // Get the position of this row relative to the table.
            var $actionsContainer = $(".zAwctTableRowActions");
            var iTop = $row.position().top;
            var iHeight = $row.height();

            // Actions content is a UI5 object. We need to get its DOM representation.
            var oActionsContent = this.getActionsContent();
            var oRm = sap.ui.getCore().createRenderManager();
            oRm.renderControl(oActionsContent);
            oRm.flush($actionsContainer.get(0), true);

            // Position the actions container (outside the screen)
            $actionsContainer.css("top", iTop);
            $actionsContainer.css("right", -1 * ($actionsContainer.width()));
            $actionsContainer.css("height", iHeight);

            // Fade out row
            $row.animate({
                opacity : 0.3
            }, 'fast');

            // Set as active
            this._$activeRow = $row;

            // Fly in actions (into the screen)
            $actionsContainer.show();
            $actionsContainer.animate({
                right : 0
            }, 'fast');

            // Listen for window resize events while the row actions are being shown. The actions DIV also needs to be resized and repositioned.
            $(window).on("resize", jQuery.proxy(this._handleWindowResize, this));
        },

        /**
         * This non-UI class is rendering content on the UI, and the framework looks for this method. A dummy implementation suffices. TODO : Why is
         * the framework looking for this method? Are we missing something else?
         * 
         * @returns null
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        getUIArea : function() {
            return null;
        },

        /**
         * Returns a jQuery object that represents the \<tr\> corresponding to the row context passed as argument.
         * 
         * @param {sap.ui.model.Context}
         *            oContext The context for which a row within the associated table needs to be found.
         * @private
         * @memberOf com.zespri.awct.util.TableRowActionsExtension
         */
        _getRowDomRefByContext : function(oContext) {
            // Get DOM for all rows of our table
            var oTable = sap.ui.getCore().byId(this.getAssociation("table"));
            var aRows = oTable.$().find("tr:not(.sapMListTblHeader)");

            // Loop through all rows to get the <tr> with matching binding context
            var $matchedRow = null;
            $.each(aRows, function(i, domRow) {
                var $row = $(domRow);

                // Assuming that each row has atleast one 'Text' cell which can be used to get the row's binding context. If rows are grouped, then
                // group header rows will not have such a cell. So we ignore such rows.
                var oCell = sap.ui.getCore().byId($row.find(".sapMText:first").attr("id"));
                if (!oCell) {
                    return true;
                }

                // If the binding context matches with the binding context that we're looking for, we've found the row!
                var oRowContext = oCell.getBindingContext();
                if (oRowContext.getPath() === oContext.getPath()) {
                    $matchedRow = $row;
                    return false;
                }
            });

            return $matchedRow;
        }
    });
})();
