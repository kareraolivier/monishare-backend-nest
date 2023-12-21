import { CustomError } from 'ts-custom-error'

import { CarID } from '../car'

export class CarNotFoundError extends CustomError {
  public readonly carId: CarID

  public constructor(carId: CarID) {
    super('Car not found')
    this.carId = carId
  }
}
