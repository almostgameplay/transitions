function ValideVersion(version) {
    if (!version) return false;
    var strs = version.split(".");
    if (strs.length == 0) return false;
    for (let index = 0; index < strs.length; index++) {
        var a = Number(strs[index]);
        if (isNaN(a)) {
            return false;
        }
    }
    return true;
}

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
      <h2>热更资源工具</h2>
      <hr />
      <div class="input-row layout horizontal center">
        <span>服务器地址:</span>
        <ui-input id="input-server" placeholder="服务器地址"></ui-input>
      </div>
      <div class="input-row layout horizontal center">
        <span>热更版本号:</span>
        <ui-input id="input-version" placeholder="热更版本号"></ui-input>
      </div>
      <div class="input-row layout horizontal center">
        <div><span>apk版本号:</span></div>
        <ui-input id="input-apk-version" placeholder="apk版本号"></ui-input>
        <span>(本地最低apk版本号)</span>
      </div>
      <div class="input-row layout horizontal center">
        <span>构建资源路径:</span>
        <ui-input id="input-asset-path" readonly></ui-input>
        <ui-button id="asset-btn"><i class="icon-link-ext"></i></ui-button>
      </div>
      <div class="input-row layout horizontal center">
        <ui-checkbox id="switch">是否更新本地project.manifest</ui-checkbox>
      </div>
      <hr />

      <ui-button id="btn">生成manifest</ui-button>
      <ui-button id="stage">上传测试环境</ui-button>
      <ui-button id="release">上传发布环境</ui-button>

      <div>状态: <span id="label">--</span></div>

      <hr />
      <div class="input-row layout horizontal center">
        <span>端口号:</span>
        <ui-input id="input-port"></ui-input>
      </div>
      <ui-button id="local-server">启动本地服务</ui-button>

    `,

    $: {
        btn: "#btn",
        release: "#release",
        stage: "#stage",
        assetBtn: "#asset-btn",
        localServerBtn: "#local-server",
        label: "#label",
        inputServer: "#input-server",
        inputVersion: "#input-version",
        inputFVersion: "#input-apk-version",
        inputAssetPath: "#input-asset-path",
        inputPort: "#input-port",
        updateLocalSwitch: "#switch",
    },

    ready() {
        this.$inputPort.value = 8000;
        var setup = (config) => {
            this.$inputVersion.value = config.version;
            this.$inputFVersion.value = config.fversion;
            this.$inputAssetPath.value = config.assetPath;
            this.$inputServer.value = config.serverPath;
        };
        Editor.Ipc.sendToMain("hot-update:panel-ready", (err, config) => {
            Editor.log(err, config);
            if (config) {
                Editor.log("local config:", config);
                config = JSON.parse(config);
                setup(config);
                try {
                } catch (error) {}
            }
        });

        this.$updateLocalSwitch.addEventListener("change", (e) => {
            UpdateLocalPorject = !!e;
        });
        this.$assetBtn.addEventListener("confirm", () => {
            var path = Editor.Dialog.openFile({
                defaultPath: Editor.Project.path,
                properties: ["openDirectory"],
            });
            this.$inputAssetPath.value = path;
        });

        this.$btn.addEventListener("confirm", () => {
            var config = {};

            config.version = this.$inputVersion.value;
            config.fversion = this.$inputFVersion.value;
            config.assetPath = this.$inputAssetPath.value;
            config.serverPath = this.$inputServer.value;

            if (!ValideVersion(config.version)) {
                this.$label.innerText = "资源版本号不能为空或格式不对....";
                return;
            }
            if (!ValideVersion(config.fversion)) {
                this.$label.innerText = "apk版本号不能为空或格式不对....";
                return;
            }
            if (!config.assetPath) {
                this.$label.innerText = "构建资源路径不能为空....";
                return;
            }
            if (!config.serverPath) {
                this.$label.innerText = "远程地址路径不能为空....";
                return;
            }
            config.updateLocal = this.$updateLocalSwitch.value;
            Editor.Ipc.sendToMain("hot-update:start-build", config);

            this.$label.innerText = "progressing....";
        });
        this.$release.addEventListener("confirm", () => {
            var config = {};

            config.serverPath = this.$inputServer.value;
            config.assetPath = this.$inputAssetPath.value;
            if (!config.serverPath || !config.assetPath) {
                this.$label.innerText = "远程地址或构建路径不能为空....";
                return;
            }
            Editor.Ipc.sendToMain("hot-update:start-upload", config);
            this.$label.innerText = "uploading....";
        });
        this.$stage.addEventListener("confirm", () => {
            var config = {};

            config.serverPath = this.$inputServer.value;
            config.assetPath = this.$inputAssetPath.value;
            if (!config.serverPath || !config.assetPath) {
                this.$label.innerText = "远程地址或构建路径不能为空....";
                return;
            }
            config.stage = true;

            Editor.Ipc.sendToMain("hot-update:start-upload", config);
            this.$label.innerText = "uploading....";
        });
        this.$localServerBtn.addEventListener("confirm", () => {
            let config = {};
            config.port = this.$inputPort.value;
            if (!config.port) {
                this.$inputPort.value = 8000;
            }
            Editor.Ipc.sendToMain("hot-update:start-local", config);
        });
    },
    messages: {
        "update-status": function (event, args) {
            this.$label.innerText = args;
        },
    },
});
