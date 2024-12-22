// import { AfterEffects } from 'pixi-after-effects';
import { AfterEffects } from '../../utils/pixi-after-effects';
import { AnimationAE } from './animation-AE';
import { Point } from '../../wrappers/point';

export type AnimationResolveCallback = (value?: void | PromiseLike<void> | undefined) => void;

export type AnimationEffect = (animation: AnimationInfo) => void;

export class AnimationInfo {
    animationPath: string;
    enableEffects: boolean;
    isLoopAnimation?: boolean;
    animation?: AnimationAE;
    startAnimationOnLoader?: boolean;
    loaded?: boolean;
    jsonData?: any;
    animationContainer?: AfterEffects;
    isDeluxeGame?: boolean;
    positionOffset?: Point;
    z: number;
}
