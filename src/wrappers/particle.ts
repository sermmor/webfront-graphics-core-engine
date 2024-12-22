import * as PixiParticles from "pixi-particles-cleaned";
import { Texture as PixiTexture } from "pixi.js";
import { Container } from "./container";
import { ParticleEmitterDecorator } from "./decorators/particle-emitter-decorator";
import { Point } from "./point";
import { Texture } from "./texture";

export type EmitterConfig = PixiParticles.EmitterConfig;

export class ParticleEmitter {
    private emiter: ParticleEmitterDecorator;

    static fromPathToTextures = (imagePaths: string[]): Texture[] => {
        return imagePaths.map(path => Texture.fromImage(path));
    }

    private static fromTextureToPixiTextures = (textures: Texture[]): PixiTexture[] => {
        return textures.map(t => t.texturePixiWebGl);
    }

    get ownerPosition() { return new Point(this.emiter.ownerPosition.x, this.emiter.ownerPosition.y); }
    get spawnPosition() { return new Point(this.emiter.spawnPos.x, this.emiter.spawnPos.y); }
    get spawnRectangle() {
        return {
            x: this.emiter.spawnRect.x,
            y: this.emiter.spawnRect.y,
            width: this.emiter.spawnRect.width,
            height: this.emiter.spawnRect.height
        };
    }
    get spawnCircle() {
        return {
            x: this.emiter.spawnCircle.x,
            y: this.emiter.spawnCircle.y,
            radius: this.emiter.spawnCircle.radius,
            minRadius: this.emiter.spawnCircle.minRadius,
        };
    }

    constructor(container: Container, textures: Texture[], config: EmitterConfig) {
        this.emiter = new ParticleEmitterDecorator(
            container.containerPixiWebGl,
            ParticleEmitter.fromTextureToPixiTextures(textures),
            config
        );
    }

    rotate = (newRot: number) => {
        this.emiter.rotate(newRot);
    }

    /**
	 * Changes the position of the emitter's owner. You should call this if you are adding
	 * particles to the world container that your emitter's owner is moving around in.
	 * @param x The new x value of the emitter's owner.
	 * @param y The new y value of the emitter's owner.
	 */
    updateOwnerPos = (x: number, y: number) => {
        this.emiter.updateOwnerPos(x, y);
    };

    /**
	 * Changes the spawn position of the emitter.
	 * @param x The new x value of the spawn position for the emitter.
	 * @param y The new y value of the spawn position for the emitter.
	 */
    updateSpawnPos = (x: number, y: number) => {
        this.emiter.updateSpawnPos(x, y);
    }

    setSpawnRectangle = (x: number, y: number, w?: number, h?: number) => this.emiter.setSpawnRectangle(x, y, w, h);

    setSpawnCircle = (x: number, y: number, radius?: number, minRadius?: number) => this.emiter.setSpawnCircle(x, y, radius, minRadius);

    update = (deltaTimeInSeconds: number) => this.emiter.update(deltaTimeInSeconds);

    destroy = () => this.emiter.destroy();
}