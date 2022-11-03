// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class UpdatePanel extends cc.Component {

    @property(cc.Label)
    info: cc.Label = null;

    @property(cc.Button)
    checkBtn: cc.Button = null;

    @property(cc.Button)
    updateBtn: cc.Button = null;

    @property(cc.Button)
    close: cc.Button = null;

    @property(cc.ProgressBar)
    fileProgress;

    @property(cc.ProgressBar)
    byteProgress

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
