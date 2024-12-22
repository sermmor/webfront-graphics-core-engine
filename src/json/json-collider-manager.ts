import { ColliderComponent } from '../scene-objects/components/colliders/collider-component';
import { CircleColliderComponent } from '../scene-objects/components/colliders/circle-collider-component';
import { RectangleColliderComponent } from '../scene-objects/components/colliders/rectangle-collider-component';
import { ColliderComponentManager } from '../scene-objects/components/colliders/collider-component-manager';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

const mapFromJsonToColliderComponent = (gameObjectJSON: any, typeCollider: any): ColliderComponent => {
    const collider = Injector.resolve<ColliderComponent>(typeCollider);
    propiertiesInjector(collider, gameObjectJSON);
    return collider;
};

export const mapFromJsonToColliders = (gameObjectJSON: any): ColliderComponentManager => {
    const colliders: ColliderComponent[] = [];
    gameObjectJSON.forEach((elementJSON: any) => {
        if (elementJSON['circleCollider']) {
            colliders.push(mapFromJsonToColliderComponent(elementJSON['circleCollider'], CircleColliderComponent));
        }
        if (elementJSON['rectangleCollider']) {
            colliders.push(mapFromJsonToColliderComponent(elementJSON['rectangleCollider'], RectangleColliderComponent));
        }
    });
    return new ColliderComponentManager(colliders);
};
