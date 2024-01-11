import { Injectable, Logger } from '@nestjs/common'
import { Dayjs } from 'dayjs'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { CarID } from '../car'
import { UserID } from '../user'

import { Booking, BookingID } from './booking'
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
    return this.databaseConnection.transactional(
      async tx => await this.bookingRepository.getAll(tx),
    )
  }
  public async get(id: BookingID): Promise<Booking> {
    return this.databaseConnection.transactional(
      async tx => await this.bookingRepository.get(tx, id),
    )
  }

  /* eslint-disable @typescript-eslint/require-await */
  public update(
    _carId: BookingID,
    _updates: Partial<{
      carId: CarID
      state: BookingState
      renterId: UserID
      startDate: Dayjs
      endDate: Dayjs
    }>,
    _currentUserId: UserID,
  ): Promise<Booking> {
    throw new Error('Method not implemented.')
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
