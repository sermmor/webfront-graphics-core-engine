import { ParticleComponent } from '../scene-objects/components/particles/particle-component';
import { ParticleComponentManager } from '../scene-objects/components/particles/particle-component-manager';
import { propiertiesInjector, Injector } from '../injection/dependency-injectors';
import { Color } from '../wrappers/color';
import { ParticleConfigJson } from '../scene-objects/game-properties';

const searchConfigJSON = (nameParticle: string, particlesConfigJson: ParticleConfigJson[]): any => {
    const finded = particlesConfigJson.find(particleConfig => particleConfig.nameParticle === nameParticle);
    if (finded) {
        return finded.data;
    }
    console.error(`Cannot find particle configuration file ${nameParticle}`);
    return undefined;
};

const mapFromJsonToParticle = (particleJSON: any, particlesConfigJson: ParticleConfigJson[]): ParticleComponent => {
    particleJSON['config'] = searchConfigJSON(particleJSON['config'], particlesConfigJson);
    particleJSON['color'] = new Color(particleJSON['color']);
    const particle = Injector.resolve<ParticleComponent>(ParticleComponent);
    propiertiesInjector(particle, particleJSON);
    return particle;
};

export const mapFromJsonToParticleComponentManager = (
    gameObjectJSON: any,
    particlesConfigJson: ParticleConfigJson[]
): ParticleComponentManager => {
    const particleComponentList: ParticleComponent[] = [];
    gameObjectJSON.forEach((particleJSON: any) => particleComponentList.push(mapFromJsonToParticle(particleJSON, particlesConfigJson)));
    return new ParticleComponentManager(particleComponentList);
};
