/*
 * QUnit test for testing I18NHelper class
 */
module("com.zespri.awct.test.I18NTest");

jQuery.sap.require("com.zespri.awct.util.I18NHelper");

test("Supplier Orders Check", function() {

    // Testing I18NHelper class
    ok(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SUPPLIERORDERS_DECLARE_SHORTAGE_TITLE") === "Declare Shortage",
            "Tested : Declare shortage I18N");
});
