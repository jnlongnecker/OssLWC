import { LightningElement } from 'lwc';

export default class Holder extends LightningElement {
    viewBasics = true;

    swapView() {
        this.viewBasics = !this.viewBasics;
    }
}