export class Color {
    r: number;
    g: number;
    b: number;
    a: number;

    private hex: number;
    get toHexadecimal(): number { return this.hex; }

    constructor(sColor: string) {
        if (sColor.includes('#')) {
            sColor = this.hexToRgbA(sColor);
            this.hex = this.parseToHexadecimalNumber(sColor);
        }

        const [rStr, gStr, bStr, aStr] = sColor.slice(1, sColor.length-1).split(",");
        [this.r, this.g, this.b, this.a] = [+rStr, +gStr, +bStr, +aStr];
        
        if (!this.hex) {
            this.hex = this.parseToHexadecimalNumber(this.rgbToHex(this.r, this.g, this.b));
        }
    }

    private parseToHexadecimalNumber = (hex: string): number => {
        return +("0x"+ hex.replace('#', ''));
    }

    private rgbToHex = (r: number, g: number, b: number): string => {
        let hexR = Number(r).toString(16);
        let hexG = Number(g).toString(16);
        let hexB = Number(b).toString(16);
        if (hexR.length === 1) hexR = `0${hexR}`;
        if (hexG.length === 1) hexG = `0${hexG}`;
        if (hexB.length === 1) hexB = `0${hexB}`;
        return `#${hexR}${hexG}${hexB}`;
    }

    private hexToRgbA = (hex: string): string => {
        let c: string[] | string;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length == 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return '('+[(+c>>16)&255, (+c>>8)&255, +c&255].join(',')+',1)';
        }
        throw new Error('Bad Hex');
    }

    clone(): Color {
        return new Color(`(${this.r},${this.g},${this.b},${this.a})`);
    }
}