import { cx_TimeMgr } from "../../scripts/Cx_Frame/frame/gameMgr/TimeMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class saoGuang extends cc.Component {
	public lineW = 0.2;
	public time = 0.5;
	public center = cc.v2();
	public center_end = cc.v2(1.2, 1.2);
	public angle = 100;
	private _initLineWidth = 0.2;
	private _st = 0;
	private _formMaterial = null;
	isAlive = true;
	private _isUseDefineParams: boolean = false;
	onLoad(): void {}
	setParams(lineWidth: number = 0.2, time: number = 2, center: cc.Vec2 = cc.v2(), center_end: cc.Vec2 = cc.v2(), angle: number = 110) {
		this.lineW = lineWidth;
		this.time = time;
		this.center = center;
		this.center_end = center_end;
		this.angle = angle;
		this._isUseDefineParams = true;
	}
	_doneCb = null;
	prePlayTx(cb=null) {
		this._doneCb = cb;
		this.getComponents(cc.RenderComponent).forEach((renderComponent) => {
			let material: cc.Material = renderComponent.getMaterial(0);
			if (!material) return this.clear();
			if (material.name == "builtin-2d-sprite (Instance)") {
				let spine = this.getComponent(sp.Skeleton);
				let saoGuangName = spine ? "saoGuang_spine" : "saoGuang";
				cc.resources.load("Material/" + saoGuangName, cc.Material, (err, material: cc.Material) => {
					if (!this.isAlive) return;
					if (err) return;
					this.getComponents(cc.RenderComponent).forEach((renderComponent) => {
						if (!this._formMaterial) this._formMaterial = renderComponent.getMaterial(0);
						renderComponent.setMaterial(0, material);
						//console.log("set material ", material.name);
					});
					this.playTX();
				});
			} else this.playTX();
		});
	}
	playTX(times = 2, interval = 0.2) {
		cx_TimeMgr.cancleDtTriggerCb(this);
		this.unscheduleAllCallbacks();
		this._st = times;
		this._st--;
		let delay = this._doOneTx() + interval;
		this.scheduleOnce(() => {
			if (this._st > 0) {
				this.playTX(this._st, interval);
			} else {
				this.clear();
			}
		}, delay);
	}
	clear() {
		this._doneCb && this._doneCb();
		this._doneCb = null;
		this._isUseDefineParams = false;
		cx_TimeMgr.cancleDtTriggerCb(this);
		this.unscheduleAllCallbacks();
		this.getComponents(cc.RenderComponent).forEach((renderComponent) => {
			let cz = renderComponent.getMaterials()[0];
			if (this._formMaterial) {
				renderComponent.setMaterial(0, this._formMaterial);
				if (cz) cz.destroy();
			}
		});
		//this.node.removeComponent(this);
		this.destroy();
		this.isAlive = false;
	}
	private _doOneTx() {
		let time = this.time;
		let lightWidth = this.lineW;
		let center = this.center;
		if (!this._isUseDefineParams) {
			let len = Math.max(this.node.width, this.node.height);
			if (len > 400) time = 0.5;
			else time = 0.375;
		}
		let spine = this.getComponent(sp.Skeleton);

		this.getComponents(cc.RenderComponent).forEach((renderComponent) => {
			let material: cc.Material = renderComponent.getMaterial(0);
			if (!material) return 0;
			if (material.name !== "saoGuang (Instance)" && material.name !== "saoGuangStencil (Instance)") return 0;
			material.setProperty("lightWidth", lightWidth);
			material.setProperty("lightCenterPoint", center);
			material.setProperty("lightAngle", this.angle);

			cx_TimeMgr.registDtTriggerCb(
				(dt: number, totalSt: number, isEnd: boolean) => {
					let cCenter = center.add(cc.v2(this.center_end.x / time, this.center_end.y / time).mul(totalSt)); //.add(cc.v2(-0.5, -0.5));
					material.setProperty("lightCenterPoint", cCenter);
					if (spine) spine["_updateMaterial"]();
					if (isEnd) {
						console.log(totalSt);
					}
				},
				this,
				time
			);
		});
		return time;
	}
}
