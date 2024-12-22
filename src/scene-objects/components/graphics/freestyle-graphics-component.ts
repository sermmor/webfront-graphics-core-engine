import { GraphicComponent } from "./graphic-component";
import { Component } from "../component";
import { Graphics } from "../../../wrappers/graphics";
import { StrokeLine, isAnArc, Arc } from "./stroke-types";
import { CoreConstants } from "../../../wrappers/static/core-constants";
import { Container } from "../../../wrappers/container";

export class FreestyleGraphicComponent extends GraphicComponent {
    public static nameComponent = "FreestyleGraphicComponent";
    protected allLines: StrokeLine[];
    protected temporal = {
        graphic: <undefined | Graphics> undefined,
        sceneObjectToScreenProportion: <undefined | { x: number; y: number; }> undefined,
        isVisible: true,
        parent: <undefined | Container> undefined,
    };
    
    protected paintGraphic = (graphic: Graphics, sceneObjectToScreenProportion: { x: number; y: number; }): Graphics => {
        // It begins to draw from point (0, 0).
        graphic.x = 0;
        graphic.y = 0;
        this.temporal.graphic = graphic;
        this.temporal.sceneObjectToScreenProportion = sceneObjectToScreenProportion;

        this.allLines.forEach(this.paintStroke);

        this.temporal.graphic = undefined;
        this.temporal.sceneObjectToScreenProportion = undefined;
        return graphic;
    }

    protected paintStroke = (stroke: StrokeLine) => {
        if (isAnArc(stroke)) {
            this.temporal.graphic!.arc(
                this.temporal.sceneObjectToScreenProportion!.x * stroke.xToDraw,
                this.temporal.sceneObjectToScreenProportion!.y * stroke.yToDraw,
                this.temporal.sceneObjectToScreenProportion!.x * (<Arc> stroke).radius,
                (<Arc> stroke).startAngle * CoreConstants.getInstance().DEG_TO_RAD,
                (<Arc> stroke).endAngle * CoreConstants.getInstance().DEG_TO_RAD,
                (<Arc> stroke).anticlockwise
            );
        } else {
            this.temporal.graphic!.lineTo(
                this.temporal.sceneObjectToScreenProportion!.x * stroke.xToDraw,
                this.temporal.sceneObjectToScreenProportion!.y * stroke.yToDraw,
            );
        }
    }

    isMyTypeComponentByStringType(nameComponent: string): boolean {
        return FreestyleGraphicComponent.nameComponent === nameComponent;
    }
    
    isMyTypeComponent(typeComponent: any): boolean {
        return FreestyleGraphicComponent === typeComponent;
    }

    clone(): Component {
        const rectangle = <FreestyleGraphicComponent> this.cloneParentBuilder(new FreestyleGraphicComponent());
        rectangle.allLines = this.allLines.map(this.cloneStroke);
        rectangle.container = this.paint(this.sceneObjectToScreenProportion);
        this.setRender(this.container.visible);
        return rectangle;
    }
    protected cloneStroke = (stroke: StrokeLine): StrokeLine => ({...stroke});
}
