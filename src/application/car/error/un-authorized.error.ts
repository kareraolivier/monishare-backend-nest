import { CustomError } from 'ts-custom-error'

export class UnAuthorizedError extends CustomError {
  public readonly ownerId: string

  public constructor(ownerId: string) {
    super('A car with this license plate already exists')
    this.ownerId = ownerId
  }
}
