import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { type Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { type UserID } from '../user'

import { Car, type CarID, type CarProperties } from './car'
import { ICarRepository } from './car.repository.interface'
import { type ICarService } from './car.service.interface'
import { DuplicateLicensePlateError, UnAuthorizedError } from './error'

@Injectable()
export class CarService implements ICarService {
  private readonly carRepository: ICarRepository
  private readonly databaseConnection: IDatabaseConnection
  private readonly logger: Logger

  public constructor(
    carRepository: ICarRepository,
    databaseConnection: IDatabaseConnection,
  ) {
    this.carRepository = carRepository
    this.databaseConnection = databaseConnection
    this.logger = new Logger(CarService.name)
  }

  //check duplicate lisence plate
  public async checkForDuplicateLicensePlate(licensePlate: string | null) {
    if (licensePlate === null) {
      throw new DuplicateLicensePlateError("License plate can't be null")
    }
    const existingCar = await this.databaseConnection.transactional(tx =>
      this.carRepository.findByLicensePlate(tx, licensePlate),
    )
    if (existingCar) {
      throw new DuplicateLicensePlateError(
        'A car with this license plate already exists',
      )
    }
  }

  public async create(_data: Except<CarProperties, 'id'>): Promise<Car> {
    await this.checkForDuplicateLicensePlate(_data.licensePlate)
    return await this.databaseConnection.transactional(tx =>
      this.carRepository.insert(tx, _data),
    )
  }

  public async getAll(): Promise<Car[]> {
    this.logger.verbose('Loading all cars')

    const result = this.databaseConnection.transactional(async tx => {
      const cars = await this.carRepository.getAll(tx)
      return cars
    })
    return result
  }

  public async get(id: CarID): Promise<Car> {
    this.logger.verbose(`Loading the car with id ${id}`)
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
      if (!car) throw new NotFoundException('car does not exist')
      if (updates.licensePlate && car.licensePlate !== updates.licensePlate)
        await this.checkForDuplicateLicensePlate(updates.licensePlate)
      if (currentUserId !== car.ownerId)
        throw new UnAuthorizedError(
          'You are not allowed to update a car which is not yours',
        )
      const updatedCar = new Car({
        ...car,
        ...updates,
        id: carId,
      })

      return this.carRepository.update(tx, updatedCar)
    })
  }
}
