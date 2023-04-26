// 模板测试知识点可参考 https://forum.cocos.org/t/topic/124384，或者 learnOpenGl

import saoGuang from "../saoguang/saoGuang";
// effect设置stencil无效？
// cocos stencil 默认继承STENCIL_INHERIT，需要手动恢复
// TODO: 能不能用多pass来解决stencil恢复？

// 简化使用(stencil恢复动态做)(目前加新渲染节点来做)
// 计算包围盒(包围盒计算不对数据不对)
// ~~多个节点同时扫光~~

const { ccclass, property } = cc._decorator;
const gfx = cc["gfx"];
@ccclass
export default class StencilSaoguang extends cc.Component {
    static stencilRef = 1;

    @property({ type: cc.Node })
    stencilW: cc.Node[] = [];
    @property(cc.Node)
    sweepTemplate: cc.Node = null;

    _changedRenderCompsCache = {};
    _stencilNodesCache = {};

    test() {
        this.lightSweepNodes(this.stencilW);
    }
    lightSweepNodes(nodes) {
        nodes.forEach((v) => {
            this.lightSweepByStencil(v);
        });
    }
    lightSweepByStencil(sweepArea: cc.Node) {
        StencilSaoguang.stencilRef++;
        StencilSaoguang.stencilRef %= 1000;
        var sref = StencilSaoguang.stencilRef;
        //开模板测试，并写入要扫光的renderCompo模板缓存

        let _changedRenderCompsCache = [];
        // 是否过滤掉label？
        let crc = [];
        let rc = sweepArea.getComponent(cc.RenderComponent);
        if (rc) {
            crc.push(rc);
        }
        // 只处理第一层子节点
        for (let index = 0; index < sweepArea.childrenCount; index++) {
            const element = sweepArea.children[index];
            let isLabel = element.getComponent(cc.RenderComponent) instanceof cc.Label;
            if (element.activeInHierarchy && element.getComponent(cc.RenderComponent) && !isLabel) {
                crc.push(element.getComponent(cc.RenderComponent));
            }
        }
        if (!crc.length) return;

        crc.forEach((element) => {
            _changedRenderCompsCache.push(element);
            this.setStencil(element, sref);
        });
        this._changedRenderCompsCache[sweepArea.uuid] = _changedRenderCompsCache;

        // // 关闭模板测试
        // this.recoverStencil(sweepArea);
        //FIXME: 这个不会计算skew。位置也不对?
        let rect = sweepArea.getBoundingBoxToWorld();
        let stencilNode = cc.instantiate(this.sweepTemplate);
        stencilNode.active = true;
        if (crc.length === 1) {
            // stencilNode.setParent(crc[0].node);
            stencilNode.height = crc[0].node.height;
            stencilNode.width = crc[0].node.width;
        } else {
            // stencilNode.setParent(sweepArea);
            stencilNode.height = rect.height * 1.5;
            stencilNode.width = rect.width * 1.5;
        }
        stencilNode.setParent(sweepArea);

        stencilNode.position = cc.Vec3.ZERO;
        this.setSaoguangParams(stencilNode, sweepArea.uuid);
        // 官方stencilTest序列化有问题，不能再effect改
        // 开模板测试
        let s2 = stencilNode.getComponent(cc.RenderComponent);
        this.doStencilTest(s2, sref);
        // 关闭模板测试
        stencilNode.children[0].getComponent(cc.RenderComponent).getMaterial(0).setStencilEnabled(0, 0)

        this._stencilNodesCache[sweepArea.uuid] = stencilNode;
    }
    setStencil(comp, ref: number) {
        // 取整
        ref = ref | 0;
        let mat = comp.getMaterial(0);
        mat.setStencil(
            gfx.STENCIL_ENABLE,
            gfx.DS_FUNC_ALWAYS,
            ref,
            0xff,
            gfx.STENCIL_OP_REPLACE,
            gfx.STENCIL_OP_REPLACE,
            gfx.STENCIL_OP_REPLACE,
            0xff,
            0
        );
        // 开alpha测试，保证透明像素不会进入模板测试
        mat.define("USE_ALPHA_TEST", true);
    }
    doStencilTest(comp, ref) {
        let s2 = comp.getMaterial(0);
        s2.setStencil(
            gfx.STENCIL_ENABLE,
            gfx.DS_FUNC_EQUAL,
            ref,
            0xff,
            gfx.STENCIL_OP_KEEP,
            gfx.STENCIL_OP_KEEP,
            gfx.STENCIL_OP_KEEP,
            0xff,
            0
        );
    }
    afterSweep(uuid) {
        // 清理
        let comps = this._changedRenderCompsCache[uuid] || []
        comps.forEach((comp) => {
            let mat = comp.getMaterial(0);
            mat.setStencilEnabled(0, 0);
            mat.define("USE_ALPHA_TEST", false);
        });
        let stencilNode = this._stencilNodesCache[uuid];
        stencilNode && stencilNode.isValid && stencilNode.destroy();
        this._changedRenderCompsCache[uuid] = [];
        this._stencilNodesCache[uuid] = null;
        delete this._stencilNodesCache[uuid];
        delete this._changedRenderCompsCache[uuid];
    }

    recoverStencil(baseNode) {

    }

    setSaoguangParams(sNode, uuid) {
        let js = sNode.getComponent(saoGuang);
        if (!js) {
            js = sNode.addComponent(saoGuang);
        }
        let params = this._params;
        params = params ? params.split("|")[0] : null;
        if (params && params !== "") {
            let arr = params.split(";");

            if (arr.length > 1) {
                let lineWidth = parseFloat(arr[0]);
                let time = parseFloat(arr[1]);
                let centerArr = arr[2].split(",");
                let center = cc.v2(parseFloat(centerArr[0]), parseFloat(centerArr[1]));
                let centerEndArr = arr[3].split(",");
                let centerEnd = cc.v2(parseFloat(centerEndArr[0]), parseFloat(centerEndArr[1]));
                let angle = parseFloat(arr[4]);
                js.setParams(lineWidth, time, center, centerEnd, angle);
            }
        }
        js.prePlayTx(() => {
            this.afterSweep(uuid)
        });
    }
    _params = null
    _sweepArea = null;
    playSaoGuang(node: cc.Node, params?: string, isDiGui = true, st: number = 0) {
        this._params = params;
        this.lightSweepNodes([node]);
    }

}
