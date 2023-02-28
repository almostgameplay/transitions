import BaseAssembler from "./BaseAssembler";

const gfx = cc["gfx"];

// 顶点格式 -> 位置 UV, 颜色
let vfmtPosUvColor = new gfx.VertexFormat([
    { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
    { name: gfx.ATTR_UV0, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
    { name: "a_texture_idx", type: gfx.ATTR_TYPE_FLOAT32, num: 1 },
    { name: gfx.ATTR_COLOR, type: gfx.ATTR_TYPE_UINT8, num: 4, normalize: true },
]);

export default class MultiTexAssembler extends BaseAssembler {
    floatsPerVert = 6;
    colorOffset = 5;

    _comp;
    init(comp) {
        this._comp = comp;

        super.init(comp);
    }
    public getVfmt() {
        return vfmtPosUvColor;
    }

    public initData() {
        let data = this._renderData;
        // data.createQuadData(0, this.verticesFloats, this.indicesCount);
        // createFlexData支持创建指定格式的renderData
        data.createFlexData(0, this.verticesCount, this.indicesCount, this.getVfmt());

        // createFlexData不会填充顶点索引信息，手动补充一下
        let indices = data.iDatas[0];
        let count = indices.length / 6;
        for (let i = 0, idx = 0; i < count; i++) {
            let vertextID = i * 4;
            indices[idx++] = vertextID;
            indices[idx++] = vertextID + 1;
            indices[idx++] = vertextID + 2;
            indices[idx++] = vertextID + 1;
            indices[idx++] = vertextID + 3;
            indices[idx++] = vertextID + 2;
        }
    }
    /** 更新renderdata */
    protected updateRenderData(comp: cc.RenderComponent) {
        if (comp._vertsDirty) {
            this.updateUVs(comp);
            this.updateVerts(comp as cc.Sprite);
            this.updateTextureIdx(comp);
            comp._vertsDirty = false;
        }
    }
    protected getUVs(): number[] {
        let uv = (this._comp as cc.Sprite)._spriteFrame["uv"];
        return uv;
    }
    updateTextureIdx(sprite) {
        let verts = this._renderData.vDatas[0];
        // pervertex 6
        verts[4] = sprite.textureIdx;
        verts[10] = sprite.textureIdx;
        verts[16] = sprite.textureIdx;
        verts[22] = sprite.textureIdx;
    }
}
