import { CustomError } from 'ts-custom-error'

import { CarID } from 'src/application/car'

export class BookingOwnCarError extends CustomError {
  public readonly carId: CarID

  public constructor(carId: CarID) {
    super(`This is your car, you can't book it.`)

    this.carId = carId
  }
}
