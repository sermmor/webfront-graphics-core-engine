import {
    Component,
    isImplementedITransformableComponent,
    isImplementedIComponentLifeCompleted,
    isImplementedIBuilderComponent,
    isImplementedIViewableComponent,
    isImplementedIPhysicManagerComponent,
    isImplementedIParcialLifeCircleComponent,
    isImplementedITypeableComponent
} from "./component";

export class GroupComponentByType {
    private _allBuilderComponent: Component[];
    private _allViewerComponent: Component[];
    private _allPhysicalManagerComponent: Component[];
    private _allTypableComponent: Component[];
    private _allTransformableComponent: Component[];
    private _allCompletedParcialLifeCircleComponent: Component[];
    private _allCompletedLifeCircleComponent: Component[];

    get allBuilderComponent() {
        if (!this._allBuilderComponent) {
            this._allBuilderComponent = this.componentList.filter(component => isImplementedIBuilderComponent(component))   
        }
        return this._allBuilderComponent;
    }

    get allViewerComponent() {
        if (!this._allViewerComponent) {
            this._allViewerComponent = this.componentList.filter(component => isImplementedIViewableComponent(component))   
        }
        return this._allViewerComponent;
    }

    get allPhysicalManagerComponent() {
        if (!this._allPhysicalManagerComponent) {
            this._allPhysicalManagerComponent = this.componentList.filter(component => isImplementedIPhysicManagerComponent(component))   
        }
        return this._allPhysicalManagerComponent;
    }

    get allTypableComponent() {
        if (!this._allTypableComponent) {
            this._allTypableComponent = this.componentList.filter(component => isImplementedITypeableComponent(component))   
        }
        return this._allTypableComponent;
    }

    get allTransformableComponent() {
        if (!this._allTransformableComponent) {
            this._allTransformableComponent = this.componentList.filter(component => isImplementedITransformableComponent(component))   
        }
        return this._allTransformableComponent;
    }

    get allCompletedParcialLifeCircleComponent() {
        if (!this._allCompletedParcialLifeCircleComponent) {
            this._allCompletedParcialLifeCircleComponent = this.componentList.filter(component => isImplementedIParcialLifeCircleComponent(component))   
        }
        return this._allCompletedParcialLifeCircleComponent;
    }

    get allCompletedLifeCircleComponent() {
        if (!this._allCompletedLifeCircleComponent) {
            this._allCompletedLifeCircleComponent = this.componentList.filter(component => isImplementedIComponentLifeCompleted(component))   
        }
        return this._allCompletedLifeCircleComponent;
    }

    constructor(private componentList: Component[]) {
        const allBuilders = this.allBuilderComponent;
        const allViewer = this.allViewerComponent;
        const allPhysicalManagers = this.allPhysicalManagerComponent;
        const allTypable = this.allTypableComponent;
        const allTransformable = this.allTransformableComponent;
        const allParcialLife = this.allCompletedParcialLifeCircleComponent;
        const allLifeCircle = this.allCompletedLifeCircleComponent;
    }
}
