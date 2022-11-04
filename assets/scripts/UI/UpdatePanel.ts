const {ccclass, property} = cc._decorator;

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
    fileProgress:cc.ProgressBar = null;

    @property(cc.ProgressBar)
    byteProgress:cc.ProgressBar = null;

    @property(cc.Label)
    fileLabel: cc.Label = null;

    @property(cc.Label)
    byteLabel: cc.Label = null;
    

    start () {

    }

    protected onLoad(): void {
          
    }
    // update (dt) {}
    OnClose(){

        this.node.active = false;
    }
}
