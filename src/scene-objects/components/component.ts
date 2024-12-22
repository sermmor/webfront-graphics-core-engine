import { BaseTexture } from "../../wrappers/base-texture";
import { Engine } from "matter-js";
import { GameObject } from "../game-object";
import { Container } from "../../wrappers/container";

export enum TransformAction { MOVE = "move", SCALE = "scale", ROTATE = "rotate"};

export const isImplementedIBuilderComponent = (obj: any) => obj && obj.initialize && obj.load && obj.buildAndPlace;
export const isImplementedIViewableComponent = (obj: any) => obj && obj.setOpacity;
export const isImplementedITransformableComponent = (obj: any) => obj && obj.setPosition && obj.setScale && obj.setRotation;
export const isImplementedIComponentLifeCompleted = (obj: any) => obj && obj.destroy && obj.clone;
export const isImplementedITypeableComponent = (obj: any) => obj && obj.isMyTypeComponent && obj.isMyTypeComponentByStringType && obj.getComponent && obj.getComponentByStringType && obj.getAllComponents && obj.setEnable;
export const isImplementedIPhysicManagerComponent = (obj: any) => obj && obj.addPhysicsEngine;
export const isImplementedIParcialLifeCircleComponent = (obj: any) => obj && obj.forceToEndCircleOfLife;

export interface IBuilderComponent {
    initialize: () => void;
    load: () => Promise<Component>;
    buildAndPlace: (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ) => Container;
}

export interface IViewableComponent {
    setOpacity: (newAlpha: number) => void;
}

export interface IPhysicsManagerComponent {
    addPhysicsEngine: (physicsEngine: Engine) => void;
}

export interface ITypeableComponent {
    isMyTypeComponent: (typeComponent: any) => boolean;
    isMyTypeComponentByStringType: (nameComponent: string) => boolean;
    getComponentByStringType: (nameComponent: string) => Component | undefined;
    getComponent: (nameComponent: any) => Component | undefined;
    getAllComponents: (nameComponent: string) => Component[] | undefined;
    setEnable: (isEnable: boolean) => void;
}

export interface ITransformableComponent {
    setPosition: (newPositionX: number, newPositionY: number) => void;
    setScale: (newScaleX: number, newScaleY: number) => void;
    setRotation: (newRotation: number) => void;
}

export interface IParcialLifeCircleComponent {
    forceToEndCircleOfLife: () => void;
}

export interface IComponentLifeCompleted {
    destroy: () => BaseTexture | undefined;
    clone: () => Component;
}

export abstract class Component {
}
