import { CustomError } from 'ts-custom-error'

import { type BookingID } from '../booking'

export class BookingStateTransitionError extends CustomError {
  public readonly bookingId: BookingID

  public constructor(bookingId: BookingID) {
    super(`You can not change booking state.`)

    this.bookingId = bookingId
  }
}
