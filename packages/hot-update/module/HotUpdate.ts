const { ccclass, property, menu } = cc._decorator;

export const HotUpdateMode = "HotupdateMode";
export const HotUpdateEvent = "HotUpdateEvent";
export const HotUpdateSearchPathKey = "HotUpdateSearchPaths";
import { PackageTestUrl, PackageUrl } from "./Constant";

var customManifestStr = JSON.stringify({
    packageUrl: PackageUrl,
    remoteManifestUrl: PackageUrl + "project.manifest",
    remoteVersionUrl: PackageUrl + "version.manifest",
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
@menu("HotUpdate/HotUpdate")
export default class HotUpdate extends cc.Component {
    // @property(cc.Asset)
    // manifestUrl = null;
    // @property(cc.Asset)
    // testManifestUrl = null;

    _updating = false;
    _canRetry = false;
    _storagePath = "";

    _checkListener;
    _updateListener;
    _am: jsb.AssetsManager;
    _failCount;
    versionCompareHandle;
    _debugMode = false;
    checkCb(event: jsb.EventAssetsManager) {
        console.log("Code: " + event.getEventCode());
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
        // console.log("manifest searchpaths", JSON.stringify(this._am.getLocalManifest().getSearchPaths()));
        // console.log("jsb searchpaths", JSON.stringify(jsb.fileUtils.getSearchPaths()));
        let localManifest: jsb.Manifest = this._am.getLocalManifest();
        console.log("localmanifest", localManifest.getVersionFileUrl());

        cc.director.emit(HotUpdateEvent, event);
        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;
    }

    updateCb(event: jsb.EventAssetsManager) {
        console.log("Code: " + event.getEventCode());
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

            console.log("restart", JSON.stringify(searchPaths));
            cc.sys.localStorage.setItem(HotUpdateSearchPathKey, JSON.stringify(searchPaths));
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
    localAssets;
    checkUpdate(){
        if(this.localAssets){
            this._checkUpdate()
            return;
        }
        cc.resources.load(["project",'testProject'],(err,assets) =>{
            if(err){
                console.log("load local manifest err:",err);
                return;
            }
            this.localAssets = assets;
            this._checkUpdate();
        })
    }
    _checkUpdate() {
        if (this._updating) {
            console.log("Checking or updating ...");
            return;
        }
        // let manifestUrl = this._debugMode ? this.testManifestUrl : this.manifestUrl;
        let manifestUrl = this._debugMode?this.localAssets[1]:this.localAssets[0];
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            // Resolve md5 url
            var url = manifestUrl.nativeUrl;
            if (cc.assetManager["md5Pipe"]) {
                url = cc.assetManager["md5Pipe"].transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            console.log("Failed to load local manifest ...");
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
        this._updating = true;
    }

    hotUpdate() {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));
            // let manifestUrl = this._debugMode ? this.testManifestUrl : this.manifestUrl;
            let manifestUrl = this._debugMode?this.localAssets[1]:this.localAssets[0];

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url
                var url = manifestUrl.nativeUrl;
                if (cc.assetManager["md5Pipe"]) {
                    url = cc.assetManager["md5Pipe"].transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    }

    // use this for initialization
    onLoad() {
        cc.game.addPersistRootNode(this.node);
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this.setup();
    }

    setup() {
        this._debugMode = !!localStorage.getItem(HotUpdateMode);
        this._storagePath =
            (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") +
            (this._debugMode ? "test-remote-asset" : "remote-asset");
        console.log(jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/");
        console.log("Storage path for remote asset : " + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            console.log("JS Custom Version Compare: version A is " + versionA + ", version B is " + versionB);
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
                console.log("Verification passed : " + relativePath);
                return true;
            } else {
                console.log("Verification passed : " + relativePath + " (" + expectedMD5 + ")");
                return true;
            }
        });

        console.log("Hot update is ready, please check or directly update.");

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am["setMaxConcurrentTask"] && this._am["setMaxConcurrentTask"](2);
            console.log("Max concurrent tasks count have been limited to 2");
        }
    }
    unsetAll() {
        this._am.setEventCallback(null);
        this._updateListener = null;
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
    checkIfNeedDownloadFullApk(cb: any) {
        let localManifest: jsb.Manifest = this._am.getLocalManifest();
        console.log("checkIfNeedDownloadFullApk", localManifest.getVersion());

        if (!localManifest) {
            cb && cb("null manifest");
            return;
        }

        let localVersion = localManifest.getVersion();

        this.getRemoteVersionManifest((err, manifest) => {
            if (err) {
                cb && cb(err);
                return;
            }
            let result = this.versionCompareHandle(localVersion, manifest.forceVersion);

            cb && cb(null, { result, ...manifest });
        });
    }

    getRemoteVersionManifest(cb) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    var response = xhr.responseText;
                    var data = JSON.parse(response);
                    console.log("remote version manifest", response);
                    cb(null, data);
                } else {
                    cb("xhr:get remote manifest err");
                }
            }
        };
        var url = this._debugMode ? PackageTestUrl : PackageUrl;
        url += "version.manifest";
        xhr.open("GET", url, true);
        xhr.send();
    }

    checkIfNeedCleanUp(cb: any) {
        let localManifest: jsb.Manifest = this._am.getLocalManifest();

        if (!localManifest) {
            cb && cb("null manifest");
            return;
        }

        let localVersion = localManifest.getVersion();

        this.getRemoteVersionManifest((err, manifest) => {
            if (err) {
                cb && cb(err);
                return;
            }
            //只有当前版本与最新apk版本相同时才清理 result == 0;
            let result = this.versionCompareHandle(localVersion, manifest.forceVersion);

            cb && cb(null, { result });
        });
    }
    checkIfNeedRollBack(cb: any) {
        let localManifest: jsb.Manifest = this._am.getLocalManifest();
        console.log("localmanifest", JSON.stringify(localManifest));
        if (!localManifest) {
            cb && cb("null manifest");
            return;
        }

        let localVersion = localManifest.getVersion();

        this.getRemoteVersionManifest((err, manifest) => {
            if (err) {
                cb && cb(err);
                return;
            }
            //只有当前版本与最新apk版本相同时才清理 result == 0;
            let result = this.versionCompareHandle(localVersion, manifest.forceVersion);
            console.log("remotemanifest", JSON.stringify(manifest));
            cb && cb(null, { result });
        });
    }

    resetSearchPath() {
        localStorage.setItem(HotUpdateSearchPathKey, "");
        jsb.fileUtils.setSearchPaths(["@assets/"]);
        setTimeout(() => {
            cc.audioEngine.stopAll();
            cc.game.restart();
        }, 300);
    }
}
