import { RigidbodyComponent } from '../scene-objects/components/rigidbody-component';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToRigidBodyComponent = (gameObjectJSON: any): RigidbodyComponent => {
    const rigidbody = Injector.resolve<RigidbodyComponent>(RigidbodyComponent);
    propiertiesInjector(rigidbody, gameObjectJSON);
    return rigidbody;
};