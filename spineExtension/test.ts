// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class LKTest extends cc.Component {
	@property(sp.Skeleton)
	spine: sp.Skeleton = null;

	@property(cc.Texture2D)
	spriteFrame: cc.Texture2D = null;

	// LIFE-CYCLE CALLBACKS:

	// onLoad () {}

	click() {
		this.spineChangeClouth(this.spine, null, "tang_1");
	}

	spineChangeClouth(ani: sp.Skeleton, tex2d: cc.Texture2D, slotsName: string) {
		if (tex2d == null) {
			ani.findSlot(slotsName).setAttachment(null);
			ani.invalidAnimationCache();
			return;
		}
		if (cc.sys.isNative) {
			let jsbTex = new middleware.Texture2D();
			jsbTex.setPixelsHigh(tex2d.height);
			jsbTex.setPixelsWide(tex2d.width);
			jsbTex.setNativeTexture(tex2d.getImpl());
			ani.updateRegion(slotsName, jsbTex);
		} else {
			let slot: sp.spine.Slot = ani.findSlot(slotsName);
			let attachment: sp.spine.RegionAttachment = slot.getAttachment() as sp.spine.RegionAttachment;
			if (!slot || !attachment) {
				cc.error("error...");
				return;
			}
			let region: sp.spine.TextureAtlasRegion = attachment.region as sp.spine.TextureAtlasRegion;
			let skeletonTexture = new sp.SkeletonTexture();
			skeletonTexture.setRealTexture(tex2d);
			region.u = 0;
			region.v = 0;
			region.u2 = 1;
			region.v2 = 1;
			region.width = tex2d.width;
			region.height = tex2d.height;
			region.originalWidth = tex2d.width;
			region.originalHeight = tex2d.height;
			region.rotate = false;
			region.texture = skeletonTexture;
			region.page = null;
			attachment.width = region.width;
			attachment.height = region.height;
			attachment.setRegion(region);
			attachment.updateOffset();
			slot.setAttachment(attachment);
		}
		ani.invalidAnimationCache();
	}

	updatePartialSkin(ani: sp.Skeleton, tex2d: cc.Texture2D, slotsName: string) {
		let slot: sp.spine.Slot = ani.findSlot(slotsName);
		let attachment: sp.spine.RegionAttachment = slot.getAttachment() as sp.spine.RegionAttachment;
		if (!slot || !attachment) {
			cc.error("error...");
			return;
		}
		let region: sp.spine.TextureAtlasRegion = attachment.region as sp.spine.TextureAtlasRegion;
		let skeletonTexture = new sp.SkeletonTexture();
		skeletonTexture.setRealTexture(tex2d);
		region.u = 0;
		region.v = 0;
		region.u2 = 1;
		region.v2 = 1;
		region.width = tex2d.width;
		region.height = tex2d.height;
		region.originalWidth = tex2d.width;
		region.originalHeight = tex2d.height;
		region.rotate = false;
		region.texture = skeletonTexture;
		region.page = null;
		attachment.width = region.width;
		attachment.height = region.height;
		attachment.setRegion(region);
		attachment.updateOffset();
		slot.setAttachment(attachment);
		ani.invalidAnimationCache();
	}
}
