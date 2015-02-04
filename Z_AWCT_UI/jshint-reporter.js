"use strict";

module.exports = {
  reporter: function (res) {
    var len = res.length;
    var str = "";

    // Header
    str += "Filepath , Type, Code, Line , Column , Reason , Evidence \n"

    res.forEach(function (r) {
      var file = r.file;
      var err = r.error;

      str += file + ", " 
              + err.id + ", "
              + err.code + ", "
              + err.line + ", "
              + err.character + ", "
              + err.reason + ", "
              + err.evidence + "\n";
    });

    if (str) {
      process.stdout.write(str + "\n" + len + " error" +
        ((len === 1) ? "" : "s") + "\n");
    }
  }
};