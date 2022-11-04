import UpdatePanel from "../UI/UpdatePanel";

const { ccclass, property } = cc._decorator;

var customManifestStr = JSON.stringify({
    packageUrl: "http://192.168.1.85:8000/test/remote-assets/",
    remoteManifestUrl: "http://192.168.1.85:8000/test/remote-assets/project.manifest",
    remoteVersionUrl: "http://192.168.1.85:8000/test/remote-assets/version.manifest",
    version: "1.0.0",
    assets: {
        "src/cocos2d-jsb.js": {
            size: 3341465,
            md5: "fafdde66bd0a81d1e096799fb8b7af95",
        },
        "src/project.dev.js": {
            size: 97814,
            md5: "ed7f5acd411a09d4d298db800b873b00",
        },
        "src/settings.js": {
            size: 3849,
            md5: "deb03998a4cfb8f8b468fba8575cb1c9",
        },
    },
    searchPaths: [],
});

@ccclass
export default class HotUpdate extends cc.Component {
    @property(UpdatePanel)
    panel: UpdatePanel = null;
    @property(cc.Asset)
    manifestUrl = null;
    @property(cc.Node)
    updateUI: cc.Node = null;

    _updating = false;
    _canRetry = false;
    _storagePath = "";

    _checkListener;
    _updateListener;
    _am: jsb.AssetsManager;
    _failCount;
    versionCompareHandle;
    checkCb(event: any) {
        cc.log("Code: " + event.getEventCode());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.panel.info.string = "No local manifest file found, hot update skipped.";
                cc.log("ERROR_NO_LOCAL_MANIFEST");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.panel.info.string = "Fail to download manifest file, hot update skipped.";
                cc.log("ERROR_PARSE_MANIFEST");
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.panel.info.string = "Already up to date with the latest remote version.";
                this.updateUI.active = false;
                cc.log("ALREADY_UP_TO_DATE");
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                cc.log("NEW_VERSION_FOUND");
                this.panel.info.string = "New version found, please try to update. (" + this._am.getTotalBytes() + ")";
                this.panel.checkBtn.active = false;
                this.panel.fileProgress.progress = 0;
                this.panel.byteProgress.progress = 0;
                break;
            default:
                return;
        }

        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;
    }

    updateCb(event: any) {
        var needRestart = false;
        var failed = false;
        cc.log("updatecb", JSON.stringify(event));
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.panel.info.string = "No local manifest file found, hot update skipped.";
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                this.panel.byteProgress.progress = event.getPercent();
                this.panel.fileProgress.progress = event.getPercentByFile();

                this.panel.fileLabel.string = event.getDownloadedFiles() + " / " + event.getTotalFiles();
                this.panel.byteLabel.string = event.getDownloadedBytes() + " / " + event.getTotalBytes();

                var msg = event.getMessage();
                if (msg) {
                    this.panel.info.string = "Updated file: " + msg;
                    // cc.log(event.getPercent()/100 + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.panel.info.string = "Fail to download manifest file, hot update skipped.";
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.panel.info.string = "Already up to date with the latest remote version.";
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.panel.info.string = "Update finished. " + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.panel.info.string = "Update failed. " + event.getMessage();
                // this.panel.retryBtn.active = true;
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.panel.info.string = "Asset update error: " + event.getAssetId() + ", " + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.panel.info.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log(JSON.stringify(newPaths));
            for (var i = 0; i < newPaths.length; i++) {
                if (searchPaths.indexOf(newPaths[i]) == -1) {
                    Array.prototype.unshift.apply(searchPaths, [newPaths[i]]);
                }
            }
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }

    loadCustomManifest() {
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            var manifest = new jsb.Manifest(customManifestStr, this._storagePath);
            this._am.loadLocalManifest(manifest, this._storagePath);
            this.panel.info.string = "Using custom manifest";
        }
    }

    retry() {
        if (!this._updating && this._canRetry) {
            // this.panel.retryBtn.active = false;
            this._canRetry = false;

            this.panel.info.string = "Retry failed Assets...";
            this._am.downloadFailedAssets();
        }
    }

    checkUpdate() {
        if (this._updating) {
            this.panel.info.string = "Checking or updating ...";
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            // Resolve md5 url
            var url = this.manifestUrl.nativeUrl;
            if (cc.assetManager["md5Pipe"]) {
                url = cc.assetManager["md5Pipe"].transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.panel.info.string = "Failed to load local manifest ...";
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        cc.log("JS checkupdate");
        this._am.checkUpdate();
        this._updating = true;
    }

    hotUpdate() {
        cc.log("hotupdate", this._updating, this.manifestUrl.nativeUrl);
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url
                cc.log("state uninited");
                var url = this.manifestUrl.nativeUrl;
                if (cc.assetManager["md5Pipe"]) {
                    url = cc.assetManager["md5Pipe"].transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }

            this._failCount = 0;
            this._am.update();
            this.panel.updateBtn.active = false;
            this._updating = true;
            cc.log("updating");
        }
    }

    show() {
        if (this.updateUI.active === false) {
            this.updateUI.active = true;
        }
    }

    // use this for initialization
    onLoad() {
        this.checkIfNeedDownloadFullApk();

        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            this.updateUI && (this.updateUI.active = false);
            return;
        }
        this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "test-remote-asset";
        cc.log(jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/");
        cc.log("Storage path for remote asset : " + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ", version B is " + versionB);
            var vA = versionA.split(".");
            var vB = versionB.split(".");
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            } else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager("", this._storagePath, this.versionCompareHandle);

        var panel = this.panel;
        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                panel.info.string = "Verification passed : " + relativePath;
                return true;
            } else {
                panel.info.string = "Verification passed : " + relativePath + " (" + expectedMD5 + ")";
                return true;
            }
        });

        this.panel.info.string = "Hot update is ready, please check or directly update.";

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am["setMaxConcurrentTask"] && this._am["setMaxConcurrentTask"](2);
            this.panel.info.string = "Max concurrent tasks count have been limited to 2";
        }

        this.panel.fileProgress.progress = 0;
        this.panel.byteProgress.progress = 0;
    }

    onDestroy() {
        if (this._updateListener) {
            this._am.setEventCallback(null);
            this._updateListener = null;
        }
    }

    /**
     * 是否需要下载新apk? 大版本更新
     */
    checkIfNeedDownloadFullApk() {
        if (cc.sys.isNative) {
            let localManifest: jsb.Manifest = this._am.getLocalManifest();
            let remoteManifest: jsb.Manifest = this._am.getRemoteManifest();

            let remoteMajor = remoteManifest.getVersion().split(".")[0];
            let localMajor = localManifest.getVersion().split(".")[0];
            if (remoteMajor > localMajor) {
                console.log("need update to full apk");
            }
        }
    }

    request(cb) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                var data = JSON.parse(response);
                console.log(data);
                cb(null, data);
            }
        };
        xhr.open("GET", "http://localhost:8000/test/remote-assets/version.manifest", true);
        xhr.send();
    }
}
