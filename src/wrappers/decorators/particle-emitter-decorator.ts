import * as PixiParticles from "pixi-particles-cleaned";
import { Circle, Rectangle } from "pixi.js";

export class ParticleEmitterDecorator extends PixiParticles.Emitter {
    get ownerPosition() { return this.ownerPos; }

    setSpawnRectangle = (x: number, y: number, w?: number, h?: number) => {
        if (!w) {
            w = this.spawnRect.width;
        }
        if (!h) {
            h = this.spawnRect.height;
        }
        this.spawnRect = new Rectangle(x, y, w, h);
    }

    setSpawnCircle = (x: number, y: number, radius?: number, minRadius?: number) => {
        if (!radius) {
            radius = this.spawnCircle.radius;
        }
        if (!minRadius) {
            minRadius = this.spawnCircle.minRadius;
        }
        const circle =  new Circle(x, y, radius);
        (<any> circle)["minRadius"] = minRadius;
        this.spawnCircle = <Circle & {minRadius: number}> circle;
    }
}