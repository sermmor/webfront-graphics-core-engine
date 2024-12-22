import { GraphicComponent } from '../scene-objects/components/graphics/graphic-component';
import { Color } from '../wrappers/color';
import { propiertiesInjector, Injector } from '../injection/dependency-injectors';
import { RectangleComponent } from '../scene-objects/components/graphics/rectangle-component';
import { RoundedRectangleComponent } from '../scene-objects/components/graphics/rounded-rectangle-component';
import { CircleComponent } from '../scene-objects/components/graphics/circle-component';
import { FreestyleGraphicComponent } from '../scene-objects/components/graphics/freestyle-graphics-component';

export const getKeywordGraphicComponent = (gameObjectJSON: any): string | undefined => {
    if (gameObjectJSON['RectangleComponent']) {
        return 'RectangleComponent';
    }
    if (gameObjectJSON['RoundedRectangleComponent']) {
        return 'RoundedRectangleComponent';
    }
    if (gameObjectJSON['CircleComponent']) {
        return 'CircleComponent';
    }
    if (gameObjectJSON['FreestyleGraphicComponent']) {
        return 'FreestyleGraphicComponent';
    }
    return undefined;
};

const getTypeByKeyword = (keyGraphics: string): any => {
    if (keyGraphics === 'RectangleComponent') {
        return RectangleComponent;
    }
    if (keyGraphics === 'RoundedRectangleComponent') {
        return RoundedRectangleComponent;
    }
    if (keyGraphics === 'CircleComponent') {
        return CircleComponent;
    }
    if (keyGraphics === 'FreestyleGraphicComponent') {
        return FreestyleGraphicComponent;
    }
    return undefined;
};

export const mapFromJsonToGraphicsComponent = (gameObjectJSON: any, keyGraphics: string): GraphicComponent => {
    if (gameObjectJSON['borderColor']) {
        gameObjectJSON['borderColor'] = new Color(gameObjectJSON['borderColor']);
    }
    if (gameObjectJSON['backgroundColor']) {
        gameObjectJSON['backgroundColor'] = new Color(gameObjectJSON['backgroundColor']);
    }

    const graphics = Injector.resolve<GraphicComponent>(getTypeByKeyword(keyGraphics));
    propiertiesInjector(graphics, gameObjectJSON);

    return graphics;
};
