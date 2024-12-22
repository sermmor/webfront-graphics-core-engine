import { Bodies } from "matter-js";
import { ColliderComponent } from "./collider-component";
import { GameObject } from "../../game-object";
import { TransformComponent } from "../transform-component";
import { Container } from "../../../wrappers/container";
import { Graphics } from "../../../wrappers/graphics";
import { Game } from "../../game";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Component } from "../component";

export class RectangleColliderComponent extends ColliderComponent {
    public static nameComponent = "RectangleColliderComponent";
    protected debugRectangle: Graphics | undefined;
    protected size: { width: number; height: number};
    
    private sizeBase: { width: number; height: number};

    getNameComponent(): string {
        return RectangleColliderComponent.nameComponent;
    }

    protected doBuildAndPlaceCollider(
        gameObject: GameObject,
        sceneObjectToScreenProportion: {x: number, y: number},
    ) {
        this.sizeBase = { ...this.size };
        this.size.width *= (gameObject.transform.scale.x * sceneObjectToScreenProportion.x);
        this.size.height *= (gameObject.transform.scale.y * sceneObjectToScreenProportion.y);

        const positionX = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        const positionY = gameObject.transform.position.y * sceneObjectToScreenProportion.y;
        
        if (!this.rigidbody) {
            this._body = Bodies.rectangle(
                positionX + this.offset.x, positionY + this.offset.y, this.size.width, this.size.height,
                { isStatic: true }
            );
        } else {
            this._body = Bodies.rectangle(
                positionX + this.offset.x, positionY + this.offset.y, this.size.width, this.size.height,
                { isStatic: this.rigidbody.type === "Static"}
            );
        }
    }

    protected createPhysicDebugger(containerDebug: Container, transform: TransformComponent): Container {
        if (this.debugRectangle && this.isStatic)
            return this.debugRectangle;

        if (this.debugRectangle && !Game.instance.propierties.debugProperties.isPhysicTraceEnabled) {
            containerDebug.removeChild(this.debugRectangle);
            this.debugRectangle.clear();
        }
        // const { max: { x: x1, y: y1 }, min: { x: x0, y: y0 } } = this._body.bounds;
        this.debugRectangle = new Graphics();
        this.debugRectangle.lineStyle(1, Game.instance.propierties.debugProperties.debuggerColor!);
        this.debugRectangle.drawRect(
            this._body.bounds.min.x,
            this._body.bounds.min.y,
            this._body.bounds.max.x - this._body.bounds.min.x,
            this._body.bounds.max.y - this._body.bounds.min.y
        );
        containerDebug.addChild(this.debugRectangle);

        return this.debugRectangle;
    }

    setScale(newScaleX: number, newScaleY: number) {
        super.setScale(newScaleX, newScaleY);
        this.size.width = this.sizeBase.width * newScaleX;
        this.size.height = this.sizeBase.height * newScaleY;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.debugRectangle) {
            this.debugRectangle.parent.removeChild(this.debugRectangle);
            this.debugRectangle = undefined;
        }
        return super.destroy();
    }

    clone = (): Component => {
        const clone = <RectangleColliderComponent> super.cloneCoping(new RectangleColliderComponent());
        
        clone.size = {
            width: this.size.width,
            height: this.size.height,
        }

        if (this._body) {
            clone._body = Bodies.rectangle(
                this._body.bounds.min.x,
                this._body.bounds.min.y,
                this._body.bounds.max.x - this._body.bounds.min.x,
                this._body.bounds.max.y - this._body.bounds.min.y,
                { isStatic: !this.rigidbody || this.rigidbody.type === "Static" });
            this.setColliderCategories(this.layerMask);
        }

        if (this.debugRectangle) {
            clone.debugRectangle = new Graphics();
            clone.debugRectangle.lineStyle(1, Game.instance.propierties.debugProperties.debuggerColor!);
            clone.debugRectangle.drawRect(
                clone._body.bounds.min.x,
                clone._body.bounds.min.y,
                clone._body.bounds.max.x - clone._body.bounds.min.x,
                clone._body.bounds.max.y - clone._body.bounds.min.y
            );
            this.debugRectangle.parent.addChild(clone.debugRectangle);
        }

        return clone;
    }
}
