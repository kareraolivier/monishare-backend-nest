import { Injectable, Logger } from '@nestjs/common'
import { Dayjs } from 'dayjs'
import { type Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { CarID } from '../car'
import { UserID } from '../user'

import { Booking, BookingID, BookingProperties } from './booking'
import { BookingState } from './booking-state'
import { IBookingRepository } from './booking.repository.interface'
import { type IBookingService } from './booking.service.interface'

@Injectable()
export class BookingService implements IBookingService {
  private readonly bookingRepository: IBookingRepository
  private readonly databaseConnection: IDatabaseConnection
  private readonly logger: Logger

  public constructor(
    bookingRepository: IBookingRepository,
    databaseConnection: IDatabaseConnection,
  ) {
    this.bookingRepository = bookingRepository
    this.databaseConnection = databaseConnection
    this.logger = new Logger(BookingService.name)
  }
  public async getAll(): Promise<Booking[]> {
    const result = this.databaseConnection.transactional(async tx => {
      const bookings = await this.bookingRepository.getAll(tx)
      return bookings
    })
    return result
  }
  public async get(id: BookingID): Promise<Booking> {
    return this.databaseConnection.transactional(tx =>
      this.bookingRepository.get(tx, id),
    )
  }

  /* eslint-disable @typescript-eslint/require-await */

  public async update(
    bookingId: BookingID,
    updates: Partial<Except<BookingProperties, 'id'>>,
    currentUserId: UserID,
  ): Promise<Booking> {
    return this.databaseConnection.transactional(async tx => {
      const booking = await this.bookingRepository.get(tx, bookingId)
      const updatedBooking = new Booking({
        ...booking,
        ...updates,
        id: bookingId,
      })

      return this.bookingRepository.update(tx, updatedBooking)
    })
  }



  public create(_properties: {
    carId: CarID
    state: BookingState
    renterId: UserID
    startDate: Dayjs
    endDate: Dayjs
  }): Promise<Booking> {
    throw new Error('Method not implemented.')
  }
}
