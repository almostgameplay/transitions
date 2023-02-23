/**
 * 将节点下的label全部抽出，放在一个平行父节点下，达到分层目的
 */

// TODO:
// layout,widget如何管理？测试来看没影响，猜测layout执行在beforedraw之前？
// 算法优化,setparent和直接改_children那个速度快？
// 父节点继承信息处理(opacity,scale...)
// 测试速度

const {ccclass, property} = cc._decorator;

let TYPE_EXTRACT = cc.Enum({
	label: 0,
	spine:1
});
// cc.macro.CLEANUP_IMAGE_CACHE = false;
// cc.dynamicAtlasManager.enabled = true;
@ccclass
export default class SeparateNode extends cc.Component {

    static attachedNodes = []

    @property(cc.Node)
    baseNode: cc.Node = null;

    @property({ type: TYPE_EXTRACT,readonly:true })
	type = TYPE_EXTRACT.label;

    //TODO:只分层label，不还原。需要考虑layout，widget
    @property({ type: cc.Boolean,readonly:true,tooltip:"未支持,某些静态节点不需要自动更新" })
	isAutoRefresh = true;

    static addAttachNode(name){
        SeparateNode.attachedNodes.push(name);
    }
    static removeAttachNode(name){
        let i = SeparateNode.attachedNodes.indexOf(name)
        if(i < 0 ) return;
        SeparateNode.attachedNodes.splice(i,1);
    }

    protected onLoad(): void {
        SeparateNode.addAttachNode(this.node.name);
    }
    protected onDestroy(): void {
        SeparateNode.removeAttachNode(this.node.name);
    }
    protected onEnable(): void {
        this.initListener();
    }

    protected onDisable(): void {
        this.offListener();
    }
    initListener(){
        cc.director.on(cc.Director.EVENT_AFTER_DRAW,this.resetNode,this);
        cc.director.on(cc.Director.EVENT_BEFORE_DRAW,this.batchNode,this)

    }
    offListener(){
        cc.director.off(cc.Director.EVENT_AFTER_DRAW,this.resetNode,this);
        cc.director.off(cc.Director.EVENT_BEFORE_DRAW,this.batchNode,this)
    }
    _batchRecords = []
    _preChildren = []
    batchNode(){
        if(!this.baseNode) return;
        this._batchRecords = [];

        let labels = this.baseNode.getComponentsInChildren(cc.Label);

        for (let index = 0; index < labels.length; index++) {
            
            const label = labels[index];
              // 有子节点的先不支持
              if(label.node.childrenCount>0 || !label.node.activeInHierarchy) {
                // console.warn("dont support which has child node yet");
                continue;
            }
            this._batchRecords.push( {
                label,
                preParent: label.node.parent,
                siblingIndex: label.node.getSiblingIndex(),
                prePos: label.node.position,
            })
        }


        for (let i = 0; i < this._batchRecords.length; i++) {
            let labelRecord = this._batchRecords[i];
            let lnode:cc.Node = labelRecord.label.node;
          
            if(lnode.getComponent(cc.Layout)){
                lnode["_updateWorldMatrix"](); 
            }

            // 这个操作有点耗时，最好在预制体上改完
            if(labelRecord.label.cacheMode !==cc.Label.CacheMode.CHAR){
                labelRecord.label.cacheMode = cc.Label.CacheMode.CHAR;
            }
            if(lnode.parent === this.baseNode){
                lnode.setSiblingIndex(this.baseNode.childrenCount);
            } else {
                let wPos = lnode.parent.convertToWorldSpaceAR(lnode.position);
                lnode.setParent(this.baseNode);
                lnode.setPosition(this.baseNode.convertToNodeSpaceAR(wPos));
            }

        }
        this.logNodeTree(this.baseNode);
    }
    resetNode(){
        if(!this.baseNode || !this._batchRecords) return;

        for (let i = 0; i < this._batchRecords.length; i++) {
            const label = this._batchRecords[i];
            let lnode:cc.Node = label.label.node;
            label.cacheMode = cc.Label.CacheMode.CHAR;

            if(label.preParent !== this.baseNode){
                lnode.setParent(label.preParent);
            }
            lnode.setPosition(label.prePos);
            lnode.setSiblingIndex(label.siblingIndex);
        }
        this._batchRecords = [];
        this.logNodeTree(this.baseNode)

    }

    getValidUUID(node){
        // basenode to node parent
       let uuidPaths = [node.parent.uuid];
       let tmp = node.parent;

       while (tmp.uuid != this.baseNode.uuid) {
            tmp = tmp.parent;
            uuidPaths.unshift(tmp.uuid)
       }
       return uuidPaths;

    }
    getNodeByUUIDPath(uuids){
        if(uuids.length == 1){
            return this.baseNode;
        } else{
            let node = this.baseNode;
            for (let index = 1; index < uuids.length; index++) {
                const element = uuids[index];
                node = node.getChildByUuid(element);
                if(node == null) break;
            }
            return node;
        }
    }
   
    logNodeTree(node,depth=3){
        return;
        let arr:any = []
        let cd = 0;
        function getSub(n,dpt){
            let tmp = [];
            for (let index = 0; index < n.childrenCount; index++) {
                const element = n.children[index];
                if(element.childrenCount && dpt< depth){
                   tmp.push({[element.name]:getSub(element,++cd)})
                } else {
                    tmp.push(element.name);
                }
               
            }
            return tmp;
        }
        arr = getSub(node,0);
        console.warn(arr);
    }
}

window['debugger_MMBatcher'] = SeparateNode;