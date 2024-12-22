// import 'core-js/modules/es7.object.values';
import { GameObject } from '../scene-objects/game-object';
import { mapFromJsonToColliders } from './json-collider-manager';
import { mapFromJsonToRigidBodyComponent } from './json-rigidbody-manager';
import { mapFromJsonToTextComponent } from './json-text-manager';
import { mapFromJsonToSpriteComponent } from './json-sprite-manager';
import { mapFromJsonToTransformComponent } from './json-transform-manager';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';
import { mapFromJsonToTween } from './json-tween-manager';
import { getKeywordGraphicComponent, mapFromJsonToGraphicsComponent } from './json-graphics-manager';
import { mapFromJsonToParticleComponentManager } from './json-particle-manager';
import { BehaviourTypeList, ParticleConfigJson } from '../scene-objects/game-properties';
import { mapFromJsonToAfterEffectAnimation } from './json-after-effect-animation-manager';
import { mapFromJsonToAnimatedSpriteComponent } from './json-animation-sprite-manager';
import { mapFromJsonToSoundComponent } from './json-sound-manager';

export const mapFromJsonObjToGameObject = (
    gameObjectName: string,
    gameObjectJSON: any,
    behaviourTypeList: BehaviourTypeList[],
    particlesConfigJson: ParticleConfigJson[]
): GameObject => {
    const componentList: any[] = [];
    const spriteComponent = gameObjectJSON['sprite'];
    const textComponent = gameObjectJSON['textComponent'];
    const rigidbody = gameObjectJSON['rigidbody'];
    const colliders = gameObjectJSON['colliders'];
    const tweenList = gameObjectJSON['tweenList'];
    const particleList = gameObjectJSON['particleList'];
    const animationAfterEffect = gameObjectJSON['afterEffectAnimation'];
    const spriteAnimation = gameObjectJSON['spriteAnimation'];
    const soundComponent = gameObjectJSON['soundComponent'];
    const keyGraphics = getKeywordGraphicComponent(gameObjectJSON);
    const graphicComponent = keyGraphics ? gameObjectJSON[keyGraphics] : undefined;

    gameObjectJSON['name'] = gameObjectName;
    gameObjectJSON['transform'] = mapFromJsonToTransformComponent(gameObjectJSON['transform']);
    componentList.push(gameObjectJSON['transform']);

    if (spriteComponent) {
        componentList.push(mapFromJsonToSpriteComponent(spriteComponent));
    }
    if (textComponent) {
        componentList.push(mapFromJsonToTextComponent(textComponent));
    }
    if (graphicComponent) {
        componentList.push(mapFromJsonToGraphicsComponent(graphicComponent, keyGraphics!));
    }
    if (rigidbody) {
        componentList.push(mapFromJsonToRigidBodyComponent(rigidbody));
    }
    if (colliders) {
        componentList.push(mapFromJsonToColliders(colliders));
    }
    if (tweenList) {
        componentList.push(mapFromJsonToTween(tweenList));
    }
    if (particleList) {
        componentList.push(mapFromJsonToParticleComponentManager(particleList, particlesConfigJson));
    }
    if (animationAfterEffect) {
        componentList.push(mapFromJsonToAfterEffectAnimation(animationAfterEffect));
    }
    if (spriteAnimation) {
        componentList.push(mapFromJsonToAnimatedSpriteComponent(spriteAnimation));
    }
    if (soundComponent) {
        componentList.push(mapFromJsonToSoundComponent(soundComponent));
    }

    gameObjectJSON['componentList'] = componentList;

    delete gameObjectJSON['sprite'];
    delete gameObjectJSON['rigidbody'];
    delete gameObjectJSON['colliders'];
    delete gameObjectJSON['tweenList'];
    delete gameObjectJSON['particleList'];
    delete gameObjectJSON['afterEffectAnimation'];
    delete gameObjectJSON['spriteAnimation'];
    delete gameObjectJSON['soundComponent'];
    if (keyGraphics) {
        delete gameObjectJSON[keyGraphics];
    }

    const gameObject = Injector.resolve<GameObject>(GameObject);
    propiertiesInjector(gameObject, gameObjectJSON);
    gameObject.initialize(gameObjectJSON['behaviourComponentList'], behaviourTypeList);

    delete (<any>gameObject)['behaviourComponentList'];

    return gameObject;
};
