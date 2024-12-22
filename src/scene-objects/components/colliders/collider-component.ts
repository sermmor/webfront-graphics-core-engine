import { Body, Vector, Engine, Composite } from "matter-js";
import { RigidbodyComponent } from "../rigidbody-component";
import { GameObject } from "../../game-object";
import { TransformComponent } from "../transform-component";
import { Container } from "../../../wrappers/container";
import { Component, IComponentLifeCompleted, ITransformableComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Game } from "../../game";

export const ColliderLayers: {[key: string]: number} = {
    default: 0x0001, // All the things can collision with default category.
    layer01: 0x0002,
    layer02: 0x0004,
    layer03: 0x0008,
    layer04: 0x0016,
    layer05: 0x0032,
    layer06: 0x0064,
    layer07: 0x0128,
    layer08: 0x0256,
    layer09: 0x0512,
    layer10: 0x1028,
    layer11: 0x2056,
    layer12: 0x4112,
}

export abstract class ColliderComponent extends Component implements IComponentLifeCompleted, ITransformableComponent {
    protected _body: Body;
    protected _indexUpdater: number;
    protected offset: { x: number; y: number};
    protected labelCollider: string;
    protected layerMask: string;
    rigidbody: RigidbodyComponent;
    physicsEngine: Engine;
    protected sceneObjectToScreenProportion: {x: number, y: number};
    private isFreeze: boolean;

    private temporal = {
        vectorUsedForChanges: Vector.create(0, 0),
        transform: <TransformComponent | undefined> undefined,
        containerDebug: <Container | undefined> undefined,
        gameObject: <GameObject | undefined> undefined,
        size: <{ width?: number; height?: number } | undefined> undefined,
    }

    get body(): Body { return this._body; }
    get label(): string { return this.labelCollider; }
    get isStatic(): boolean { return !this.isFreeze && this._body.isStatic; }

    abstract getNameComponent(): string;

    buildAndPlaceCollider(
        gameObject: GameObject,
        sceneObjectToScreenProportion: {x: number, y: number},
        rigidbody?: RigidbodyComponent,
    ) {
        this.beginBuldAndPlaceCollider(sceneObjectToScreenProportion, rigidbody);
        this.doBuildAndPlaceCollider(gameObject, sceneObjectToScreenProportion);
        this.endBuildAndPlaceCollider();
    }

    private beginBuldAndPlaceCollider(
        sceneObjectToScreenProportion: {x: number, y: number},
        rigidbody?: RigidbodyComponent
    ) {
        this.rigidbody = rigidbody!;
        this.sceneObjectToScreenProportion = sceneObjectToScreenProportion;
        this.offset.x *= sceneObjectToScreenProportion.x;
        this.offset.y *= sceneObjectToScreenProportion.y;
        this.temporal.vectorUsedForChanges = Vector.create(0, 0);
    }

    protected abstract doBuildAndPlaceCollider(
        gameObject: GameObject,
        sceneObjectToScreenProportion: {x: number, y: number},
    ): void;

    private endBuildAndPlaceCollider() {
        this.setColliderCategories(this.layerMask);
        if (this.isFreeze) {
            this.setFreeze(this.isFreeze);
        }
    }

    runPhysics(
        transform: TransformComponent,
        gameObject: GameObject,
        size: { width?: number; height?: number },
        containerDebug?: Container
    ) {
        this.temporal.transform = transform;
        this.temporal.gameObject = gameObject;
        this.temporal.size = size;
        this.temporal.containerDebug = containerDebug;
        if (!this.isFreeze) {
            if (containerDebug) {
                this.createPhysicDebugger(containerDebug, transform);
            }
            if (!this.isStatic) {
                this.connectPhysicsWithGameObjectWithSprite(transform, gameObject, size, containerDebug);
            } else if (containerDebug) {
                this.connectPhysicsWithStaticDebug();
            }
        }
    }

    private connectPhysicsWithStaticDebug() {
        this._indexUpdater = Game.instance.updateEventManager.addUpdateEvent(this.connectPhysicsWithStaticDebugEvent);
    }
    private connectPhysicsWithStaticDebugEvent = (timestamp: number) => this.createPhysicDebugger(this.temporal.containerDebug!, this.temporal.transform!);

