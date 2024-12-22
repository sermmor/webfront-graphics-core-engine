import { BehaviourComponent } from "./behaviour-component";
import { GameObject } from "../../game-object";
import { Component } from "../component";
import { propiertiesInjector } from "../../../injection/dependency-injectors";
import { GameObjectManager } from "../../game-object-manager";
import { PoolGameObject } from "../../pools/pool-game-object";

interface ReferencesByBehaviour {
    toLinkReferences: BehaviourComponent;
    nameParameter: string;
    typeReference: string;
    nameReference: string;
    valueReference?: GameObject | Component | PoolGameObject;
}

export class ReferencesByBehaviourManager {
    referencesByBehaviour: ReferencesByBehaviour[] = [];

    add(newReference: ReferencesByBehaviour) {
        this.referencesByBehaviour.push(newReference);
    }

    addFromJson(behaviour: BehaviourComponent, jsonData: any) {
        const allNewReference: ReferencesByBehaviour[] = [];

        Object.keys(jsonData).forEach((referenceKey: any) => {
            const [ nameReference, typeReference ] = jsonData[referenceKey].split(":");
            allNewReference.push({
                toLinkReferences: behaviour,
                nameParameter: referenceKey,
                typeReference,
                nameReference,
            });
        });

        allNewReference.forEach(newReference => this.add(newReference));
    }

    findAllReferencesForBehaviour(behaviour: BehaviourComponent): ReferencesByBehaviour[] {
        return this.referencesByBehaviour.filter(reference => reference.toLinkReferences === behaviour);
    }

    injectReferencesInBehavour(behaviour: BehaviourComponent, gameObjectManager: GameObjectManager) {
        const parametersData: {[key: string]: any} = {}
        const allParameters = this.findAllReferencesForBehaviour(behaviour);

        allParameters.forEach(parameterToAdd => {
            if ("[PoolItem]" === parameterToAdd.typeReference) {
                parameterToAdd.valueReference = gameObjectManager.getPool(parameterToAdd.nameReference);
            } else {
                parameterToAdd.valueReference = gameObjectManager.findByName(parameterToAdd.nameReference);
                if ("GameObject" !== parameterToAdd.typeReference) {
                    parameterToAdd.valueReference = (<GameObject> parameterToAdd.valueReference!).getComponentByStringType(parameterToAdd.typeReference);
                }
            }
            parametersData[parameterToAdd.nameParameter] = parameterToAdd.valueReference;
        });

        delete (<any> behaviour)["references"];

        propiertiesInjector(behaviour, parametersData);
    }
}