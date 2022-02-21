interface IDappletState <T> {
  default: Omit<T, 'me'>
  get(id?: string): T
  set(id: string, data: T) : void
  getPairs(): [string, T][]
  getAll(): { [k: string]: T }
  has(id: string): boolean
}

export default class State <T> implements IDappletState <T> {
  private _state: {
    [name: string]: T
  } = {};

  public default: Omit<T, 'me'>;
  
  constructor(props?: Omit<T, 'me'>) {
    this.default = props;
  }

  public get(id: string) {
    if (!this.has(id)) throw new Error('The State has no key of such ID');
    return this._state[id];
  }

  public set(id: string, data: T) {
    this._state[id] = data;
  }

  public getPairs() {
    return Object.entries(this._state);
  }

  public getAll() {
    return this._state;
  }

  public has(id: string) {
    return Object.prototype.hasOwnProperty.call(this._state, id);
  }
}