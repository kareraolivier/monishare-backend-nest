import { CustomError } from 'ts-custom-error'

import { CarID } from 'src/application/car'

export class BookingYourOwnCarError extends CustomError {
  public readonly carId: CarID

  public constructor(carId: CarID) {
    super(`The car with ${carId} is yours, you can't book it.`)

    this.carId = carId
  }
}
