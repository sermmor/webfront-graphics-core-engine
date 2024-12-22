import { Howl } from 'howler';
import { BaseTexture } from "../../../wrappers/base-texture";
import { Container } from "../../../wrappers/container";
import { Game } from '../../game';
import { GameObject } from "../../game-object";
import { Component, IBuilderComponent, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent } from "../component";

export class SoundComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IBuilderComponent {
    
    soundNames: string[];
    sprite: {[name: string]: [number, number] | [number, number, boolean]};
    private soundPaths: string[];
    private allSounds: Howl[];

    private container: Container;
    private isLoaded: boolean = false;

    private currentSoundPlaying: Howl;
    private currentSoundToStop: Howl;
    
    initialize = (): void => {
        this.allSounds = [];
        this.soundPaths = [];
        this.soundNames.forEach(nameFile => {
            const path = this.completePath(Game.instance.propierties.imageAsssetPaths, nameFile);
            if (path) {
                this.soundPaths.push(path);
            }
        });
    }

    private completePath(paths: string[], nameFile: string): string | undefined {
        let currentPath: string;
        for (let i = 0; i < paths.length; i++) {
            currentPath = paths[i];
            if (currentPath.includes(nameFile)) {
                return currentPath;
            }
        }
        console.error(`${nameFile} path is missing. Add that path to GameProperties.`);
        return undefined;
    }

    load = (): Promise<Component> => {
        let soundsLoaded = 0;
        return new Promise<Component>((resolve, reject) => {
            if (this.sprite) {
                this.allSounds.push(
                    new Howl({
                        src: this.soundPaths,
                        sprite: this.sprite,
                        preload: true,
                        volume: 1
                    }));
                this.currentSoundPlaying = this.allSounds[0];
                this.currentSoundPlaying.once('load', () => {
                    soundsLoaded++;
                    if (soundsLoaded >= this.soundPaths.length) {
                        this.isLoaded = true;
                        resolve();
                    }
                });
            } else {
                for (let i = 0; i < this.soundPaths.length; i++) {
                    this.allSounds.push(new Howl({
                        src: [this.soundPaths[i]],
                        preload: true,
                        volume: 1
                    }));
                    this.allSounds[this.allSounds.length - 1].once('load', () => {
                        soundsLoaded++;
                        if (soundsLoaded >= this.soundPaths.length) {
                            this.isLoaded = true;
                            resolve();
                        }
                    });
                }
            }
        });
    }

    isAllSoundLoaded = () => this.isLoaded;

    doCallbackWhenAllSoundIsLoaded = (onSoundLoaded: () => void) => {
        setTimeout(() => {
            if (this.isLoaded) {
                onSoundLoaded();
            } else {
                this.doCallbackWhenAllSoundIsLoaded(onSoundLoaded);
            }
        }, 0);
    }

    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container => {
        this.container = new Container();
        return this.container;
    }

    playSound = (soundName: string, onSoundPlayed?: () => void) => {
        if (this.sprite) {
            this.currentSoundPlaying.play(soundName);
        } else {
            this.currentSoundPlaying = this.allSounds[this.soundNames.indexOf(soundName)];
            this.currentSoundPlaying.play();
        }
        
        if (onSoundPlayed) {
            this.currentSoundPlaying.on('end', onSoundPlayed);
        }
    }

    stopSound = (soundName: string) => {
        if (this.sprite) {
            this.currentSoundPlaying.stop();
        } else {
            this.currentSoundToStop = this.allSounds[this.soundNames.indexOf(soundName)];
            this.currentSoundToStop.stop();
        }
    }
            
    setPosition = (newPositionX: number, newPositionY: number) => {}
    setScale = (newScaleX: number, newScaleY: number) => {}
    setRotation = (newRotation: number) => {}
    isMyTypeComponent = (typeComponent: any): boolean => SoundComponent === typeComponent;
    isMyTypeComponentByStringType = (nameComponent: string): boolean => "SoundComponent" === nameComponent;
    getComponentByStringType = (nameComponent: string): Component | undefined => this;
    getComponent = (nameComponent: any): Component | undefined => this;
    getAllComponents = (nameComponent: string): Component[] | undefined => [this];

    setEnable = (isEnable: boolean) => {
        if (!isEnable) {
            this.allSounds.forEach(this.stopHowl);
        }
    }
    private stopHowl = (sound: Howl) => sound.stop();

    clone = (): Component => {
        let copy = new SoundComponent();

        copy.container = new Container();

        copy.soundNames = [...this.soundNames];
        copy.soundPaths = [...this.soundPaths];
        copy.load();

        return copy;
    }
    destroy = (): BaseTexture | undefined => {
        (<any> this.currentSoundPlaying) = undefined;
        (<any> this.currentSoundToStop) = undefined;
        this.container.removeChildren();
        this.container.destroy();

        this.allSounds.forEach(s => s.unload());
        (<any> this.allSounds) = undefined;
        (<any> this.soundNames) = undefined;
        (<any> this.soundPaths) = undefined;

        return undefined;
    }
}