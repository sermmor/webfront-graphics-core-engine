// import 'core-js/modules/es7.object.values';
import { TweenComponentManager } from '../scene-objects/components/tweens/tween-manager';
import { TweenComponent } from '../scene-objects/components/tweens/tween-component';
import { BezierTweenComponent } from '../scene-objects/components/tweens/bezier-tween-component';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';
import { Point } from '../wrappers/point';
import { BezierCubicTweenComponent } from '../scene-objects/components/tweens/bezier-cubic-tween-component';
import { LagrangeTweenComponent } from '../scene-objects/components/tweens/lagrange-tween-component';
import { AkimaCubicSplineTweenComponent } from '../scene-objects/components/tweens/akima-cubic-spline-tween-component';

const buildInitialAndEndPoints = (gameObjectJSON: any) => {
    gameObjectJSON['pointInitialState'] = new Point(
        gameObjectJSON['pointInitialState']['x'],
        gameObjectJSON['pointInitialState']['y'],
    );
    gameObjectJSON['pointEndingState'] = new Point(
        gameObjectJSON['pointEndingState']['x'],
        gameObjectJSON['pointEndingState']['y'],
    );
};

const buildTwoPoints = (gameObjectJSON: any) => {
    gameObjectJSON['p1'] = new Point(
        gameObjectJSON['p1']['x'],
        gameObjectJSON['p1']['y'],
    );
    gameObjectJSON['p2'] = new Point(
        gameObjectJSON['p2']['x'],
        gameObjectJSON['p2']['y'],
    );
};

const buildPointList = (gameObjectJSON: any) => {
    gameObjectJSON['points'] = [];
    gameObjectJSON['point-list'].forEach((pointJSON: any) => {
        gameObjectJSON['points'].push(new Point(
            pointJSON['x'],
            pointJSON['y'],
        ));
    });
    delete gameObjectJSON['point-list'];
};

const mapFromJsonToTweenWithListPoints = (gameObjectJSON: any, typeTween: any): TweenComponent => {
    buildInitialAndEndPoints(gameObjectJSON);
    buildPointList(gameObjectJSON);
    const tween = Injector.resolve<TweenComponent>(typeTween);
    propiertiesInjector(tween, gameObjectJSON);
    return tween;
};

const mapFromJsonToTweenWithTwoPoints = (gameObjectJSON: any, typeTween: any): TweenComponent => {
    buildInitialAndEndPoints(gameObjectJSON);
    buildTwoPoints(gameObjectJSON);
    const tween = Injector.resolve<TweenComponent>(typeTween);
    propiertiesInjector(tween, gameObjectJSON);
    return tween;
};

export const mapFromJsonToTween = (gameObjectJSON: any): TweenComponentManager => {
    const configuration = {
        isInParallelExecutionTweenMode: true,
    };
    const tweens: TweenComponent[] = [];

    gameObjectJSON.forEach((elementJSON: any) => {
        // Object.keys(elementJSON).forEach((tweenJSONName: string) => {
        for (const tweenJSONName in elementJSON) {
            if ('bezier' === tweenJSONName) {
                tweens.push(mapFromJsonToTweenWithTwoPoints(elementJSON['bezier'], BezierTweenComponent));
            } else if ('bezier-cubic' === tweenJSONName) {
                tweens.push(mapFromJsonToTweenWithTwoPoints(elementJSON['bezier-cubic'], BezierCubicTweenComponent));
            } else if ('lagrange' === tweenJSONName) {
                tweens.push(mapFromJsonToTweenWithListPoints(elementJSON['lagrange'], LagrangeTweenComponent));
            } else if ('akima-cubic-spline' === tweenJSONName) {
                tweens.push(mapFromJsonToTweenWithListPoints(elementJSON['akima-cubic-spline'], AkimaCubicSplineTweenComponent));
            } else if ('tween-configuration' === tweenJSONName) {
                configuration.isInParallelExecutionTweenMode = elementJSON['tween-configuration']['execution-tween-mode'] !== 'sequence';
            }
        }
        // });
    });
    return new TweenComponentManager(tweens, configuration.isInParallelExecutionTweenMode);
};
