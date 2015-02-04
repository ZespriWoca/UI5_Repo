(function() {
    "use strict";

    var oView;
    var oController;
    var oRouter = sap.ui.getCore().getRootComponent().getRouter();
    module("com.zespri.awct.test.alloc.EditOrderAllocation", {
        setup : function() {
            oView = sap.ui.xmlview("com.zespri.awct.alloc.view.EditOrderAllocation");
            oController = oView.getController();
            oView.setModel(sap.ui.getCore().getRootComponent().getModel());
        },
        teardown : function() {
            oRouter.navTo("/");
        }
    });

    /* Check that crucial UI elements are always in the view and are not hidden */
    test("Checking for UI elements that should always be in the view", function() {
        ok(oView.byId("deliveryObjectHeader") && oView.byId("deliveryObjectHeader").getVisible(), "Delivery object header");
        ok(oView.byId("facetFilterAllocation") && oView.byId("facetFilterAllocation").getVisible(), "Facet filter");
        ok(oView.byId("supplierFacetList") && oView.byId("supplierFacetList").getVisible(), "Supplier facet filter list");
        ok(oView.byId("materialFacetList") && oView.byId("materialFacetList").getVisible(), "Material facet filter list");
        ok(oView.byId("allocationTable") && oView.byId("allocationTable").getVisible(), "Allocation table");
        ok(oView.byId("saveButton") && oView.byId("saveButton").getVisible(), "Save button");
        ok(oView.byId("discardChangesButton") && oView.byId("discardChangesButton").getVisible(), "Discard changes button");
    });

    /* Simulate a route pattern with a mock DeliveryHeader */
    asyncTest("Simulating hash #/DeliveryHeaderSet(DeliveryHeaderID='DeliveryHeaderID 1')", function() {
        // Spy on _refreshTable method
        var oRefreshTableSpy = sinon.spy(oController, "_refreshTable");
        var oInitTableSpy = sinon.spy(oController, "_initTableConfiguration");
        var oInitFacetListsSpy = sinon.spy(oController, "_initFacetFilterLists");

        // Render view
        oView.placeAt("content", "only");

        oRouter.navTo("Allocation/EditOrderAllocation", {
            contextPath : "DeliveryHeaderSet(DeliveryHeaderID='DeliveryHeaderID 1')"
        });

        // To keep it simple, we just wait for 2 seconds before checking on spies.
        window.setTimeout(function() {
            QUnit.start();
            ok(oRefreshTableSpy.calledOnce, "_refreshTable was invoked once");
            ok(oInitTableSpy.calledOnce, "_initTableConfiguration was invoked once");
            ok(oInitFacetListsSpy.calledOnce, "_initFacetFilterLists was invoked once");
        }, 1000);
    });
})();