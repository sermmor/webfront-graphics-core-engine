import { Equation } from "../../../math-utils/interpolation/types";
import { Point } from "../../../wrappers/point";
import { Component } from "../component";
import { bezierCubic } from "../../../math-utils/interpolation/bezier-cubic";
import { BezierTweenComponent } from "./bezier-tween-component";

/**
 * Tween for Bezier Cubic.
 */
export class BezierCubicTweenComponent extends BezierTweenComponent {

    getNameComponent(): string {
        return "BezierCubicTweenComponent";
    }

    buildTweenFunction(): Equation {
        return bezierCubic(this.p1, this.p2);
    }
    
    clone = (): Component => {
        const clone = <BezierCubicTweenComponent> this.cloneParentBuilder(new BezierCubicTweenComponent());
        clone.p1 = new Point(this.p1.x, this.p1.y);
        clone.p2 = new Point(this.p2.x, this.p2.y);
        return clone;
    }
}