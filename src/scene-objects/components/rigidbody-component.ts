import { ColliderComponent } from "./colliders/collider-component";
import { Component, IComponentLifeCompleted, ITypeableComponent } from "./component";
import { BaseTexture } from "../../wrappers/base-texture";
import { TransformComponent } from "./transform-component";

export class RigidbodyComponent extends Component implements IComponentLifeCompleted, ITypeableComponent {
    public static nameComponent = "RigidbodyComponent";
    public type: "Dynamic" | "Kinematic" | "Static";
    public mass: number;

    buildAndPlace(transform: TransformComponent, colliders: ColliderComponent[]) {
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === RigidbodyComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === RigidbodyComponent.nameComponent;
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

    setEnable = (isEnable: boolean): void => {} // Rigidbody is always enabled.

    destroy = (): BaseTexture | undefined => {
        return undefined;
    }

    clone(): Component {
        const rigidbodyComponent = new RigidbodyComponent();

        rigidbodyComponent.type = this.type;
        rigidbodyComponent.mass = this.mass;

        return rigidbodyComponent;
    }
}