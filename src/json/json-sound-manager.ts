import { SoundComponent } from '../scene-objects/components/sound/sound-component';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToSoundComponent = (gameObjectJSON: any): SoundComponent => {
    const sound = Injector.resolve<SoundComponent>(SoundComponent);
    propiertiesInjector(sound, gameObjectJSON);
    return sound;
};
