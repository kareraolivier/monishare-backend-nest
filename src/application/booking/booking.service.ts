import { Injectable, Logger } from '@nestjs/common'
import dayjs, { Dayjs } from 'dayjs'
import { Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { type CarID, ICarService } from '../car'
import { UserID } from '../user'

import { Booking, BookingID, BookingProperties } from './booking'
import { BookingState } from './booking-state'
import { IBookingRepository } from './booking.repository.interface'
import { type IBookingService } from './booking.service.interface'
import { BookingOverlapError, BookingYourOwnCarError } from './error'

@Injectable()
export class BookingService implements IBookingService {
  private readonly carService: ICarService
  private readonly bookingRepository: IBookingRepository
  private readonly databaseConnection: IDatabaseConnection
  private readonly logger: Logger

  public constructor(
    carService: ICarService,
    bookingRepository: IBookingRepository,
    databaseConnection: IDatabaseConnection,
  ) {
    this.carService = carService
    this.bookingRepository = bookingRepository
    this.databaseConnection = databaseConnection
    this.logger = new Logger(BookingService.name)
  }

  private async getOverlapBookings(
    carId: CarID,
    startDate: Dayjs,
    endDate: Dayjs,
  ) {
    return await this.databaseConnection.transactional(async tx => {
      const allBookings = await this.bookingRepository.findByCarId(tx, carId)
      const start = dayjs(startDate)
      const end = dayjs(endDate)
      const hasOverlap = allBookings?.some(
        booking =>
          start.isBefore(booking.endDate) && end.isAfter(booking.startDate),
      )
      if (hasOverlap) throw new BookingOverlapError(carId)
    })
  }

  private async checkCarOwner(carId: CarID, renterId: UserID): Promise<void> {
    const { ownerId } = await this.carService.get(carId)
    if (ownerId === renterId) throw new BookingYourOwnCarError(carId)
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

  public async create(
    data: Except<BookingProperties, 'id'>,
    renterId: UserID,
  ): Promise<Booking> {
    return await this.databaseConnection.transactional(async tx => {
      const { carId, startDate, endDate } = data
      await this.checkCarOwner(carId, renterId)
      await this.getOverlapBookings(carId, startDate, endDate)
      return this.bookingRepository.insert(tx, data)
    })
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
}
