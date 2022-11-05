const { ccclass, property } = cc._decorator;

export const HotUpdateEvent = "HotUpdateEvent";
const EmptyFn = (args: any) => {};
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
    @property(cc.Asset)
    manifestUrl = null;

    _updating = false;
    _canRetry = false;
    _storagePath = "";

    _checkListener;
    _updateListener;
    _am: jsb.AssetsManager;
    _failCount;
    versionCompareHandle;
    checkCb(event: jsb.EventAssetsManager) {
        cc.log("Code: " + event.getEventCode());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                break;
            default:
                return;
        }
        cc.director.emit(HotUpdateEvent, event);
        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;
    }

    updateCb(event: jsb.EventAssetsManager) {
        cc.log("Code: " + event.getEventCode());
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                break;
            default:
                break;
        }
        cc.director.emit(HotUpdateEvent, event);

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
        }
    }

    retry() {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;

            this._am.downloadFailedAssets();
        }
    }

    checkUpdate() {
        if (this._updating) {
            cc.log("Checking or updating ...");
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
            cc.log("Failed to load local manifest ...");
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
        this._updating = true;
    }

    hotUpdate() {
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
            this._updating = true;
            cc.log("updating");
        }
    }

    // use this for initialization
    onLoad() {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this.setup();

        this.checkIfNeedDownloadFullApk();
    }

    setup() {
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
                cc.log("Verification passed : " + relativePath);
                return true;
            } else {
                cc.log("Verification passed : " + relativePath + " (" + expectedMD5 + ")");
                return true;
            }
        });

        cc.log("Hot update is ready, please check or directly update.");

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am["setMaxConcurrentTask"] && this._am["setMaxConcurrentTask"](2);
            cc.log("Max concurrent tasks count have been limited to 2");
        }
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
        let localManifest: jsb.Manifest = this._am.getLocalManifest();
        let remoteManifest: jsb.Manifest = this._am.getRemoteManifest();

        if (!localManifest || !remoteManifest) {
            cc.log("checkIfNeedDownloadFullApk", localManifest, remoteManifest);
            return;
        }

        let remoteMajor = remoteManifest.getVersion().split(".")[0];
        let localMajor = localManifest.getVersion().split(".")[0];
        if (remoteMajor > localMajor) {
            console.log("need update to full apk");
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
