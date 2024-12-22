import { TweenComponent, TweenOption } from "./tween-component";
import { Equation } from "../../../math-utils/interpolation/types";
import { Point } from "../../../wrappers/point";
import { Component } from "../component";
import { BezierCurve } from "../../../math-utils/interpolation/bezier-curve";

/**
 * Tween for Bezier.
 */
export class BezierTweenComponent extends TweenComponent {
    protected p1: Point;
    protected p2: Point;

    getNameComponent(): string {
        return "BezierTweenComponent";
    }

    setPosition(newPositionX: number, newPositionY: number): void {
        if (this.option === TweenOption.move) {
            this.forceToInitialState();
            const diffX = newPositionX - this.p1.x;
            const diffY = newPositionY - this.p1.y;
            this.p1.x = newPositionX;
            this.p1.y = newPositionY;
            this.p2.x = diffX + this.p2.x;
            this.p2.y = diffY + this.p2.y;
            this.buildTweenFunction();
        }
    }

    setScale(newScaleX: number, newScaleY: number): void {
        if (this.option === TweenOption.scale) {
            this.forceToInitialState();
            const diffX = newScaleX - this.p1.x;
            const diffY = newScaleY - this.p1.y;
            this.p1.x = newScaleX;
            this.p1.y = newScaleY;
            this.p2.x = diffX + this.p2.x;
            this.p2.y = diffY + this.p2.y;
            this.buildTweenFunction();
        }
    }

    setRotation(newRotation: number): void {
        if (this.option === TweenOption.rotate) {
            this.forceToInitialState();
            const diffX = newRotation - this.p1.x;
            this.p1.x = newRotation;
            this.p2.x = this.p2.x + diffX;
            this.buildTweenFunction();
        }
    }

    buildTweenFunction(): Equation {
        const curve: BezierCurve = new BezierCurve(this.p1, this.p2);
        return (percentageTime: number) => curve.solve(percentageTime);
    }
    
    clone = (): Component => {
        const clone = <BezierTweenComponent> this.cloneParentBuilder(new BezierTweenComponent());
        clone.p1 = new Point(this.p1.x, this.p1.y);
        clone.p2 = new Point(this.p2.x, this.p2.y);
        return clone;
    }
}