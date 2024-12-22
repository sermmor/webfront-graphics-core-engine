import { TransformComponent } from '../scene-objects/components/transform-component';
import { Point } from '../wrappers/point';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToTransformComponent = (gameObjectJSON: any): TransformComponent => {
    gameObjectJSON['z'] = gameObjectJSON['position']['z'];
    gameObjectJSON['position'] = new Point(gameObjectJSON['position']['x'], gameObjectJSON['position']['y']);
    gameObjectJSON['scale'] = new Point(gameObjectJSON['scale']['x'], gameObjectJSON['scale']['y']);

    const transform = Injector.resolve<TransformComponent>(TransformComponent);
    propiertiesInjector(transform, gameObjectJSON);

    return transform;
};
