import { AnimationAE } from './animation-AE';

export abstract class CompostedAnimationAE extends AnimationAE {
    startAnimation() {
        if (!this.isShow()) {
            this.show(true);
        }

        this.isFinishedAnimation = false;
        this.start();
    }
}
