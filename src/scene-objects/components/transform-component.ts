import { Point } from "../../wrappers/point";
import { GameObject } from "../game-object";
import { Container } from "../../wrappers/container";
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent } from "./component";
import { BaseTexture } from "../../wrappers/base-texture";

export class TransformComponent extends Component implements IComponentLifeCompleted, ITransformableComponent, ITypeableComponent {
    public static nameComponent = "TransformComponent";
    private container: Container;
    private children: GameObject[] = [];
    private parent?: GameObject;
    
    public gameObject: GameObject;
    public position: Point;
    public scale: Point;
    public rotation: number; // IN RADIANS!!!
    public z: number;

    constructor() {
        super();
        if (!this.rotation) {
            this.rotation = 0;
        }
    }

    get numberOfChildren(): number { return this.children ? this.children.length : 0; }
    get allChildren(): GameObject[] { return this.children; }
    get parentGO(): GameObject { return this.parent!; }
    get gameObjectContainer(): Container { return this.container; }
    set gameObjectContainer(newContainer: Container) { this.container = newContainer; }

    addChild = (child: GameObject, thisGO?: GameObject) => {
        this.children.push(child);
        if (thisGO) {
            child.transform.parent = thisGO;
        } else {
            child.transform.parent = this.gameObject;
        }
    }

    build = (gameObject: GameObject, container: Container | undefined) => {
        this.gameObject = gameObject;
        this.container = container!;
    }

    addToTheApplication = (sceneContainer: Container) => {
        if (this.container) {
            if (this.parent || this.children.length > 0) {
                this.addToTheApplicationInHierarchy(sceneContainer);
            } else {
                sceneContainer.addChild(this.container);
            }
        }
    }

    private addToTheApplicationInHierarchy = (sceneContainer: Container) => {
        if (this.parent && this.parent.transform.container) {
            this.parent.transform.container.addChild(this.container);
        }
        if (this.children.length > 0) {
            this.children.forEach(child => {
                if (!child.transform.parent) {
                    child.transform.parent = this.gameObject;
                }
                if (child.transform.container) {
                    this.container.addChild(child.transform.container);
                }
            });
        }
        if (!this.parent) {
            sceneContainer.addChild(this.container);
        }
    }

    findChild(hierarchyPath: string): GameObject[] {
        const pathSeparator = "/";
        const splitedPath: string[] = hierarchyPath.split(pathSeparator);
        const childrenName = splitedPath[0];
        let searched = this.children!.filter(go => go.name === childrenName);

        if (splitedPath.length > 1) {
            const childrenPath = splitedPath.slice(1, splitedPath.length).join(pathSeparator);
            let childSearched: GameObject[] = [];
            searched.forEach(go => childSearched = childSearched.concat(this.findChild(childrenPath)));
            searched = childSearched;
        }

        return searched;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === TransformComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === TransformComponent.nameComponent;
    }

    getComponent = (nameComponent: any): Component | undefined => {
        return this;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        return this;
    }
    
    getAllComponents = (nameComponent: string): Component[] | undefined => {
        return [this];
    }

    setEnable = (isEnable: boolean): void => {} // Transform always is enabled.
    
    setPosition = (newPositionX: number, newPositionY: number) => {
        this.position.x = newPositionX;
        this.position.y = newPositionY;
    }

    setScale = (newScaleX: number, newScaleY: number) => {
        this.scale.x = newScaleX;
        this.scale.y = newScaleY;
    }

    setRotation = (newRotation: number) => {
        this.rotation = newRotation;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.children) {
            this.children.forEach(go => go.destroy());
            this.children = [];
        }
        return undefined;
    }
    
    clone = (): Component => {
        const newTransform = new TransformComponent();
        
        newTransform.parent = this.parent;
        newTransform.position = this.position;
        newTransform.scale = this.scale;
        newTransform.z = this.z;
        
        newTransform.container = this.container; // TODO: FIX REFERENCE IN GameObject.clone()
        newTransform.gameObject = this.gameObject;

        if (this.children) {
            newTransform.children = this.children.map(go => go.clone());
        }

        return newTransform;
    }
}