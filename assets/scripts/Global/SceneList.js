const TipsManager = require('TipsManager');
import TransitionMaterials from '../../resources/transitions/transition-materials';
// const TransitionMaterials = require('transition-materials');

const SceneList = cc.Class({
    extends: cc.Component,

    properties: {
        itemPrefab: {
            default: null,
            type: cc.Prefab
        },
        initItemCount: 0,
        scrollView: cc.ScrollView,
        bufferZone: 0, // when item is away from bufferZone, we relocate it
    },

    createItem: function (x, y, name, url) {
        var item = cc.instantiate(this.itemPrefab);
        var itemComp = item.getComponent('ListItem');
        var label = itemComp.label;
        label.string = name;

        if (url) {
            itemComp.url = url;
        }

        // item.width = w;
        item.x = x;
        item.y = y;
        this.node.addChild(item);
        return item;
    },

    init (menu) {
        this.menu = menu;
        this.sceneList = [];
        this.itemList = [];
        this.updateTimer = 0;
        this.updateInterval = 0.2;
        this.lastContentPosY = 0; // use this variable to detect if we are scrolling up or down
        TipsManager.init();
        setTimeout(() => {
            this.initList()
        }, 300);
       
    },

    // use this for initialization
    initList () {
        let y = 0;
        this.node.height = (TransitionMaterials.length + 1) * 50;
        let initItemCount = Math.min(this.initItemCount, TransitionMaterials.length);
        for (let i = 0; i < initItemCount; ++i) {
            let item = cc.instantiate(this.itemPrefab).getComponent('ListItem');
            let material = TransitionMaterials[i];
            item.init(this.menu);
            this.node.addChild(item.node);
            y -= 50;
            item.updateItem(i, y, material.name);
            this.itemList.push(item);
        }
    },

    getPositionInView: function (item) { // get item position in scrollview's node space
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    },

    update (dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval) {
            return; // we don't need to do the math every frame
        }
        this.updateTimer = 0;
        let items = this.itemList;
        let buffer = this.bufferZone;
        let isDown = this.node.y < this.lastContentPosY; // scrolling direction
        let curItemCount = this.itemList.length;
        let offset = 50 * curItemCount;
        for (let i = 0; i < curItemCount; ++i) {
            let item = items[i];
            let itemNode = item.node;
            let viewPos = this.getPositionInView(itemNode);
            if (isDown) {
                // if away from buffer zone and not reaching top of content
                if (viewPos.y < -buffer && itemNode.y + offset < 0) {
                    let newIdx = item.index - curItemCount;
                    let newInfo = TransitionMaterials[newIdx];
                    item.updateItem(newIdx, itemNode.y + offset, newInfo.name);
                }
            } else {
                // if away from buffer zone and not reaching bottom of content
                if (viewPos.y > buffer && itemNode.y - offset > -this.node.height) {
                    let newIdx = item.index + curItemCount;
                    let newInfo = TransitionMaterials[newIdx];
                    item.updateItem(newIdx, itemNode.y - offset, newInfo.name);
                }
            }
        }
        // update lastContentPosY
        this.lastContentPosY = this.node.y;
    },
});
