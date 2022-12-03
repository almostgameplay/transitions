'use strict';
var Path = require("path");
var childProcess = require("child_process")
module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      Editor.Panel.open('encrypt');
    },
    'start-encrypt' (e,args) {
      Editor.log('Hello World!');
      // send ipc message to panel

      try {
        let sh = Path.join(__dirname, "encrypt.js");
        var { assetPath, } = args;
        var param = ` -a ${assetPath}`;
        childProcess.execSync("node " + sh + param);
        Editor.Ipc.sendToPanel(
            "encrypt",
            "update-status",
            "加密成功"
        );
      } catch (e) {
          Editor.success(e);
          Editor.Ipc.sendToPanel("encrypt", "update-status", e);
      }
    },
  },
};