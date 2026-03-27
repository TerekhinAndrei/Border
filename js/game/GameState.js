import { GameConfig } from '../config/GameConfig.js';

/** @typedef {{ active: boolean, target?: string, startMs?: number, timer?: ReturnType<typeof setTimeout> }} SwitchState */

/**
 * Изменяемое состояние партии: граница, население, карта, FX.
 */
export class GameState {
  constructor() {
    /** @type {'ai'|'2p'} */
    this.gameMode = 'ai';
    /** @type {'easy'|'medium'|'hard'} */
    this.diff = 'medium';
    this.casusText = '';
    this.nameL = '';
    this.nameR = '';
    this.resetSession();
  }

  resetSession() {
    this.border = 0.5;
    this.popL = GameConfig.START_POP;
    this.popR = GameConfig.START_POP;
    this.lostL = 0;
    this.lostR = 0;
    this.startMs = Date.now();
    this.isOver = false;

    this.cdL = 0;
    this.cdR = 0;

    /** @type {'dev'|'atk'|'def'|'neu'} */
    this.modeL = 'atk';
    /** @type {'dev'|'atk'|'def'|'neu'} */
    this.modeR = 'atk';

    /** @type {SwitchState} */
    this.switchL = { active: false };
    /** @type {SwitchState} */
    this.switchR = { active: false };

    this.microPool = [];
    this.microIdx = 0;
    // casusText, nameL, nameR не сбрасываются здесь — задаются в showCasus()
    // и должны сохраняться для финального экрана и реванша

    this.threshHit = { 300000: false, 700000: false, 1200000: false };

    this.mapW = 0;
    this.mapH = 0;
    /** @type {number[][]} */
    this.terrain = [];
    /** @type {{x:number,y:number}[][]} */
    this.rivers = [];
    /** @type {{x:number,y:number,name:string,side:'l'|'r'}[]} */
    this.cities = [];
    /** @type {number[]} */
    this.frontJag = [];
    /** @type {{x:number,y:number,icon:string,life:number}[]} */
    this.events = [];
    /** @type {{x:number,y:number,vx:number,vy:number,life:number,col:string,r:number}[]} */
    this.particles = [];
  }
}
