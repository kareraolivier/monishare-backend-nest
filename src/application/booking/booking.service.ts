import { Injectable, Logger } from '@nestjs/common'
import dayjs, { Dayjs } from 'dayjs'
import { Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { type CarID, Car } from '../car/car'
import { ICarRepository } from '../car/car.repository.interface'
import { AccessDeniedError, type UserID } from '../user'

import { Booking, BookingID, BookingProperties } from './booking'
import { BookingState } from './booking-state'
import { IBookingRepository } from './booking.repository.interface'
import { type IBookingService } from './booking.service.interface'
import { BookingOverlapError, BookingYourOwnCarError } from './error'

@Injectable()
export class BookingService implements IBookingService {
  private readonly carRepository: ICarRepository
  private readonly bookingRepository: IBookingRepository
  private readonly databaseConnection: IDatabaseConnection
  private readonly logger: Logger

  public constructor(
    carRepository: ICarRepository,
    bookingRepository: IBookingRepository,
    databaseConnection: IDatabaseConnection,
  ) {
    this.carRepository = carRepository
    this.bookingRepository = bookingRepository
    this.databaseConnection = databaseConnection
    this.carRepository = carRepository
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
  private validateStateTransition(
    currentState: BookingState,
    newState: BookingState,
    bookingId: BookingID,
  ): void {
    const isValidTransition =
      (currentState === BookingState.PENDING &&
        [BookingState.ACCEPTED, BookingState.DECLINED].includes(newState)) ||
      (currentState === BookingState.ACCEPTED &&
        newState === BookingState.PICKEDUP) ||
      (currentState === BookingState.PICKEDUP &&
        newState === BookingState.RETURNED)

    if (!isValidTransition) {
      throw new AccessDeniedError(currentState, bookingId)
    }
  }

  private async checkCarOwner(carId: CarID): Promise<Car> {
    return this.databaseConnection.transactional(
      async tx => await this.carRepository.get(tx, carId),
    )
  }

  public async getAll(): Promise<Booking[]> {
    const result = this.databaseConnection.transactional(async tx => {
      const bookings = await this.bookingRepository.getAll(tx)
      return bookings
    })
    return result
  }
  public async get(id: BookingID, userId: UserID): Promise<Booking> {
    return this.databaseConnection.transactional(async tx => {
      const booking = await this.bookingRepository.get(tx, id)
      const { ownerId } = await this.checkCarOwner(booking.carId)
      if (booking.renterId !== userId && ownerId !== userId)
        throw new AccessDeniedError(Booking.name, id)
      return booking
    })
  }

  public async create(
    data: Except<BookingProperties, 'id'>,
    renterId: UserID,
  ): Promise<Booking> {
    return await this.databaseConnection.transactional(async tx => {
      const { carId, startDate, endDate } = data
      const { ownerId } = await this.checkCarOwner(carId)
      if (ownerId === renterId) throw new BookingYourOwnCarError(carId)
      await this.getOverlapBookings(carId, startDate, endDate)
      return this.bookingRepository.insert(tx, data)
    })
  }

  public async update(
    bookingId: BookingID,
    updates: Partial<Except<BookingProperties, 'id'>>,
  ): Promise<Booking> {
    return this.databaseConnection.transactional(async tx => {
      const booking = await this.bookingRepository.get(tx, bookingId)
      if (updates.state !== undefined) {
        this.validateStateTransition(booking.state, updates.state, bookingId)
      }
      const updatedBooking = new Booking({
        ...booking,
        ...updates,
        id: bookingId,
      })

      return this.bookingRepository.update(tx, updatedBooking)
    })
  }
}
