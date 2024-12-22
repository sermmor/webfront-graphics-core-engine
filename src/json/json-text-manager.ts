import { TextComponent } from '../scene-objects/components/text-component';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';

export const mapFromJsonToTextComponent = (gameObjectJSON: any): TextComponent => {
    const text = Injector.resolve<TextComponent>(TextComponent);
    propiertiesInjector(text, gameObjectJSON);
    return text;
};
