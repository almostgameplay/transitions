const { ccclass, property } = cc._decorator;
import HotUpdate, { HotUpdateEvent } from "../module/HotUpdate";
@ccclass
export default class UpdatePanel extends cc.Component {
    @property(cc.Label)
    info: cc.Label = null;

    @property(cc.Node)
    checkBtn: cc.Node = null;

    @property(cc.Node)
    updateBtn: cc.Node = null;

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
    hotUpdate = null;

    start() {
        if (!cc.sys.isNative) {
            this.node.active = false;
            return;
        }
        cc.director.on(HotUpdateEvent, this.handleHotUpdateEvent);
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
                this.node.active = false;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                cc.log("NEW_VERSION_FOUND");
                this.info.string = "New version found, please try to update. (" + event.getTotalBytes() + ")";
                this.checkBtn.active = false;
                this.fileProgress.progress = 0;
                this.byteProgress.progress = 0;
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

    protected onLoad(): void {
        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;
    }

    retryUpdate() {
        this.info.string = "Retry failed Assets...";
        this.hotUpdate.retry();
    }
    checkUpdate() {
        this.hotUpdate.checkUpdate();
    }
    // update (dt) {}
    OnClose() {
        this.node.active = false;
    }
}
