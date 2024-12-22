import { Element, ElementData } from './element';
import { CompElement } from './comp';
import { ImageElement } from './image';
import { SolidElement } from './solid';
import { TextElement } from './text';
import { ShapeContainerElement } from './shape';

const ELEMENT_TYPE = {
    COMP: 0,
    SOLID: 1,
    IMAGE: 2,
    NULL: 3,
    SHAPE: 4,
    TEXT: 5,
    VIDEO: 9,
    CAMERA: 13
};

export class ElementFactory {
    static create(data: ElementData): Element | null {
        let elem = null;
        switch (data.ty) {
            case ELEMENT_TYPE.COMP:
                elem = new CompElement(data);
                break;
            case ELEMENT_TYPE.SOLID:
                elem = new SolidElement(data);
                break;
            case ELEMENT_TYPE.IMAGE:
                elem = new ImageElement(data);
                break;
            case ELEMENT_TYPE.SHAPE:
                elem = new ShapeContainerElement(data);
                break;
            case ELEMENT_TYPE.TEXT:
                elem = new TextElement(data);
                break;
            case ELEMENT_TYPE.CAMERA:
                break;
            case ELEMENT_TYPE.NULL:
                elem = new CompElement(data);
                break;
            case ELEMENT_TYPE.VIDEO:
                elem = new Element(data);
                break;
            default:
                break;
        }
        return elem;
    }
}
