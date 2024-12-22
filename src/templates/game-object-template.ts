// import 'core-js/modules/es7.object.values';
import { replaceAllOcurrences } from '../utils/string-utils';

export interface TemplateVars {
    [key: string]: string | number;
}

export abstract class GameObjectTemplate {
    numberElements: number;
    isUseIndexWithoutZeroForTemplate: boolean;
    templateVars: TemplateVars;
    private templateJSONText: string;

    abstract doBeforeBuildIndexTemplate(index: number, templateVars: TemplateVars): void;

    private buildTemplateObject(index: number): string {
        this.doBeforeBuildIndexTemplate(index, this.templateVars);

        const indexToShow = (this.isUseIndexWithoutZeroForTemplate ? (index + 1) : index).toString();
        let gameObjectJson = replaceAllOcurrences(this.templateJSONText, `"[index:number]"`, indexToShow);
        gameObjectJson = replaceAllOcurrences(this.templateJSONText, "[index:number]", indexToShow);
        gameObjectJson = replaceAllOcurrences(gameObjectJson, "[index:string]", indexToShow);

        // Object.keys(this.templateVars).forEach((key: string) => {
        for (const key in this.templateVars) {
            const value = this.templateVars[key];
            gameObjectJson = replaceAllOcurrences(gameObjectJson, `"[${key}:number]"`, value.toString());
            gameObjectJson = replaceAllOcurrences(gameObjectJson, `[${key}:number]`, value.toString());
            gameObjectJson = replaceAllOcurrences(gameObjectJson, `[${key}:string]`, value.toString());
        }
        // });
        
        return gameObjectJson;
    }
    
    build = (templateJSON: any): any => {
        this.templateJSONText = JSON.stringify(templateJSON, null, 2);
        this.templateJSONText = this.templateJSONText.substring(1, this.templateJSONText.length - 1);
        let text = "";

        for (let i = 0; i < this.numberElements; i++) {
            text += this.buildTemplateObject(i);
            if (i < this.numberElements - 1) {
                text += ",\n";
            }
        }

        return JSON.parse(`{\n${text}\n}`);
    }
}