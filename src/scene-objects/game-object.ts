import { Engine } from 'matter-js';
import { TransformComponent } from './components/transform-component';
import { SpriteComponent } from './components/sprite-component';
import { TextComponent } from './components/text-component';
import { GraphicComponent } from './components/graphics/graphic-component';
import { BaseTexture } from '../wrappers/base-texture';
import { Container } from '../wrappers/container';
import { RigidbodyComponent } from './components/rigidbody-component';
import { BehaviourComponentManager } from './components/behaviour/behaviour-component-manager';
import { ColliderComponentManager } from './components/colliders/collider-component-manager';
import { Component, ITransformableComponent, TransformAction, IComponentLifeCompleted, ITypeableComponent, IPhysicsManagerComponent, IParcialLifeCircleComponent, IViewableComponent, IBuilderComponent, isImplementedIBuilderComponent } from './components/component';
import { TweenComponentManager } from './components/tweens/tween-manager';
import { GroupComponentByType } from './components/group-component-by-type';
import { BehaviourTypeList } from './game-properties';

export class GameObject {
    name: string;
    isEnabled: boolean;
    private componentList: Component[];
    private groupComponentByType: GroupComponentByType;

    transform: TransformComponent;
    behaviourComponentManager: BehaviourComponentManager;
    private _tweenComponentManager: TweenComponentManager;
    private _collidersComponentManager: ColliderComponentManager;

    private sceneObjectToScreenProportion: {x: number, y: number};

    private temporal = {
        transformPropertyAction: TransformAction.MOVE,
        isApplyTransformationToPhysics: true,
        isApplyTransformationToTweens: false,
        firstCalledGetCollidersComponentManager: true,
        firstCalledGetTweenComponentManager: true,
        dimensionToChange: { x: 0, y: 0 },
        currentComponent: <Component | undefined> undefined,
        typeComponentStr: "",
        typeComponent: <any> undefined,
    }
    
    get tweenComponentManager(): TweenComponentManager {
        if (this.temporal.firstCalledGetTweenComponentManager) {
            this.temporal.firstCalledGetTweenComponentManager = false;
            for (this.temporal.currentComponent of this.groupComponentByType.allCompletedParcialLifeCircleComponent) {
                if (this.temporal.currentComponent instanceof TweenComponentManager) {
                    this._tweenComponentManager = this.temporal.currentComponent;
                    return (<TweenComponentManager> this.temporal.currentComponent);
                }
            }
        }
        return this._tweenComponentManager;
    }

    get collidersComponentManager(): ColliderComponentManager {
        if (this.temporal.firstCalledGetCollidersComponentManager) {
            this.temporal.firstCalledGetCollidersComponentManager = false;
            for (this.temporal.currentComponent of this.groupComponentByType.allPhysicalManagerComponent) {
                if  (this.temporal.currentComponent instanceof ColliderComponentManager) {
                    this._collidersComponentManager = this.temporal.currentComponent;
                    return this._collidersComponentManager;
                }
            }
        }
        return this._collidersComponentManager;
    }

    get hasABuilderComponent(): boolean {
        if (this.groupComponentByType) {
            return this.groupComponentByType.allBuilderComponent.length > 0;
        } else {
            return this.componentList.filter(c => isImplementedIBuilderComponent(c)).length > 0;
        }
    }

    initialize(behaviourComponentsJSON: any, behaviourTypeList: BehaviourTypeList[]) {
        const builderComponents = <IBuilderComponent[]> this.componentList.filter(c => isImplementedIBuilderComponent(c));
        for (this.temporal.currentComponent of builderComponents) {
            (<IBuilderComponent> this.temporal.currentComponent).initialize();
        }
        if (behaviourComponentsJSON) {
            this.behaviourComponentManager = new BehaviourComponentManager(this, behaviourComponentsJSON, behaviourTypeList);
            this.componentList.push(this.behaviourComponentManager);
        }
        this.groupComponentByType = new GroupComponentByType(this.componentList);
    }

    load = (): Promise<GameObject> => {
        return new Promise<GameObject>((resolve, reject) => {
            this.loadEach(0, () => resolve(this));
        });
        // for (this.temporal.currentComponent of this.groupComponentByType.allBuilderComponent) {
        //     await (<IBuilderComponent> this.temporal.currentComponent).load();
        // }

        // if (this.behaviourComponentManager && !this.behaviourComponentManager.isEmpty) {
        //     this.behaviourComponentManager.onLoad();
        // }
        // return this;
    }

