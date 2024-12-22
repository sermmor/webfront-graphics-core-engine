import * as webfontloader from 'webfontloader';
import { TextGraphic } from '../../wrappers/text';
import { GameObject } from '../game-object';
import { TextStyle } from '../../wrappers/text-style';
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from './component';
import { BaseTexture } from '../../wrappers/base-texture';
import { Container } from '../../wrappers/container';

interface FontLoadedCounter {
    nameFontLoaded: string;
    numberComponentUsingWebfont: number;
}

export class TextComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "TextComponent";
    private static fontsLoadedList: FontLoadedCounter[] = [];
    public text: TextGraphic;
    public isLoaded: boolean;
    public isPlaced: boolean;

    public textValue: string;
    private fontSize: number;
    private fontFamily: string;
    private align: 'left' | 'center' | 'right';
    private textBaseline: string;
    private fill: string;
    private fontWeight: string;
    private opacity: number;

    constructor(
    ) {
        super();
        this.isLoaded = false;
        this.isPlaced = false;
    }

    initialize = () => {}

    load(): Promise<Component> {
        return new Promise<Component>((resolve, reject) => {
            this.loadFont().then(() => {
                const style = new TextStyle({
                    fontSize: this.fontSize,
                    fontFamily: this.fontFamily,
                    align: this.align,
                    textBaseline: this.textBaseline,
                    fill: this.fill ? this.fill : "#000000",
                    fontWeight: this.fontWeight ? this.fontWeight : 'normal',
                });
                this.text = new TextGraphic(this.textValue, style);
                this.text.alpha = this.opacity ? this.opacity : 1;
                this.isLoaded = true;
                resolve(this);
            });
        });

        // await this.loadFont();
        // const style = new TextStyle({
        //     fontSize: this.fontSize,
        //     fontFamily: this.fontFamily,
        //     align: this.align,
        //     textBaseline: this.textBaseline,
        //     fill: this.fill ? this.fill : "#000000",
        //     fontWeight: this.fontWeight ? this.fontWeight : 'normal',
        // });
        // this.text = new TextGraphic(this.textValue, style);
        // this.text.alpha = this.opacity ? this.opacity : 1;
        // this.isLoaded = true;
        // return this;
    }

    private loadFont = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const fontCounter = TextComponent.fontsLoadedList.find(counter => counter.nameFontLoaded === this.fontFamily);
            if (fontCounter) {
                fontCounter.numberComponentUsingWebfont++;
                resolve();
            } else {
                webfontloader.load({
                    custom: {
                        families: [this.fontFamily]
                    },
                    active: () => {
                        TextComponent.fontsLoadedList.push({
                            nameFontLoaded: this.fontFamily,
                            numberComponentUsingWebfont: 1,
                        })
                        resolve();
                    }
                });
            }
        });
    }
    
    buildAndPlace(
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container {
        this.place(gameObject, sceneObjectToScreenProportion);
        this.setRender(gameObject.isEnabled);
        this.isPlaced = true;
        return this.text!;
    }

    private place = (gameObject: GameObject, sceneObjectToScreenProportion: {x: number, y: number}): TextGraphic => {
        this.text.scaleX = gameObject.transform.scale.x * sceneObjectToScreenProportion.x;
        this.text.scaleY = gameObject.transform.scale.y * sceneObjectToScreenProportion.y;
        this.text.setAnchor(0.5, 0.5);
        
        this.text.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this.text.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;
        return this.text;
    }

    setTextValue(newText: string) {
        this.textValue = newText;
        this.text.text = newText;
    }

    setRender(isRended: boolean) {
        if (this.text) {
            this.text.visible = isRended;
            this.text.renderable = isRended;
        }
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === TextComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === TextComponent.nameComponent;
    }

    getComponent = (nameComponent: any): Component | undefined => {
        return this;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        return this;
    }
    
    getAllComponents = (nameComponent: string): Component[] | undefined => {
        return [this];
    }

    setEnable = (isEnable: boolean): void => {
        this.setRender(isEnable);
    }

    setPosition(newPositionX: number, newPositionY: number) {
        if (this.text) {
            this.text.x = newPositionX;
            this.text.y = newPositionY;
        }
    }

    setScale(newScaleX: number, newScaleY: number) {
        if (this.text) {
            this.text.scaleX = newScaleX;
            this.text.scaleY = newScaleY;
        }
    }

    setRotation(newRotation: number) {
        if (this.text) {
            this.text.rotation = newRotation;
        }
    }

    setOpacity(newAlpha: number) {
        this.opacity = newAlpha;
        if (this.text) {
            this.text.alpha = this.opacity;
        }
    }
    
    destroy = (): BaseTexture | undefined => {
        const fontCounter = TextComponent.fontsLoadedList.find(counter => counter.nameFontLoaded === this.fontFamily);
        if (fontCounter) {
            if (fontCounter.numberComponentUsingWebfont <= 1) {
                const indexFont = TextComponent.fontsLoadedList.indexOf(fontCounter);
                TextComponent.fontsLoadedList.splice(indexFont, 1);
            } else {
                fontCounter.numberComponentUsingWebfont--;
            }
        }
        return undefined;
    }

    clone = (): Component => {
        const fontCounter = TextComponent.fontsLoadedList.find(counter => counter.nameFontLoaded === this.fontFamily);
        if (fontCounter) {
            fontCounter.numberComponentUsingWebfont++;
        }

        const newText = new TextComponent();
        
        newText.isLoaded = this.isLoaded;
        newText.isPlaced = this.isPlaced;
        newText.textValue = this.textValue;
        newText.fontSize = this.fontSize;
        newText.fontFamily = this.fontFamily;
        newText.align = this.align;
        newText.textBaseline = this.textBaseline;
        newText.fill = this.fill;
        if (this.text) {
            newText.text = new TextGraphic(newText.textValue, this.text.style);
        }

        return newText;
    }
}