import { Engine, Events, IEventCollision } from "matter-js";
import { GameObject } from "../scene-objects/game-object";
import { BehaviourComponent, parseBehaviour, BehaviourComponentInterface } from "../scene-objects/components/behaviour/behaviour-component";
import { ColliderComponent } from "../scene-objects/components/colliders/collider-component";
import { GameObjectManager } from "../scene-objects/game-object-manager";

export interface CollidedWith {
    gameObject: GameObject;
    colliderAffected: ColliderComponent;
    colliderWith: ColliderComponent;
}

export class CollisionManager {
    constructor(private gameObjectManager: GameObjectManager, private physicsEngine: Engine) {
        const behaviours = this.gameObjectManager.findAllBehaviorComponentInAllGameObject();
        const gameObjectsWithColliders = this.gameObjectManager.findAllWithColliderComponent();
        if (behaviours) {
            this.buildCollisionsEvents(behaviours, gameObjectsWithColliders);
        }
    }

    private buildCollisionsEvents = (behaviours: BehaviourComponent[], gameObjectsWithColliders: GameObject[]) => {
        const allBehaviourOnCollisionEnter = behaviours.filter(b => !!parseBehaviour(b).onCollisionEnter);
        const allBehaviourOnCollisionStay = behaviours.filter(b => !!parseBehaviour(b).onCollisionStay);
        const allBehaviourOnCollisionExit = behaviours.filter(b => !!parseBehaviour(b).onCollisionExit);
        if (allBehaviourOnCollisionEnter.length > 0) {
            Events.on(this.physicsEngine, 'collisionStart', event => this.buildCollisionEventType(
                allBehaviourOnCollisionEnter,
                gameObjectsWithColliders,
                event,
                (behaviorA: BehaviourComponentInterface, collidedWithB: CollidedWith) => parseBehaviour(behaviorA).onCollisionEnter!(collidedWithB),
                (behaviorB: BehaviourComponentInterface, collidedWithA: CollidedWith) => parseBehaviour(behaviorB).onCollisionEnter!(collidedWithA)
            ));
        }
        if (allBehaviourOnCollisionStay.length > 0) {
            Events.on(this.physicsEngine, 'collisionActive', event => this.buildCollisionEventType(
                allBehaviourOnCollisionStay,
                gameObjectsWithColliders,
                event,
                (behaviorA: BehaviourComponentInterface, collidedWithB: CollidedWith) => parseBehaviour(behaviorA).onCollisionStay!(collidedWithB),
                (behaviorB: BehaviourComponentInterface, collidedWithA: CollidedWith) => parseBehaviour(behaviorB).onCollisionStay!(collidedWithA)
            ));
        }
        if (allBehaviourOnCollisionExit.length > 0) {
            Events.on(this.physicsEngine, 'collisionEnd', event => this.buildCollisionEventType(
                allBehaviourOnCollisionExit,
                gameObjectsWithColliders,
                event,
                (behaviorA: BehaviourComponentInterface, collidedWithB: CollidedWith) => parseBehaviour(behaviorA).onCollisionExit!(collidedWithB),
                (behaviorB: BehaviourComponentInterface, collidedWithA: CollidedWith) => parseBehaviour(behaviorB).onCollisionExit!(collidedWithA)
            ));
        }
    }

    private buildCollisionEventType = (
        allBehaviourOnCollisionType: BehaviourComponent[],
        gameObjectsWithColliders: GameObject[],
        event: IEventCollision<Engine>,
        onBehaviourASend: (behaviorA: BehaviourComponentInterface, collidedWithB: CollidedWith) => void,
        onBehaviourBSend: (behaviorB: BehaviourComponentInterface, collidedWithA: CollidedWith) => void
    ) => {
        const gameObjectA = this.gameObjectManager.findGameObjectByBody(event.pairs[0].bodyA, gameObjectsWithColliders);
        const colliderA = gameObjectA.collidersComponentManager.findColliderByBody(event.pairs[0].bodyA);
        const gameObjectB = this.gameObjectManager.findGameObjectByBody(event.pairs[0].bodyB, gameObjectsWithColliders);
        const colliderB = gameObjectB.collidersComponentManager.findColliderByBody(event.pairs[0].bodyB);
        if (gameObjectA && gameObjectB) {
            const behaviorA = allBehaviourOnCollisionType.find(behavior => parseBehaviour(behavior).gameObject === gameObjectA);
            const behaviorB = allBehaviourOnCollisionType.find(behavior => parseBehaviour(behavior).gameObject === gameObjectB);
            if (behaviorA) {
                onBehaviourASend(behaviorA, { gameObject: gameObjectB, colliderAffected: colliderA, colliderWith: colliderB });
            }
            if (behaviorB) {
                onBehaviourBSend(behaviorB, { gameObject: gameObjectA, colliderAffected: colliderB, colliderWith: colliderA});
            }
        }
    }
}
