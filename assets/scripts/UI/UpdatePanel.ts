const { ccclass, property } = cc._decorator;
import HotUpdate, { HotUpdateEvent } from "../module/HotUpdate";
@ccclass
export default class UpdatePanel extends cc.Component {
    @property(cc.Node)
    panel: cc.Node = null;

    @property(cc.Label)
    info: cc.Label = null;

    @property(cc.Node)
    checkBtn: cc.Node = null;

    @property(cc.Node)
    updateBtn: cc.Node = null;

    @property(cc.Node)
    forceUpdateBtn: cc.Node = null;

    @property(cc.Node)
    close: cc.Node = null;

    @property(cc.ProgressBar)
    fileProgress: cc.ProgressBar = null;

    @property(cc.ProgressBar)
    byteProgress: cc.ProgressBar = null;

    @property(cc.Label)
    fileLabel: cc.Label = null;

    @property(cc.Label)
    byteLabel: cc.Label = null;

    @property(HotUpdate)
    hotUpdate: HotUpdate = null;

    protected onLoad(): void {
        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;
        this.panel.active = false;
        this.forceUpdateBtn.active = false;
        cc.director.on(HotUpdateEvent, this.handleHotUpdateEvent);
    }

    start() {
        if (!cc.sys.isNative) {
            return;
        }
        this.checkUpdate();
    }
    OnClose() {
        this.panel.active = false;
    }
    protected onDestroy(): void {
        cc.director.off(HotUpdateEvent, this.handleHotUpdateEvent);
    }
    handleHotUpdateEvent = (event: jsb.EventAssetsManager) => {
        cc.log("HotUpdateEvent", event.getEventCode());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log("ERROR_NO_LOCAL_MANIFEST");
                this.info.string = "No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log("ERROR_PARSE_MANIFEST or ERROR_DOWNLOAD_MANIFEST");
                this.info.string = "Fail to download manifest file, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log("ALREADY_UP_TO_DATE");
                this.info.string = "Already up to date with the latest remote version.";
                this.panel.active = false;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                cc.log("NEW_VERSION_FOUND");
                this.panel.active = true;
                this.info.string = "New version found, please try to update. (" + event.getTotalBytes() + ")";
                this.checkBtn.active = false;
                this.fileProgress.progress = 0;
                this.byteProgress.progress = 0;
                this.checkForceUpdate();
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                cc.log("UPDATE_PROGRESSION");
                this.byteProgress.progress = event.getPercent();
                this.fileProgress.progress = event.getPercentByFile();

                this.fileLabel.string = event.getDownloadedFiles() + " / " + event.getTotalFiles();
                this.byteLabel.string = event.getDownloadedBytes() + " / " + event.getTotalBytes();

                var msg = event.getMessage();
                if (msg) {
                    this.info.string = "Updated file: " + msg;
                    // cc.log(event.getPercent()/100 + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.info.string = "Update finished. " + event.getMessage();
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.info.string = "Update failed. " + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.info.string = "Asset update error: " + event.getAssetId() + ", " + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.info.string = event.getMessage();
                break;
            case jsb.EventAssetsManager.ASSET_UPDATED:
                this.info.string = event.getMessage();
                break;
            default:
                return;
        }
    };

    retryUpdate() {
        this.info.string = "Retry failed Assets...";
        this.hotUpdate.retry();
    }
    remoteManifest: any = {};
    checkForceUpdate() {
        this.hotUpdate.checkIfNeedDownloadFullApk((err, { result, ...manifest }) => {
            if (err) {
                cc.log("checkForceUpdate:" + err);
                return;
            }
            this.remoteManifest = manifest;
            //need update apk
            if (result < 0) {
                this.forceUpdateBtn.active = true;
                this.updateBtn.active = false;
                this.close.active = false;
            }
        });
    }
    checkUpdate() {
        this.hotUpdate.checkUpdate();
    }
    excuteUpate() {
        this.hotUpdate.hotUpdate();
    }
    _downloader: jsb.Downloader;
    downloadApk() {
        let apkUrl = this.remoteManifest.remoteApkUrl;
        cc.log("download apk", apkUrl);
        if (!apkUrl) return;

        //下载文件的保存路径
        let filePath = this.getDownloadPath();
        this._downloader = new jsb.Downloader();
        this._downloader.setOnTaskError((task, errorCode, errorCodeInternal, errorStr) => {
            console.error(errorStr);
        });
        this._downloader.setOnTaskProgress((task, bytesReceived, totalBytesReceived, totalBytesExpected) => {
            var str =
                "下载大小 = " +
                bytesReceived +
                "," +
                "总大小 = " +
                totalBytesReceived +
                "," +
                "预期总大小 = " +
                totalBytesExpected +
                "," +
                "进度 = " +
                Math.floor((totalBytesReceived / totalBytesExpected) * 10000) / 100 +
                "%\n";
            console.log("progress: " + str);
        });
        this._downloader.setOnFileTaskSuccess((task) => {
            console.log(task.requestURL + " apk download success " + task.storagePath);
            this.installApk(task.storagePath);
        });

        this._downloader.createDownloadFileTask(apkUrl, filePath, "downloadapk");
    }
    installApk(apkPath) {
        cc.log("installApk", apkPath);
    }

    getDownloadPath() {
        return jsb.fileUtils.getWritablePath() + "latest.apk";
    }
}
