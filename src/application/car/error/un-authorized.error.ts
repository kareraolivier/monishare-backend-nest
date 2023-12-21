import { UserID } from 'src/application/user'

import { CustomError } from 'ts-custom-error'

export class UnAuthorizedError extends CustomError {
  public readonly ownerId: UserID

  public constructor(ownerId: UserID) {
    super('You are not allowed to perfom this action')
    this.ownerId = ownerId
  }
}
