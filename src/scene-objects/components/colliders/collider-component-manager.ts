import { Body, Engine } from "matter-js";
import { GameObject } from "../../game-object";
import { ColliderComponent } from "./collider-component";
import { Container } from "../../../wrappers/container";
import { CircleColliderComponent } from "./circle-collider-component";
import { RectangleColliderComponent } from "./rectangle-collider-component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { RigidbodyComponent } from "../rigidbody-component";
import { ITransformableComponent, Component, IComponentLifeCompleted, ITypeableComponent, IPhysicsManagerComponent, IParcialLifeCircleComponent } from "../component";

export class ColliderComponentManager extends Component implements ITransformableComponent, IComponentLifeCompleted,
        ITypeableComponent, IPhysicsManagerComponent, IParcialLifeCircleComponent {
    private static typeNameOfColliders: string[] = [ CircleColliderComponent.nameComponent, RectangleColliderComponent.nameComponent ];
    private static typeOfColliders: any[] = [ CircleColliderComponent, RectangleColliderComponent ];

    private paramsToRunPhysics: {
        gameObject: GameObject,
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    }
    private _allBodies: Body[];

    private temporal = {
        typeCollider: <any> ColliderComponent,
        body: <Body | undefined> undefined,
        label: "",
        transformToChange: { x: 0, y: 0 },
        isFreeze: false,
        rigidbody: <RigidbodyComponent | undefined> undefined,
    }

    get colliders() { return this._colliders; }
    get allBodies() {
        if (!this._allBodies) {
            this._allBodies = this._colliders.map(this.getBodyCollider);
        }
        return this._allBodies;
    }
    private getBodyCollider = (collider: ColliderComponent): Body => collider.body;

    constructor(private _colliders: ColliderComponent[]) {
        super();
        // const typesToAddWithRepetitions = _colliders.map(c => c.getNameComponent()).filter(type => !ColliderComponentManager.typeNameOfColliders.includes(type));
        // if (typesToAddWithRepetitions.length > 0) {
        //     const typesToAdd: string[] = [];
        //     typesToAddWithRepetitions.forEach((type) => {
        //         if (!typesToAdd.includes(type)) typesToAdd.push(type);
        //     })
        //     ColliderComponentManager.typeNameOfColliders = ColliderComponentManager.typeNameOfColliders.concat(typesToAdd);
        // }
    }

    buildColliders = (
        gameObject: GameObject,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ) => {
        this.paramsToRunPhysics = { gameObject, size, containerDebug };
        this._colliders.forEach(collider => {
            collider.buildAndPlaceCollider(gameObject, sceneObjectToScreenProportion, <RigidbodyComponent> gameObject.getComponent(RigidbodyComponent)!);
            collider.runPhysics(gameObject.transform, gameObject, size, containerDebug);
        });
    }

    addPhysicsEngine(physicsEngine: Engine) {
        this._colliders.forEach(c => c.physicsEngine = physicsEngine);
    }

    getComponentByStringType = (nameComponent: string): ColliderComponent | undefined => {
        this.temporal.typeCollider = this.getTypeColliderByName(nameComponent);
        return this._colliders.find(this.isComponentByType);
    }
    
    getComponent = (typeComponent: any): ColliderComponent | undefined => {
        const nameComponent = typeComponent.nameComponent;
        this.temporal.typeCollider = this.getTypeColliderByName(nameComponent);
        return this._colliders.find(this.isComponentByType);
    }

    getAllComponents = (typeComponent: any): ColliderComponent[] => {
        const nameComponent = typeComponent.nameComponent;
        this.temporal.typeCollider = this.getTypeColliderByName(nameComponent);
        return this._colliders.filter(this.isComponentByType);
    }

    private isComponentByType = (currentCollider: ColliderComponent): boolean => currentCollider instanceof this.temporal.typeCollider;
    private getTypeColliderByName = (nameComponent: string): any => nameComponent === CircleColliderComponent.nameComponent ? CircleColliderComponent : RectangleColliderComponent;

    isMyTypeComponent = (typeComponent: any): boolean => ColliderComponentManager.typeOfColliders.includes(typeComponent);

    isMyTypeComponentByStringType = (nameComponent: string): boolean => ColliderComponentManager.typeNameOfColliders.includes(nameComponent);
    
    setEnable = (isEnable: boolean) => {
        this.setFreezeAllColliders(!isEnable);
    }

    hasBody = (body: Body): boolean => {
        this.temporal.body = body;
        return !!this._allBodies.find(this.isEqualBody);
    }
    private isEqualBody = (b: Body): boolean => b === this.temporal.body;

    findColliderByBody = (body: Body): ColliderComponent => {
        this.temporal.body = body;
        return this._colliders.find(this.isEqualBodyOfCollider)!;
    }
    private isEqualBodyOfCollider = (c: ColliderComponent): boolean => c.body === this.temporal.body;

    findColliderByLabel = (label: string): ColliderComponent => {
        this.temporal.label = label;
        return this._colliders.find(this.isEqualLabelOfCollider)!;
    }
    private isEqualLabelOfCollider = (c: ColliderComponent) => c.label === this.temporal.label;

    setPosition(newPositionX: number, newPositionY: number) {
        this.temporal.transformToChange.x = newPositionX;
        this.temporal.transformToChange.y = newPositionY;
        this._colliders.forEach(this.setPositionCollider);
    }
    private setPositionCollider = (c: ColliderComponent) => c.setPosition(this.temporal.transformToChange.x, this.temporal.transformToChange.y);

    setScale(newScaleX: number, newScaleY: number) {
        this.temporal.transformToChange.x = newScaleX;
        this.temporal.transformToChange.y = newScaleY;
        this._colliders.forEach(this.setScaleCollider);
    }
    private setScaleCollider = (c: ColliderComponent) => c.setScale(this.temporal.transformToChange.x, this.temporal.transformToChange.y);

    setRotation(newRotation: number) {
        this.temporal.transformToChange.x = newRotation;
        this._colliders.forEach(this.setRotationCollider);
    }
    private setRotationCollider = (c: ColliderComponent) => c.setRotation(this.temporal.transformToChange.x);

    setFreezeAllColliders = (isFreeze: boolean) => {
        this.temporal.isFreeze = isFreeze;
        this._colliders.forEach(this.setFreezerCollider);
    }
    private setFreezerCollider = (c: ColliderComponent) => c.setFreeze(this.temporal.isFreeze);

    addRigidBody = (rigidbody?: RigidbodyComponent) => {
        this.temporal.rigidbody = rigidbody;
        this._colliders.forEach(this.addRigidBoxToCollider);
    }
    private addRigidBoxToCollider = (c: ColliderComponent) => c.rigidbody = this.temporal.rigidbody!;

    forceToRunPhysicsAllColliders = () => {
        if (this.paramsToRunPhysics) {
            this._colliders.forEach(this.forceToRunPhysicsCollider);
        }
    }
    private forceToRunPhysicsCollider = (c: ColliderComponent) => c.runPhysics(
        this.paramsToRunPhysics.gameObject.transform,
        this.paramsToRunPhysics.gameObject,
        this.paramsToRunPhysics.size,
        this.paramsToRunPhysics.containerDebug
    );

    forceToEndCircleOfLife = () => this.setFreezeAllColliders(true);

    destroy = (): BaseTexture | undefined => {
        this._colliders.forEach(this.destroyCollider);
        this._colliders = [];
        return undefined;
    }
    private destroyCollider = (c: ColliderComponent) => c.destroy();

    clone = (): Component => new ColliderComponentManager(this._colliders.map(this.cloneCollider));
    private cloneCollider = (c: ColliderComponent): ColliderComponent => <ColliderComponent> c.clone();
}
