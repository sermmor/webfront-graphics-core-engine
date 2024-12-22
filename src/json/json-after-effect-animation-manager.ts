import { AnimationAfterEffectsComponent } from '../scene-objects/components/after-effects/animation-after-effects-component';
import { Point } from '../wrappers/point';
import { Color } from '../wrappers/color';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToAfterEffectAnimation = (animationAfterEffectDataJson: any): AnimationAfterEffectsComponent => {
    animationAfterEffectDataJson['color'] = new Color(animationAfterEffectDataJson['color']);

    const animation = Injector.resolve<AnimationAfterEffectsComponent>(AnimationAfterEffectsComponent);
    propiertiesInjector(animation, animationAfterEffectDataJson);

    return animation;
};
