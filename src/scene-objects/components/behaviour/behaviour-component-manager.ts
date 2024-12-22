// import 'core-js/modules/es7.object.values';
import { BehaviourComponent, BehaviourComponentInterface } from "./behaviour-component";
import { GameObject } from "../../game-object";
import { Game } from '../../game';
import { Injector, propiertiesInjector } from "../../../injection/dependency-injectors";
import { ReferencesByBehaviourManager } from './references-by-behaviour';
import { GameObjectManager } from '../../game-object-manager';
import { cloneJSONData } from '../../../utils/json-utils';
import { ITransformableComponent, isImplementedITransformableComponent, Component, IComponentLifeCompleted, TransformAction, ITypeableComponent, IParcialLifeCircleComponent } from '../component';
import { BaseTexture } from '../../../wrappers/base-texture';
import { BehaviourTypeList } from '../../game-properties';

enum CircleOfLifePhases { WithoutPhase = 0, Load, Awake, Start, Enable, OnUpdates, Disable, Destroy, Ending };

export class BehaviourComponentManager extends Component implements ITransformableComponent, IComponentLifeCompleted,
        ITypeableComponent, IParcialLifeCircleComponent {
    private static typeOfBehaviour: string[] = [];

    private _behaviourComponents: BehaviourComponent[];
    private _behaviourComponentsWithUpdates: BehaviourComponent[];
    private currentUpdater: number | undefined;
    private referencesBehaviour: ReferencesByBehaviourManager;
    private originalBehaviourComponentsJSON: any;
    private currentLifePhase: CircleOfLifePhases;

    private temporal = {
        transformToChange: { x: 0, y: 0 },
        transformOperation: TransformAction.MOVE,
        transformableBehaviourList: <undefined | BehaviourComponent[]> undefined,
        nameTypeComponent: "",
        typeComponent: <any> undefined,
        currentBehaviour: <BehaviourComponent | undefined> undefined,
        deltaTime: 0,
    }

    get isEmpty() { return this._behaviourComponents.length === 0; }
    get behaviourComponents() { return this._behaviourComponents; }

    constructor(
        private gameObject: GameObject,
        behaviourComponentsJSON: any,
        private behaviourTypeList: BehaviourTypeList[],
    ){
        super();
        this._behaviourComponents = [];
        this.currentUpdater = undefined;
        this.currentLifePhase = CircleOfLifePhases.WithoutPhase;
        this.originalBehaviourComponentsJSON = cloneJSONData(behaviourComponentsJSON);
        this.referencesBehaviour = new ReferencesByBehaviourManager();
        behaviourComponentsJSON.forEach((singleBehaviourJSON: any) => {
            this.addBehaviourComponent(singleBehaviourJSON);
        });
        this._behaviourComponentsWithUpdates = this._behaviourComponents.filter(behaviour => !!(<BehaviourComponentInterface>behaviour).update);

        // Parse all behaviour of this behaviour manager, to string types.
        const typesToAddWithRepetitions = this._behaviourComponents.map(b => {
            const typeFinded = behaviourTypeList.find(t => b instanceof t.classType);
            if (typeFinded) {
                return typeFinded.nameClass; // behaviour type finded!
            } else {
                return b.constructor.name; // With javascript minifier this will fail!
            }
        }).filter(type => !BehaviourComponentManager.typeOfBehaviour.includes(type));

        if (typesToAddWithRepetitions.length > 0) {
            const typesToAdd: string[] = [];
            typesToAddWithRepetitions.forEach((type) => {
                if (!typesToAdd.includes(type)) typesToAdd.push(type);
            })
            BehaviourComponentManager.typeOfBehaviour = BehaviourComponentManager.typeOfBehaviour.concat(typesToAdd);
        }
    }

    private addBehaviourComponent = (behaviourComponentJSON: any): BehaviourComponent => {
        let behaviour: BehaviourComponent;
        
        // Object.keys(behaviourComponentJSON).forEach((behaviourComponentName: string) => {
        for (const behaviourComponentName in behaviourComponentJSON) {
            const typeBehaviour = this.behaviourTypeList.find(t => behaviourComponentName === t.nameClass);
            if (!typeBehaviour) {
                console.error(`The behaviour type ${behaviourComponentName} doesn't exist!`);
            }
            behaviour = Injector.resolve<BehaviourComponent>(typeBehaviour!.classType);
            const parametersData = {
                ...(<any> behaviourComponentJSON)[behaviourComponentName],
                gameObject: this.gameObject,
            };
            this.filterBehaviourReferences(behaviour, parametersData);
            propiertiesInjector(behaviour, parametersData);
        }
        // });
        this._behaviourComponents.push(behaviour!);
        return behaviour!;
    }

    injectReferencesInBehavour(gameObjectManager: GameObjectManager) {
        this._behaviourComponents.forEach(behaviour => 
            this.referencesBehaviour.injectReferencesInBehavour(behaviour, gameObjectManager)
        );
        delete ((<any> this)["referencesBehaviour"]);
    }

    filterBehaviourReferences = (behaviour: BehaviourComponent, parametersData: any) => {
        const referenceJSON = parametersData["references"];
        if (referenceJSON) {
            this.referencesBehaviour.addFromJson(behaviour, referenceJSON);
        }
    }

    getComponentByStringType = (nameComponent: string): BehaviourComponent | undefined => {
        this.temporal.nameTypeComponent = nameComponent;
        return this._behaviourComponents.find(this.getComponentByStringTypeBehaviour);
    }

    getComponent = (typeComponent: any): BehaviourComponent | undefined => {
        this.temporal.typeComponent = typeComponent;
        return this._behaviourComponents.find(this.getComponentByTypeBehaviour);
    }

    getAllComponents = (typeComponent: any): BehaviourComponent[] => {
        this.temporal.typeComponent = typeComponent;
        return this._behaviourComponents.filter(this.getComponentByTypeBehaviour);
    }

    private getComponentByStringTypeBehaviour = (currentBehaviour: BehaviourComponent): boolean => {
        this.temporal.currentBehaviour = currentBehaviour;
        return this.behaviourTypeList.find(this.isBehaviourType)!.nameClass === this.temporal.nameTypeComponent;
    }
    private isBehaviourType = (t: BehaviourTypeList) => this.temporal.currentBehaviour instanceof t.classType;
    private getComponentByTypeBehaviour = (currentBehaviour: BehaviourComponent) => currentBehaviour instanceof this.temporal.typeComponent;

    isMyTypeComponent = (typeComponent: any): boolean => {
        this.temporal.typeComponent = typeComponent;
        return this._behaviourComponents.find(this.getComponentByTypeBehaviour) !== undefined;
    }
    
    isMyTypeComponentByStringType = (nameComponent: string): boolean => BehaviourComponentManager.typeOfBehaviour.includes(nameComponent);
    
    setEnable = (isEnable: boolean) => {
        if (isEnable) {
            this.onEnable();
        } else {
            this.onDisable();
        }
    }

    onLoad = () => {
        this.currentLifePhase = CircleOfLifePhases.Load;
        this._behaviourComponents.forEach(this.onLoadBehaviour);
    }

    private onLoadBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onLoad) behaviour.onLoad!();
    }

    onAwake = () => {
        this.currentLifePhase = CircleOfLifePhases.Awake;
        this._behaviourComponents.forEach(this.onAwakeBehaviour);
    }

    private onAwakeBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onAwake) behaviour.onAwake!();
    }

    onStart = () => {
        this.currentLifePhase = CircleOfLifePhases.Start;
        this._behaviourComponents.forEach(this.onStartBehaviour);
    }

    private onStartBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onStart) behaviour.onStart!();
    }

    onEnable = () => {
        if (this.currentLifePhase === CircleOfLifePhases.WithoutPhase) return;

        this.currentLifePhase = CircleOfLifePhases.Enable;
        this._behaviourComponents.forEach(this.onEnableBehaviour);
        this.beginAllUpdates();
    }

    private onEnableBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onEnable) behaviour.onEnable!();
    }

    onDisable = () => {
        if (this.currentLifePhase === CircleOfLifePhases.WithoutPhase) return;
        if (this.currentUpdater) {
            this.endCircleOfLifeUpdaters(this.currentUpdater);
            this.currentUpdater = undefined;
        }
        this.currentLifePhase = CircleOfLifePhases.Disable;
        this._behaviourComponents.forEach(this.onDisableBehaviour);
    }

    private onDisableBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onDisable) behaviour.onDisable!();
    }

    onDestroy = () => {
        this.currentLifePhase = CircleOfLifePhases.Destroy;
        if (this.currentUpdater) {
            this.endCircleOfLifeUpdaters(this.currentUpdater);
            this.currentUpdater = undefined;
        }
        this._behaviourComponents.forEach(this.onDestroyBehaviour);
    }

    private onDestroyBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onDestroy) behaviour.onDestroy!();
    }

    beginAllUpdates = () => {
        if (!this.gameObject.isEnabled) return;
        this.currentLifePhase = CircleOfLifePhases.OnUpdates;
        if (this._behaviourComponentsWithUpdates.length > 0) {
            if (this.currentUpdater) {
                this.endCircleOfLifeUpdaters(this.currentUpdater);
            }
            const indexUpdater = Game.instance.updateEventManager.addUpdateEvent(this.updateAllBehaviours);
            this.currentUpdater = indexUpdater;
        }
    }
    private updateAllBehaviours = () => {
        if (this.currentLifePhase === CircleOfLifePhases.OnUpdates) {
            this.temporal.deltaTime = Game.instance.updateEventManager.deltaTime/1000;
            this._behaviourComponentsWithUpdates.forEach(this.updateBehaviour);
        }
    }
    private updateBehaviour = (behaviour: BehaviourComponentInterface) => {
        behaviour.update!(this.temporal.deltaTime);
    }

    startAndPutToRunUpdates = () => {
        if (!this.isEmpty) {
            this.onStart();
            this.beginAllUpdates();
        }
    }

    forceToEndCircleOfLife = () => {
        if (this.currentLifePhase === CircleOfLifePhases.Ending) {
            return;
        }
        this.currentLifePhase = CircleOfLifePhases.Ending;
        this._behaviourComponents.forEach(this.endCircleOfLifeBehaviour);
        if (this.currentUpdater) {
            this.endCircleOfLifeUpdaters(this.currentUpdater);
        }
    }

    private endCircleOfLifeBehaviour = (behaviour: BehaviourComponentInterface) => {
        if (behaviour.onEndingCircleOfLife) {
            behaviour.onEndingCircleOfLife!();
        }
    }

    private endCircleOfLifeUpdaters = (updaterToDelete: number) => Game.instance.updateEventManager.removeUpdateEvent(updaterToDelete);

    setPosition = (newPositionX: number, newPositionY: number) => {
        this.temporal.transformToChange.x = newPositionX;
        this.temporal.transformToChange.y = newPositionY;
        this.temporal.transformOperation = TransformAction.MOVE;
        this.getTransformableBehaviour().forEach(this.setTransformBehaviour);
    }

    setScale = (newScaleX: number, newScaleY: number) => {
        this.temporal.transformToChange.x = newScaleX;
        this.temporal.transformToChange.y = newScaleY;
        this.temporal.transformOperation = TransformAction.SCALE;
        this.getTransformableBehaviour().forEach(this.setTransformBehaviour);
    }

    setRotation = (newRotation: number) => {
        this.temporal.transformToChange.x = newRotation;
        this.temporal.transformOperation = TransformAction.ROTATE;
        this.getTransformableBehaviour().forEach(this.setTransformBehaviour);
    }

    private getTransformableBehaviour(): BehaviourComponent[] {
        if (!this.temporal.transformableBehaviourList) {
            this.temporal.transformableBehaviourList = this.behaviourComponents.filter(isImplementedITransformableComponent);
        }
        return this.temporal.transformableBehaviourList;
    }

    private setTransformBehaviour(behaviour: ITransformableComponent) {
        switch (this.temporal.transformOperation) {
            case TransformAction.MOVE:
                (<ITransformableComponent> behaviour).setPosition(this.temporal.transformToChange.x, this.temporal.transformToChange.y);
                break;
            case TransformAction.SCALE:
                (<ITransformableComponent> behaviour).setScale(this.temporal.transformToChange.x, this.temporal.transformToChange.y);
                break;
            case TransformAction.ROTATE:
                (<ITransformableComponent> behaviour).setRotation(this.temporal.transformToChange.x);
                break;
        }
    }

    destroy = (): BaseTexture | undefined => {
        this.onDestroy();
        return undefined;
    }

    clone(): Component {
        const clone = new BehaviourComponentManager(
            this.gameObject,
            this.originalBehaviourComponentsJSON,
            this.behaviourTypeList,
        );
        
        if (this.currentLifePhase >= CircleOfLifePhases.Load) {
            clone.onLoad();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.Awake) {
            clone.onAwake();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.Start) {
            clone.onStart();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.Enable) {
            clone.onEnable();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.OnUpdates) {
            clone.beginAllUpdates();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.Disable) {
            clone.onDisable();
        }
        if (this.currentLifePhase >= CircleOfLifePhases.Destroy) {
            clone.onDestroy();
        }

        return clone;
    }
}