    private loadEach = (i: number, onFinished: () => void) => {
        if (i === this.groupComponentByType.allBuilderComponent.length) {
            if (this.behaviourComponentManager && !this.behaviourComponentManager.isEmpty) {
                this.behaviourComponentManager.onLoad();
            }
            onFinished();
        } else {
            (<IBuilderComponent> this.groupComponentByType.allBuilderComponent[i]).load().then(() => {
                setTimeout(() => {
                    this.loadEach(i + 1, onFinished);
                }, 0);
            })
        }
    }

    buildAndPlace = (
        sceneContainer: Container,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): GameObject => {
        const container = this.buildAndPlaceContainers(sceneContainer, sceneObjectToScreenProportion, size, containerDebug);
        this.transform.build(this, container);
        if (this.collidersComponentManager) {
            this.collidersComponentManager!.buildColliders(this, sceneObjectToScreenProportion, size, containerDebug);
        }
        
        this.transform.addToTheApplication(sceneContainer);
        if (this.behaviourComponentManager && !this.behaviourComponentManager.isEmpty) {
            this.behaviourComponentManager.onAwake();
        }
        return this;
    }

    private buildAndPlaceContainers = (
        sceneContainer: Container,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container | undefined => {
        let container: Container | undefined;
        this.sceneObjectToScreenProportion = sceneObjectToScreenProportion;
        const parent = this.transform.gameObjectContainer ? this.transform.gameObjectContainer.parent : undefined;

        for (this.temporal.currentComponent of this.groupComponentByType.allBuilderComponent) {
            container = (<IBuilderComponent> this.temporal.currentComponent).buildAndPlace(this, sceneContainer, parent, sceneObjectToScreenProportion, size, containerDebug);
        }
        return container;
    }

    startAndPutToRunUpdates = () => {
        if (this.behaviourComponentManager) {
            this.behaviourComponentManager.startAndPutToRunUpdates();
        }
    }

    setPosition(newX: number, newY: number, applyToPhysics = true, applyScreenProportions = true, applyToTweens = false) {
        this.temporal.dimensionToChange.x = applyScreenProportions && this.sceneObjectToScreenProportion ? newX * this.sceneObjectToScreenProportion.x : newX;
        this.temporal.dimensionToChange.y = applyScreenProportions && this.sceneObjectToScreenProportion ? newY * this.sceneObjectToScreenProportion.y : newY;
        this.temporal.transformPropertyAction = TransformAction.MOVE;
        this.setTransformableProperty(applyToPhysics, applyToTweens);
    }

    setScale(newX: number, newY: number, applyToPhysics = true, applyToTweens = false) {
        this.temporal.dimensionToChange.x = newX;
        this.temporal.dimensionToChange.y = newY;
        this.temporal.transformPropertyAction = TransformAction.SCALE;
        this.setTransformableProperty(applyToPhysics, applyToTweens);
    }

    setRotation(newRotation: number, applyToPhysics = true, applyToTweens = false) {
        this.temporal.dimensionToChange.x = newRotation;
        this.temporal.transformPropertyAction = TransformAction.ROTATE;
        this.setTransformableProperty(applyToPhysics, applyToTweens);
    }

    private setTransformPropertyAction = (component: ITransformableComponent) => {
        switch (this.temporal.transformPropertyAction) {
            case TransformAction.MOVE:
                component.setPosition(this.temporal.dimensionToChange.x, this.temporal.dimensionToChange.y);
                break;
            case TransformAction.SCALE:
                component.setScale(this.temporal.dimensionToChange.x, this.temporal.dimensionToChange.y)
                break;
            case TransformAction.ROTATE:
                component.setRotation(this.temporal.dimensionToChange.x)
                break;
        }
    }
    private setTransformablePropiertyFilter = (
        component: Component
    ) => ((this.collidersComponentManager !== component && this.tweenComponentManager !== component)
        || (this.temporal.isApplyTransformationToTweens && this.tweenComponentManager === component)
        || (this.temporal.isApplyTransformationToPhysics && this.collidersComponentManager === component));

    private setTransformableProperty(applyToPhysics = true, applyToTweens = false) {
        this.temporal.isApplyTransformationToPhysics = applyToPhysics;
        this.temporal.isApplyTransformationToTweens = applyToTweens;
        this.groupComponentByType.allTransformableComponent
            .filter(this.setTransformablePropiertyFilter)
            .forEach(this.setTransformPropertyAction);
    }

    setOpacity = (newAlpha: number) => {
        for (this.temporal.currentComponent of this.groupComponentByType.allViewerComponent) {
            (<IViewableComponent> this.temporal.currentComponent).setOpacity(newAlpha);
        }
    }

    forceToEndCircleOfLife = () => {
        for (this.temporal.currentComponent of this.groupComponentByType.allCompletedParcialLifeCircleComponent) {
            (<IParcialLifeCircleComponent> this.temporal.currentComponent).forceToEndCircleOfLife();
        }
    }

    addPhysicsEngine(physicsEngine: Engine) {
        for (this.temporal.currentComponent of this.groupComponentByType.allPhysicalManagerComponent) {
            (<IPhysicsManagerComponent> this.temporal.currentComponent).addPhysicsEngine(physicsEngine);
        }
    }   

    enable(isEnabled: boolean) {
        this.isEnabled = isEnabled;
        for (this.temporal.currentComponent of this.groupComponentByType.allTypableComponent) {
            (<ITypeableComponent> this.temporal.currentComponent).setEnable(isEnabled);
        }
    }

    getComponentByStringType = (typeComponentStr: string): Component | undefined => {
        this.temporal.typeComponentStr = typeComponentStr;
        this.temporal.currentComponent = this.groupComponentByType.allTypableComponent.find(this.isComponentOfTypeByStringType);
        if (this.temporal.currentComponent) {
            return (<ITypeableComponent> this.temporal.currentComponent).getComponentByStringType(typeComponentStr);
        }
        return undefined;
    }
    private isComponentOfTypeByStringType = (currentComponent: ITypeableComponent) => currentComponent.isMyTypeComponentByStringType(this.temporal.typeComponentStr);

    getComponent = (typeComponent: any): Component | undefined => {
        this.temporal.typeComponent = typeComponent;
        this.temporal.currentComponent = this.groupComponentByType.allTypableComponent.find(this.isComponentOfType);
        if (this.temporal.currentComponent) {
            return (<ITypeableComponent> this.temporal.currentComponent).getComponent(typeComponent);
        }
        return undefined;
    }

    getAllComponents = (typeComponent: any): Component[] | undefined => {
        this.temporal.typeComponent = typeComponent;
        this.temporal.currentComponent = this.groupComponentByType.allTypableComponent.find(this.isComponentOfType);
        if (this.temporal.currentComponent) {
            return (<ITypeableComponent> this.temporal.currentComponent).getAllComponents(typeComponent);
        }
        return undefined;
    }
    private isComponentOfType = (currentComponent: ITypeableComponent) => (<ITypeableComponent> currentComponent).isMyTypeComponent(this.temporal.typeComponent);

    destroy = (): BaseTexture | undefined => {
        let baseTexture: BaseTexture | undefined;
        let resultDestroy: BaseTexture | undefined;
        this.groupComponentByType.allCompletedLifeCircleComponent.forEach(component => {
            try {
                resultDestroy = (<IComponentLifeCompleted> component).destroy();
            } catch (error) {
                // If there is an error to destroy, the object is already destroyed.
            }
            baseTexture = baseTexture ? baseTexture : resultDestroy;
        });
        return baseTexture;
    }

    clone = (): GameObject => {
        const newGameObject = new GameObject();
        newGameObject.name = this.name;
        newGameObject.isEnabled = this.isEnabled;
        newGameObject.componentList = [];

        const rigidbodyComponent = <RigidbodyComponent> this.getComponent(RigidbodyComponent);

        this.groupComponentByType.allCompletedLifeCircleComponent.forEach(component => {
            const clone = (<IComponentLifeCompleted> component).clone();
            newGameObject.componentList.push(clone);
            if (component instanceof TransformComponent) {
                newGameObject.transform = <TransformComponent> clone;
                newGameObject.transform.gameObject = newGameObject;
            } else if (component instanceof TextComponent) {
                newGameObject.transform.gameObjectContainer = component.text!;
            } else if (component instanceof SpriteComponent) {
                newGameObject.transform.gameObjectContainer = component.sprite!;
            } else if (component instanceof GraphicComponent) {
                newGameObject.transform.gameObjectContainer = component.graphicContainer;
            } else if (component instanceof ColliderComponentManager) {
                const collidersComponent = newGameObject.collidersComponentManager;
                collidersComponent!.addRigidBody(rigidbodyComponent);
                collidersComponent!.forceToRunPhysicsAllColliders();
            }
        });

        return newGameObject;
    }
}
