// TODO: 记录每个sf使用情况，动态更新使用中的texture到多图集纹理中
import MultiTexSprite from "./MultiTexSprite";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Material)
    sfMat: cc.Material = null;
    @property(cc.SpriteAtlas)
    sf1Atlas: cc.SpriteAtlas = null;

    @property(cc.SpriteAtlas)
    sf2Atlas: cc.SpriteAtlas = null;

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
        this.sfMat.setProperty(`texture`, this.sf1Atlas.getSpriteFrame("bar_1").getTexture(), 0);
        this.sfMat.setProperty(`texture1`, this.sf2Atlas.getSpriteFrame("doll_1").getTexture(), 0);

        for (let index = 0; index < 20; index++) {
            let use1 = index % 2 == 0;
            let pref = use1?"bar_":"doll_";
            let node = this.createSpriteByAltas(pref + (index % 8 + 1),use1?this.sf1Atlas:this.sf2Atlas,use1?0:1);
            node.setParent(this.node);
            let x = Math.ceil(index / 10 );
            let y = index % 10;
            node.setPosition(cc.v3( 200 + x * 100, 200+ y * 100));
        }
    }
    createSpriteByAltas(name,altas,idx) {
        let node = new cc.Node("image_index");
        var ms = node.addComponent(MultiTexSprite);
        ms.setMaterial(0, this.sfMat);
        let sf: cc.SpriteFrame = altas.getSpriteFrame(name)
        ms.spriteFrame = sf;
        // ms.spriteFrame["uv"] = sf["uv"];
        node.width = sf.getRect().width;
        node.height = sf.getRect().height;
        // ms.setVertsDirty();
        ms.setTextureIdx(idx);
        ms.getMaterial(0)["updateHash"](9999); //写死hash避免打断
        return node;
    }
    getSpriteFrame(key) {
        return this.sf1Atlas.getSpriteFrame(key);
    }

    // update (dt) {}
}
