import { TextStyle as PixiTextStyle } from 'pixi.js';
import { TextGraphic } from './text';

interface StyleData {
    align?: string;
    breakWords?: boolean;
    dropShadow?: boolean;
    dropShadowAlpha?: number;
    dropShadowAngle?: number;
    dropShadowBlur?: number;
    dropShadowColor?: string | number;
    dropShadowDistance?: number;
    fill?: string | string[] | number | number[] | CanvasGradient | CanvasPattern;
    fillGradientType?: number;
    fillGradientStops?: number[];
    fontFamily?: string | string[];
    fontSize?: number | string;
    fontStyle?: string;
    fontVariant?: string;
    fontWeight?: string;
    leading?: number;
    letterSpacing?: number;
    lineHeight?: number;
    lineJoin?: string;
    miterLimit?: number;
    padding?: number;
    stroke?: string | number;
    strokeThickness?: number;
    trim?: boolean;
    textBaseline?: string; // 'top'||'middle'||'bottom'
    whiteSpace?: string;
    wordWrap?: boolean;
    wordWrapWidth?: number;
}

export class TextStyle {
    private pixiTextStyle: PixiTextStyle;
    // constructor(private textGraphics: TextGraphic) {}
    constructor(style?: StyleData, pixiTextStyle?: PixiTextStyle) {
        if (pixiTextStyle) {
            this.pixiTextStyle = pixiTextStyle;
        } else {
            this.pixiTextStyle = new PixiTextStyle(style);
        }
    }

    static parseFromStyleWebGlToTextStyle(textGraphics: TextGraphic) {
        return new TextStyle(textGraphics.style);
    }

    set fontSize(value: number) {
        this.pixiTextStyle.fontSize = value;
    }

    set fontFamily(value: string) {
        this.pixiTextStyle.fontFamily = value;
    }

    set align(value: string) {
        this.pixiTextStyle.align = value;
    }

    set textBaseline(value: string) {
        // 'top'||'middle'||'bottom'
        this.pixiTextStyle.textBaseline = value;
    }

    set fill(value: string) {
        this.pixiTextStyle.fill = value;
    }

    set fontWeight(value: string) {
        this.pixiTextStyle.fontWeight = value;
    }

    get textStylePixiWebGl(): PixiTextStyle {
        return this.pixiTextStyle;
    }

    get fontSize() {
        return +this.pixiTextStyle.fontSize;
    }
}
