import { GraphicComponent } from "./graphic-component";
import { Component } from "../component";
import { Graphics } from "../../../wrappers/graphics";

export class CircleComponent extends GraphicComponent {
    public static nameComponent = "CircleComponent";
    protected x: number;
    protected y: number;
    protected radius: number;

    protected paintGraphic(graphic: Graphics, sceneObjectToScreenProportion: { x: number; y: number; }): Graphics {
        graphic.drawCircle(
            this.x * sceneObjectToScreenProportion.x,
            this.y * sceneObjectToScreenProportion.y,
            this.radius * sceneObjectToScreenProportion.x,
        );
        return graphic;
    }

    isMyTypeComponentByStringType(nameComponent: string): boolean {
        return CircleComponent.nameComponent === nameComponent;
    }
    
    isMyTypeComponent(typeComponent: any): boolean {
        return CircleComponent === typeComponent;
    }

    clone(): Component {
        const rectangle = <CircleComponent> this.cloneParentBuilder(new CircleComponent());
        rectangle.x = this.x;
        rectangle.y = this.y;
        rectangle.radius = this.radius;
        rectangle.container = this.paint(this.sceneObjectToScreenProportion);
        this.setRender(this.container.visible);
        return rectangle;
    }
}