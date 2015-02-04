/*
 * AWCT Test Suite
 */

QUnit.config.testTimeout = 60000;

// tests to run
jQuery.sap.require("com.zespri.awct.test.I18NTest");
jQuery.sap.require({
    modName : "com.zespri.awct.test.alloc.EditOrderAllocation",
    type : "qunit"
});
