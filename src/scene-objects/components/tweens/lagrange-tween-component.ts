import { TweenComponent, TweenOption } from "./tween-component";
import { Equation } from "../../../math-utils/interpolation/types";
import { Component } from "../component";
import { Point } from "../../../wrappers/point";
import { Lagrange } from "../../../math-utils/interpolation/lagrange-interpolation";

/**
 * Tween using classic polynomial curve of, at least, 3 points (Lagrange algorithm).
*/
export class LagrangeTweenComponent extends TweenComponent {
    protected points: Point[];
    private temporal = {
        indexLoop: 0,
    }

    getNameComponent(): string {
        return "LagrangeTweenComponent";
    }

    setPosition(newPositionX: number, newPositionY: number): void {
        if (this.option === TweenOption.move) {
            this.forceToInitialState();
            const diffX = newPositionX - this.points[0].x;
            const diffY = newPositionY - this.points[0].y;
            this.points[0].x = newPositionX;
            this.points[0].y = newPositionY;
            for (this.temporal.indexLoop = 1; this.temporal.indexLoop < this.points.length; this.temporal.indexLoop++) {
                this.points[this.temporal.indexLoop].x = diffX + this.points[this.temporal.indexLoop].x;
                this.points[this.temporal.indexLoop].y = diffY + this.points[this.temporal.indexLoop].y;
            }
            this.buildTweenFunction();
        }
    }
    setScale(newScaleX: number, newScaleY: number): void {
        if (this.option === TweenOption.scale) {
            this.forceToInitialState();
            const diffX = newScaleX - this.points[0].x;
            const diffY = newScaleY - this.points[0].y;
            this.points[0].x = newScaleX;
            this.points[0].y = newScaleY;
            for (this.temporal.indexLoop = 1; this.temporal.indexLoop < this.points.length; this.temporal.indexLoop++) {
                this.points[this.temporal.indexLoop].x = diffX + this.points[this.temporal.indexLoop].x;
                this.points[this.temporal.indexLoop].y = diffY + this.points[this.temporal.indexLoop].y;
            }
            this.buildTweenFunction();
        }
    }

    setRotation(newRotation: number): void {
        if (this.option === TweenOption.rotate) {
            this.forceToInitialState();            
            const diffX = newRotation - this.points[0].x;
            this.points[0].x = newRotation;
            for (this.temporal.indexLoop = 1; this.temporal.indexLoop < this.points.length; this.temporal.indexLoop++) {
                this.points[this.temporal.indexLoop].x = diffX + this.points[this.temporal.indexLoop].x;
            }
            this.buildTweenFunction();
        }
    }

    buildTweenFunction(): Equation {
        const lagrangeCurve = new Lagrange(this.points);
        return lagrangeCurve.getBuilder();
    }

    clone(): Component {
        const clone = <LagrangeTweenComponent> this.cloneParentBuilder(new LagrangeTweenComponent());
        clone.points = [...this.points];
        return clone;
    }

}