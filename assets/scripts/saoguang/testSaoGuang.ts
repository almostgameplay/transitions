// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { cx_TimeMgr } from "../../scripts/Cx_Frame/frame/gameMgr/TimeMgr";
import saoGuang from "./saoGuang";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
	@property()
	lineWidth: number = 0.2;
	@property()
	time: number = 3;
	@property()
	angle: number = 180;
	@property()
	center_start: cc.Vec2 = cc.v2();
	@property()
	center_end: cc.Vec2 = cc.v2(1, 1);

	@property({ displayName: "输出配置" })
	get print() {
		return this._print;
	}
	set print(value: boolean) {
		this._print = value;
		if (value) {
			let params = this.lineWidth + ";" + this.time + ";" + this.center_start.x + "," + this.center_start.y + ";" + this.center_end.x + "," + this.center_end.y + ";" + this.angle;
			cc.log(params);
		}
		this._print = false;
	}
	_print: boolean = false;

	parasStr: string = "";
	onLoad(): void {
		cx_TimeMgr.init(this);
		this.play();
	}
	play() {
		let params = this.lineWidth + ";" + this.time + ";" + this.center_start.x + "," + this.center_start.y + ";" + this.center_end.x + "," + this.center_end.y + ";" + this.angle;
		cc.log(params);
		this.playSaoGuang(this.node, params);
		this.parasStr = params;
		this.unscheduleAllCallbacks();
		this.schedule(() => {
			this.playSaoGuang(this.node, params);
		}, this.time + 1);
	}
	playSaoGuang(node: cc.Node, params?: string) {
		if (!node.active) return;
		if (node.getComponent(cc.Sprite) || node.getComponent(sp.Skeleton)) {
			let oldJs = node.getComponent(saoGuang);
			let js: saoGuang = null;
			if (oldJs) {
				js = oldJs;
			} else {
				js = node.addComponent(saoGuang);
			}

			if (params) {
				let arr = params.split(";");
				let lineWidth = parseFloat(arr[0]);
				let time = parseFloat(arr[1]);
				let centerArr = arr[2].split(",");
				let center = cc.v2(parseFloat(centerArr[0]), parseFloat(centerArr[1]));
				let centerEndArr = arr[3].split(",");
				let centerEnd = cc.v2(parseFloat(centerEndArr[0]), parseFloat(centerEndArr[1]));
				let angle = parseFloat(arr[4]);
				js.setParams(lineWidth, time, center, centerEnd, angle);
			}
			js.prePlayTx();
		}
	}

	protected update(dt: number): void {
		cx_TimeMgr.update(dt);
	}
}
