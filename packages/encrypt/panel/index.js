var Path = require("fire-path");

// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    .input-row{
      height: 40px;
    }
    ui-input{
      width: 300px;
    }
    .input-row span{
      letter-spacing: 2px;
      margin-right:10px;
    }
    ui-button{
      margin: 0 10px;
    }
  `,

  template: `
    <h2>加密工具</h2>
    <hr />
    <div class="input-row layout horizontal center">
      <span>构建资源路径:</span>
      <ui-input id="input-asset-path" readonly></ui-input>
      <ui-button id="asset-btn"><i class="icon-link-ext"></i></ui-button>
    </div>

    <hr />
    <div>状态: <span id="label">--</span></div>

    <hr />

    <ui-button id="btn">加密</ui-button>

  `,
  $: {
    btn: "#btn",
    label: "#label",
    assetBtn: "#asset-btn",
    inputAssetPath: "#input-asset-path",
},

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.$btn.addEventListener('confirm', () => {
      var config = {};
      config.assetPath = this.$inputAssetPath.value;
      if (!config.assetPath) {
          this.$label.innerText = "构建资源路径不能为空....";
          return;
      }
 
      Editor.Ipc.sendToMain("encrypt:start-encrypt", config);

      this.$label.innerText = "progressing....";
    });
    this.$assetBtn.addEventListener("confirm", () => {
      var path = Editor.Dialog.openFile({
          defaultPath: Editor.Project.path,
          properties: ["openDirectory"],
      });
      this.$inputAssetPath.value = path;
  });
  },

  // register your ipc messages here
  messages: {
    "update-status": function (event, args) {
        this.$label.innerText = args;
    },
},
});