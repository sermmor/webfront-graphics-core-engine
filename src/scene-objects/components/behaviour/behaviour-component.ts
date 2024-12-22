import { GameObject } from "../../game-object";
import { Component } from "../component";
import { CollidedWith } from "../../../physics/collision-manager";

export interface BehaviourComponentInterface {
    gameObject?: GameObject;
    onLoad?: () => void;
    onAwake?: () => void;
    onStart?: () => void;
    onEnable?: () => void;
    onDisable?: () => void;
    onDestroy?: () => void;
    update?: (deltaTime: number) => void;
    onEndingCircleOfLife?: () => void;
    onCollisionEnter?: (collidedWith: CollidedWith) => void;
    onCollisionStay?: (collidedWith: CollidedWith) => void;
    onCollisionExit?: (collidedWith: CollidedWith) => void;
}

// Class only for link relation between BehaviourComponentInterface and Component.
export class BehaviourComponent extends Component implements BehaviourComponentInterface {}

export const parseBehaviour = (b: BehaviourComponent): BehaviourComponentInterface => <BehaviourComponentInterface> b;
