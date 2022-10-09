export default class CustomWithCode extends Error {
  public code: string | number | undefined;
  constructor(message?: string, code?: string | number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
  }
}
