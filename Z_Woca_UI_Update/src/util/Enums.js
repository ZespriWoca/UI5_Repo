(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.Enums");

    /**
    @classdesc This class contains all the enums that are available for the AWCT application
    @class
    @name com.zespri.awct.util.Enums
    */
    com.zespri.awct.util.Enums = {
        /* @enum {string} */
        NotificationType : {
            Error : "ERROR",
            Warning : "WARNING",
            Info : "INFO",
            Success : "SUCCESS",
            None : "NONE"
        },
        /* @enum {string} */
        ViewBCOperation : {
            Exclude : "E",
            Include : "I"
        },
        /* @enum {string} */
        AuthorizationMode : {
            None : "00",
            Maintain : "02",
            Display : "03"
        },
        /* @enum {string} */
        AuthorizationFunctions : {
            All : "*",
            ZSUP : "ZSUP",
            ZESP : "ZESP",
            ZADM : "ZADM"
        },
        /* @enum {string} */
        AuthorizationObject : {
            Allocation : "ZAWCT_ALLO",
            Collaboration : "ZAWCT_COLB",
            Reports : "ZAWCT_REPS",
            Administration : "ZAWCT_ADMN"
        },

        /* @enum {string} */
        AllocationLineRecordType : {
            DeliveryLine : "D",
            SupplierOrderLine : "A"
        },
        /* @enum {string} */
        ExemptionStatus : {
            NONE : "",
            PENDING : "P",
            COMPLETE : "C"
        },
        /* @enum {string} */
        TradeType : {
            Inbound : "I",
            Outbound : "O",
            Open : "OP"
        },
        /* @enum {string} */
        TradeStatus : {
            Initiated : "I",
            Accepted : "A",
            Rejected : "R",
            Expired : "E",
            PartiallyAccepted : "P",
            Cancelled : "C"
        },

        /* @enum {string} */
        DeliveryStatus : {
            NotStarted : "E0001",
            InProgress : "E0002",
            Released : "E0003",
            Locked : "E0004"
        },

        /* Admin */
        /* @enum {string} */
        ViewMode : {
            Add : "Add",
            Modify : "Edit"
        }
    };
})();