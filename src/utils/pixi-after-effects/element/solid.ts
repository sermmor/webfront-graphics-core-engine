import { Element, ElementData } from './element';

export class SolidElement extends Element {
    color: string | number;
    sw: number;
    sh: number;
    opacity: number;

    constructor(data: ElementData) {
        super(data);
        this.color = data.sc!;
        this.sw = data.sw!;
        this.sh = data.sh!;
        if ((<string>this.color).startsWith('#')) {
            (<number>this.color) = +`0x${(<string>this.color).substr(1)}`;
        }
    }

    privateUpdateWithFrame(frame: number): boolean {
        const result = super.privateUpdateWithFrame(frame);
        this.clear();
        this.beginFill(<number>this.color, this.opacity);
        this.drawRect(0, 0, this.sw * this.scaleX, this.sh * this.scaleY);
        this.endFill();
        return result;
    }
}
