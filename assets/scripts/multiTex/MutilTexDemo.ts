// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import MultiTexSprite from "./MultiTexSprite";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Material)
    sfMat: cc.Material = null;
    @property(cc.SpriteAtlas)
    sfAtlas: cc.SpriteAtlas = null;
    spriteFrames: cc.SpriteFrame[] = [];
    start() {
        // this.test();
        this.testAltas();
    }
    test() {
        let paths = [];
        for (let index = 1; index < 9; index++) {
            paths.push("TempTest/bar_" + index);
        }
        cc.assetManager.resources.load(paths, cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
            if (err) return;
            this.spriteFrames = assets;
            assets.forEach((v, k) => {
                if (k < 6) {
                    v.getTexture();
                    this.sfMat.setProperty(`texture${k === 0 ? "" : k}`, v.getTexture(), 0);
                }
            });

            this.loadSprites();
        });
    }
    loadSprites() {
        for (let index = 0; index < 8; index++) {
            let node = this.createSprite(index);
            node.setParent(this.node);
            node.setPosition(cc.v3(200, 200 + index * 100));
        }
    }
    createSprite(index) {
        let node = new cc.Node("image_index");
        var ms = node.addComponent(MultiTexSprite);
        ms.setMaterial(0, this.sfMat);
        let sf: cc.SpriteFrame = this.spriteFrames[index];
        ms.spriteFrame = sf;
        // ms.spriteFrame["uv"] = sf["uv"];
        node.width = sf.getRect().width;
        node.height = sf.getRect().height;
        // ms.setVertsDirty();
        ms.setTextureIdx(index);
        ms.getMaterial(0)["updateHash"](9999); //写死hash避免打断
        return node;
    }
    // 获取图集，拿图集位置uv，
    testAltas() {
        let sf = this.getSpriteFram("bar_1");
        console.log(sf);
    }
    getSpriteFram(key) {
        this.sfAtlas.getSpriteFrame(key);
    }

    // update (dt) {}
}
