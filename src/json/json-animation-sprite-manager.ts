import { Injector, propiertiesInjector } from "../injection/dependency-injectors";
import { AnimationSpriteComponent } from "../scene-objects/components/animation-sprites/animation-sprite-component";
import { AnimationSpriteManagerComponent } from "../scene-objects/components/animation-sprites/animation-sprite-manager-component";
import { Color } from "../wrappers/color";

export const mapFromJsonToAnimatedSpriteComponent = (gameObjectJSON: any): AnimationSpriteManagerComponent => {
    let current: AnimationSpriteComponent;
    const animatedSprite: AnimationSpriteComponent[] = [];

    gameObjectJSON.forEach((elementJSON: any) => {
        elementJSON['color'] = new Color(elementJSON['color']);
        current = Injector.resolve<AnimationSpriteComponent>(AnimationSpriteComponent);
        propiertiesInjector(current, elementJSON);
        animatedSprite.push(current);
    });

    return new AnimationSpriteManagerComponent(animatedSprite);
};
