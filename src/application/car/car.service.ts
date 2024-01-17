import { Injectable, Logger } from '@nestjs/common'
import { type Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { Booking } from '../booking/booking'
import { BookingState } from '../booking/booking-state'
import { IBookingRepository } from '../booking/booking.repository.interface'
import { AccessDeniedError } from '../user'
import { type UserID } from '../user'

import { Car, type CarID, type CarProperties } from './car'
import { CarState } from './car-state'
import { ICarRepository } from './car.repository.interface'
import { type ICarService } from './car.service.interface'
import { DuplicateLicensePlateError } from './error'

@Injectable()
export class CarService implements ICarService {
  private readonly bookingRepository: IBookingRepository
  private readonly carRepository: ICarRepository
  private readonly databaseConnection: IDatabaseConnection
  private readonly logger: Logger

  public constructor(
    bookingRepository: IBookingRepository,
    carRepository: ICarRepository,
    databaseConnection: IDatabaseConnection,
  ) {
    this.bookingRepository = bookingRepository
    this.carRepository = carRepository
    this.databaseConnection = databaseConnection
    this.logger = new Logger(CarService.name)
  }

  private async checkForDuplicateLicensePlate(licensePlate: string) {
    const existingCar = await this.databaseConnection.transactional(tx =>
      this.carRepository.findByLicensePlate(tx, licensePlate),
    )
    if (existingCar) {
      throw new DuplicateLicensePlateError(licensePlate)
    }
  }
  public async getCarBookings(id: CarID): Promise<Booking[] | null> {
    return this.databaseConnection.transactional(tx =>
      this.bookingRepository.findByCarId(tx, id),
    )
  }
  public async create(data: Except<CarProperties, 'id'>): Promise<Car> {
    return await this.databaseConnection.transactional(async tx => {
      if (data.licensePlate)
        await this.checkForDuplicateLicensePlate(data.licensePlate)
      return this.carRepository.insert(tx, data)
    })
  }

  public async getAll(): Promise<Car[]> {
    const result = this.databaseConnection.transactional(async tx => {
      const cars = await this.carRepository.getAll(tx)
      return cars
    })
    return result
  }

  public async get(id: CarID): Promise<Car> {
    return this.databaseConnection.transactional(tx =>
      this.carRepository.get(tx, id),
    )
  }

  public async update(
    carId: CarID,
    updates: Partial<Except<CarProperties, 'id'>>,
    currentUserId: UserID,
  ): Promise<Car> {
    return this.databaseConnection.transactional(async tx => {
      const car = await this.carRepository.get(tx, carId)
      if (currentUserId !== car.ownerId) {
        const bookings = await this.getCarBookings(carId)
        const booking = bookings?.find(
          book => book.state === BookingState.PICKEDUP,
        )
        if (booking?.renterId == currentUserId) {
          return this.carRepository.update(tx, {
            ...car,
            state:
              car.state === CarState.LOCKED
                ? CarState.UNLOCKED
                : CarState.LOCKED,
          })
        }
        throw new AccessDeniedError(Car.name, carId)
      }
      if (
        typeof updates.licensePlate === 'string' &&
        car.licensePlate !== updates.licensePlate
      )
        await this.checkForDuplicateLicensePlate(updates.licensePlate)
      const updatedCar = new Car({
        ...car,
        ...updates,
        id: carId,
      })

      return this.carRepository.update(tx, updatedCar)
    })
  }
}
