import { SpriteComponent } from '../scene-objects/components/sprite-component';
import { Color } from '../wrappers/color';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToSpriteComponent = (gameObjectJSON: any): SpriteComponent => {
    gameObjectJSON['color'] = new Color(gameObjectJSON['color']);

    const sprite = Injector.resolve<SpriteComponent>(SpriteComponent);
    propiertiesInjector(sprite, gameObjectJSON);

    return sprite;
};
