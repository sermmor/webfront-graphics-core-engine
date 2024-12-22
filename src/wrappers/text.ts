import { Text as PixiText, TextStyle as PixiTextStyle } from 'pixi.js';
import { Container } from './container';
import { Point } from './point';
import { TextStyle } from './text-style';
import { CoreEngine } from '../core-engine';

export type Text = TextGraphic;

export class TextGraphic extends Container {
    static isPixiWebGl: boolean;
    protected textGraphic: PixiText;
    protected textAnchor: Point;
    protected textStyle: TextStyle;

    constructor(text: string, style?: any | TextStyle, canvas?: HTMLCanvasElement, textPixi?: PixiText) {
        super(textPixi, true);
        TextGraphic.isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
        if (textPixi) {
            this.container = this.textGraphic = textPixi;
        } else {
            this.buildTextGraphics(TextGraphic.isPixiWebGl, text, style, canvas);
        }
    }

    static parseFromPixiText = (textPixi: PixiText): TextGraphic => {
        const newText = new TextGraphic('', undefined, undefined, textPixi);
        newText.textStyle = new TextStyle(undefined, textPixi.style);
        return newText;
    }

    get anchor() {
        if (!this.textAnchor) {
            this.textAnchor = new Point(this.textGraphic.anchor.x, this.textGraphic.anchor.y);
        }
        return this.textAnchor;
    }

    get text() {
        return this.textGraphic.text;
    }

    get pixiStyle(): any | PixiTextStyle {
        return this.textGraphic.style;
    }

    get style() {
        if (!this.textStyle && TextGraphic.isPixiWebGl) {
            this.textStyle = TextStyle.parseFromStyleWebGlToTextStyle(this);
        }
        return this.textStyle;
    }

    set anchor(value: Point) {
        if (!this.textAnchor) {
            this.textAnchor = new Point(value.x, value.y);
        } else {
            this.textAnchor.set(value.x, value.y);
        }
        this.textGraphic.anchor.set(value.x, value.y);
    }

    set text(value: string) {
        this.textGraphic.text = value;
    }

    setAnchor(x: number, y: number) {
        this.anchor = new Point(x, y);
    }

    private buildTextGraphics(isPixiWebGl: boolean, text: string, style?: any | TextStyle, canvas?: HTMLCanvasElement) {
        if (isPixiWebGl) {
            const pixiTextStyle = (style && style instanceof TextStyle) ? style.textStylePixiWebGl : style;
            this.container = this.textGraphic = new PixiText(text, pixiTextStyle, canvas);
        }
    }
}
