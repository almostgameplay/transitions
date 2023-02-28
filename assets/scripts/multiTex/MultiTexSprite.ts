import BaseAssembler from "./BaseAssembler";
import MultiTexAssembler from "./MultiTexAssembler";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MultiTexSprite extends cc.Sprite {
    textureIdx = 0;
    setTextureIdx(idx) {
        this.textureIdx = idx;
        this.setVertsDirty();
    }

    // 使用cc.Sprite默认逻辑
    _resetAssembler() {
        this.setVertsDirty();
        let assembler = (this._assembler = new MultiTexAssembler());
        this.setVertsDirty();

        assembler.init(this);
        this._updateColor();
    }
}
