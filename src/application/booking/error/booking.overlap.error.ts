import { CustomError } from 'ts-custom-error'

import { CarID } from 'src/application/car'

export class BookingOverlapError extends CustomError {
  public readonly carId: CarID

  public constructor(carId: CarID) {
    super(`A car with ${carId} is already booked during this period of time`)

    this.carId = carId
  }
}
