/**
 * 将节点下的label全部抽出，放在一个平行父节点下，达到分层目的
 * bitmap缓冲模式字体不会处理
 */

// TODO:
// layout,widget如何管理？测试来看没影响，猜测layout执行在beforedraw之前？
// 算法优化,setparent和直接改_children那个速度快？
// 父节点继承信息处理(opacity,scale...)
// 测试速度

const { ccclass, property, menu } = cc._decorator;

let TYPE_EXTRACT = cc.Enum({
    label: 0,
    spine: 1,
});
// cc.macro.CLEANUP_IMAGE_CACHE = false;
// cc.dynamicAtlasManager.enabled = true;
@ccclass
@menu("Helper/MMBatcher")
export default class MMBatcher extends cc.Component {
    static attachedNodes = [];
    static enabled = true;
    static stats = {};
    static count = 0;
    static addAttachNode(name) {
        MMBatcher.attachedNodes.push(name);
        MMBatcher.stats[name];
    }
    static removeAttachNode(name) {
        let i = MMBatcher.attachedNodes.indexOf(name);
        if (i < 0) return;
        MMBatcher.attachedNodes.splice(i, 1);

        delete MMBatcher.stats[name];
    }

    static recordInfo(count, cost1, cost2, name) {
        let obj = MMBatcher.stats[name] || {};
        obj.count = count;
        obj.cost1 = cost1 | 0;
        obj.cost2 = cost2 | 0;
        obj.average = (cost1 + cost2) / count;
        MMBatcher.stats[name] = obj;
    }

    @property({ type: cc.Node, tooltip: "要分层的节点" })
    baseNode: cc.Node = null;

    @property({ type: TYPE_EXTRACT, readonly: true })
    type = TYPE_EXTRACT.label;

    //TODO:只分层label，不还原。需要考虑layout，widget
    @property({ type: cc.Boolean, readonly: true, tooltip: "未支持,某些静态节点不需要自动更新" })
    isAutoRefresh = true;

    // debug
    uniqueName = "";
    totalCount = 0;
    batchCost = 0;
    resetCost = 0;

    isValid = true;

    protected onLoad(): void {
        let a = this.node.getComponentInChildren(MMBatcher);
        if (a) {
            CC_PREVIEW && console.warn("MMBatchItem: dont support nest");
            this.isValid = false;
            return;
        }
        this.uniqueName = this.node.name + "__" + this.baseNode.name;
        MMBatcher.count++;
        MMBatcher.addAttachNode(this.uniqueName);
    }
    protected onDestroy(): void {
        MMBatcher.removeAttachNode(this.uniqueName);
    }
    protected onEnable(): void {
        this.initListener();
    }

    protected onDisable(): void {
        this.offListener();
    }
    initListener() {
        cc.director.on(cc.Director.EVENT_AFTER_DRAW, this.resetNode, this);
        cc.director.on(cc.Director.EVENT_BEFORE_DRAW, this.batchNode, this);
    }
    offListener() {
        cc.director.off(cc.Director.EVENT_AFTER_DRAW, this.resetNode, this);
        cc.director.off(cc.Director.EVENT_BEFORE_DRAW, this.batchNode, this);
    }
    _batchRecords = [];
    _preChildren = [];
    batchNode() {
        if (!MMBatcher.enabled || !this.isValid) return;
        if (!this.baseNode || !this.baseNode.activeInHierarchy) return;

        this.totalCount++;
        var ts = cc.director.getTotalTime();

        this._batchRecords = [];

        let labels = this.baseNode.getComponentsInChildren(cc.Label);

        for (let index = 0; index < labels.length; index++) {
            const label = labels[index];
            // FIXME: bitmap字体要看具体场景 label.cacheMode === cc.Label.CacheMode.BITMAP
            if (label.node.childrenCount > 0 || !label.node.activeInHierarchy) {
                CC_PREVIEW && console.warn("MMBatchItem:dont support label Node which has child node");
                continue;
            }
            this._batchRecords.push({
                label,
                preParent: label.node.parent,
                siblingIndex: label.node.getSiblingIndex(),
                prePos: label.node.position,
            });
        }

        for (let i = 0; i < this._batchRecords.length; i++) {
            let labelRecord = this._batchRecords[i];
            let lnode: cc.Node = labelRecord.label.node;

            if (lnode.getComponent(cc.Layout)) {
                lnode["_updateWorldMatrix"]();
            }

            // 这个操作有点耗时，最好在预制体上改完
            if (labelRecord.label.cacheMode === cc.Label.CacheMode.NONE) {
                labelRecord.label.cacheMode = cc.Label.CacheMode.CHAR;
            }
            if (lnode.parent === this.baseNode) {
                lnode.setSiblingIndex(this.baseNode.childrenCount);
            } else {
                let wPos = lnode.parent.convertToWorldSpaceAR(lnode.position);
                lnode.setParent(this.baseNode);
                lnode.setPosition(this.baseNode.convertToNodeSpaceAR(wPos));
            }
        }
        this.batchCost += cc.director.getTotalTime() - ts;
        this.logNodeTree(this.baseNode);
    }
    resetNode() {
        if (!MMBatcher.enabled) return;
        if (!this.baseNode || !this._batchRecords || !this.baseNode.activeInHierarchy) return;
        var ts = cc.director.getTotalTime();

        for (let i = 0; i < this._batchRecords.length; i++) {
            const label = this._batchRecords[i];
            let lnode: cc.Node = label.label.node;
            label.cacheMode = cc.Label.CacheMode.CHAR;

            if (label.preParent !== this.baseNode) {
                lnode.setParent(label.preParent);
            }
            lnode.setPosition(label.prePos);
            lnode.setSiblingIndex(label.siblingIndex);
        }
        this._batchRecords = [];
        this.resetCost += cc.director.getTotalTime() - ts;
        MMBatcher.recordInfo(this.totalCount, this.batchCost, this.resetCost, this.uniqueName);
        this.logNodeTree(this.baseNode);
    }

    // 取脚本节点到label节点uuid路径
    getValidUUID(node) {
        // basenode to node parent
        let uuidPaths = [node.parent.uuid];
        let tmp = node.parent;

        while (tmp.uuid != this.baseNode.uuid) {
            tmp = tmp.parent;
            uuidPaths.unshift(tmp.uuid);
        }
        return uuidPaths;
    }
    // 通过uuid路径找节点
    getNodeByUUIDPath(uuids) {
        if (uuids.length == 1) {
            return this.baseNode;
        } else {
            let node = this.baseNode;
            for (let index = 1; index < uuids.length; index++) {
                const element = uuids[index];
                node = node.getChildByUuid(element);
                if (node == null) break;
            }
            return node;
        }
    }

    logNodeTree(node, depth = 3) {
        return;
        let arr: any = [];
        let cd = 0;
        function getSub(n, dpt) {
            let tmp = [];
            for (let index = 0; index < n.childrenCount; index++) {
                const element = n.children[index];
                if (element.childrenCount && dpt < depth) {
                    tmp.push({ [element.name]: getSub(element, ++cd) });
                } else {
                    tmp.push(element.name);
                }
            }
            return tmp;
        }
        arr = getSub(node, 0);
        console.warn(arr);
    }
}

window["debugger_MMBatcher"] = MMBatcher;
