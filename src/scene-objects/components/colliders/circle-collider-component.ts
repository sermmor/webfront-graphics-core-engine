import { Bodies } from "matter-js";
import { ColliderComponent } from "./collider-component";
import { GameObject } from "../../game-object";
import { TransformComponent } from "../transform-component";
import { Container } from "../../../wrappers/container";
import { Graphics } from "../../../wrappers/graphics";
import { Game } from "../../game";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Component } from "../component";

export class CircleColliderComponent extends ColliderComponent {
    public static nameComponent = "CircleColliderComponent";
    protected debugCircle: Graphics | undefined;
    protected radius: number;

    getNameComponent(): string {
        return CircleColliderComponent.nameComponent;
    }

    protected doBuildAndPlaceCollider(
        gameObject: GameObject,
        sceneObjectToScreenProportion: {x: number, y: number}
    ) {
        // In a circle always: x === y
        this.radius *= (gameObject.transform.scale.x * sceneObjectToScreenProportion.x);

        const positionX = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        const positionY = gameObject.transform.position.y * sceneObjectToScreenProportion.y;

        if (!this.rigidbody) {
            this._body = Bodies.circle(
                positionX + this.offset.x, positionY + this.offset.y, this.radius,
                { isStatic: true }
            );
        } else {
            this._body = Bodies.circle(
                positionX + this.offset.x, positionY + this.offset.y, this.radius,
                { isStatic: this.rigidbody.type === "Static" }
            );
        }
    }

    protected createPhysicDebugger(containerDebug: Container, transform: TransformComponent): Container {
        if (this.debugCircle && this.isStatic)
            return this.debugCircle;
        
        if (this.debugCircle && !Game.instance.propierties.debugProperties.isPhysicTraceEnabled) {
            containerDebug.removeChild(this.debugCircle);
            this.debugCircle.clear();
        }
        this.debugCircle = new Graphics();
        this.debugCircle.lineStyle(1, Game.instance.propierties.debugProperties.debuggerColor!);
        this.debugCircle.drawCircle(this._body.position.x, this._body.position.y, this.radius);
        containerDebug.addChild(this.debugCircle);

        return this.debugCircle;
    }

    setScale(newScaleX: number, newScaleY: number) {
        super.setScale(newScaleX, newScaleY);
        this.radius = newScaleX * this.sceneObjectToScreenProportion.x;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.debugCircle) {
            this.debugCircle.parent.removeChild(this.debugCircle);
            this.debugCircle = undefined;
        }
        return super.destroy();
    }

    clone = (): Component => {
        const clone = <CircleColliderComponent> super.cloneCoping(new CircleColliderComponent());
        clone.radius = this.radius;

        if (this._body) {
            clone._body = Bodies.circle(this._body.position.x, this._body.position.y, this.radius,
                    { isStatic: !this.rigidbody || this.rigidbody.type === "Static" });
            this.setColliderCategories(this.layerMask);
        }

        if (this.debugCircle) {
            clone.debugCircle = new Graphics();
            clone.debugCircle.lineStyle(1, Game.instance.propierties.debugProperties.debuggerColor!);
            clone.debugCircle.drawCircle(clone._body.position.x, clone._body.position.y, clone.radius);
            this.debugCircle.parent.addChild(clone.debugCircle);
        }

        return clone;
    }
}