    private connectPhysicsWithGameObjectWithSprite = (
        transform: TransformComponent,
        gameObject: GameObject,
        size: { width?: number; height?: number },
        containerDebug?: Container
    ) => {
        let bodyPosition: Vector;
        let isInHorizontalRange: boolean, isInVerticalRange: boolean;
        this._indexUpdater = Game.instance.updateEventManager.addUpdateEvent((timestamp: number) => {
            if (this.isFreeze) return;
            bodyPosition = this._body.position;
            isInHorizontalRange = this.isInHorizontalRange(bodyPosition.x, size.width);
            isInVerticalRange = this.isInVerticalRange(bodyPosition.y, size.height);
            if (isInHorizontalRange && isInVerticalRange) {
                gameObject.setPosition(bodyPosition.x, bodyPosition.y, false, false);
            } else if (isInHorizontalRange) {
                gameObject.setPosition(bodyPosition.x, transform.position.y, false, false);
            } else if (isInVerticalRange) {
                gameObject.setPosition(transform.position.x, bodyPosition.y, false, false);
            }
            if (isInHorizontalRange || isInVerticalRange) {
                gameObject.setRotation(this._body.angle, false);
            }
            if (containerDebug && isInHorizontalRange && isInVerticalRange) {
                this.createPhysicDebugger(containerDebug, transform);
            }
            // console.log(`${bodyPosition.position.x}, ${bodyPosition.position.y}`);
        });
    }

    protected abstract createPhysicDebugger(containerDebug: Container, transform: TransformComponent): Container;

    private isInHorizontalRange = (x: number, width?: number) => !width || (x >= 0 && x <= width);

    private isInVerticalRange = (y: number, height?: number) => !height || (y >= 0 && y <= height);

    setVelocity = (x: number, y: number) => Body.setVelocity(this._body, Vector.create(x, y));
    getVelocity = (): Vector => this.body.velocity;

    setPosition(newPositionX: number, newPositionY: number) {
        if (this._body) {
            this.temporal.vectorUsedForChanges!.x = newPositionX + this.offset.x;
            this.temporal.vectorUsedForChanges!.y = newPositionY + this.offset.y;
            Body.setPosition(this._body, this.temporal.vectorUsedForChanges!);
        }
    }

    setScale(newScaleX: number, newScaleY: number) {
        if (this._body) {
            Body.scale(this._body, newScaleX, newScaleY);
        }
    }

    setRotation(newRotation: number) {
        if (this._body) {
            Body.rotate(this._body, newRotation);
        }
    }

    setFreeze = (isFreeze: boolean) => {
        this.isFreeze = isFreeze;
        if (this.rigidbody && this.rigidbody.type === "Dynamic" && this._body) {
            Body.setStatic(this._body, isFreeze);
            if (isFreeze && this._indexUpdater) {
                Game.instance.updateEventManager.removeUpdateEvent(this._indexUpdater);
            } else if (!isFreeze) {
                this.runPhysics(
                    this.temporal.transform!,
                    this.temporal.gameObject!,
                    this.temporal.size!,
                    this.temporal.containerDebug,
                );
            }
        }
    }

    setColliderCategories(colliderCategory: string | undefined) {
        if (colliderCategory && colliderCategory !== "default") {
            const category = ColliderLayers[colliderCategory];
            this._body.collisionFilter.category = category;
            this._body.collisionFilter.mask = ColliderLayers.default | category;
            this.layerMask = colliderCategory;
        } else {
            this._body.collisionFilter.category = ColliderLayers.default;
            this._body.collisionFilter.mask = ColliderLayers.default | ColliderLayers.layer01
                | ColliderLayers.layer02 | ColliderLayers.layer03 | ColliderLayers.layer04
                | ColliderLayers.layer05 | ColliderLayers.layer06 | ColliderLayers.layer07
                | ColliderLayers.layer08 | ColliderLayers.layer09 | ColliderLayers.layer10
                | ColliderLayers.layer11 | ColliderLayers.layer12;
            this.layerMask = "default";
        }
    }

    destroy(): BaseTexture | undefined {
        if (this._body && this.physicsEngine) {
            Game.instance.updateEventManager.removeUpdateEvent(this._indexUpdater);
            Composite.remove(this.physicsEngine.world, this._body);
        }
        return undefined;
    }

    abstract clone(): Component;

    protected cloneCoping (clone: ColliderComponent): Component {
        clone.offset = {
            x: this.offset.x,
            y: this.offset.y,
        };

        clone.labelCollider = this.labelCollider;
        clone.layerMask = this.layerMask;
        clone.isFreeze = this.isFreeze;

        if (this.sceneObjectToScreenProportion) {
            clone.sceneObjectToScreenProportion = {
                x: this.sceneObjectToScreenProportion.x,
                y: this.sceneObjectToScreenProportion.y,
            };
        }
        
        if (this.temporal.vectorUsedForChanges) {
            clone.temporal.vectorUsedForChanges = Vector.clone(this.temporal.vectorUsedForChanges);
        }
        
        return clone;
    }
}