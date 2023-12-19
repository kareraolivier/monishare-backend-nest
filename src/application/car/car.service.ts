import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { type Except } from 'type-fest'

import { IDatabaseConnection } from '../../persistence/database-connection.interface'
import { type UserID } from '../user'

import { Car, type CarID, type CarProperties } from './car'
import { ICarRepository } from './car.repository.interface'
import { type ICarService } from './car.service.interface'
import { DuplicateLicensePlateError } from './error'

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

  //cheack duplicate lisence plate
  public async checkForDuplicateLicensePlate(
    _licensePlate: string,
  ): Promise<void> {
    const existingCar = await this.databaseConnection.transactional(tx =>
      this.carRepository.findByLicensePlate(tx, _licensePlate),
    )
    if (existingCar) {
      throw new DuplicateLicensePlateError('licensePlate exist')
    }
  }

  public async create(_data: Except<CarProperties, 'id'>): Promise<Car> {
    try {
      await this.checkForDuplicateLicensePlate(_data.licensePlate as string)
      return await this.databaseConnection.transactional(tx =>
        this.carRepository.insert(tx, _data),
      )
    } catch (error) {
      if (error instanceof DuplicateLicensePlateError) {
        throw new BadRequestException(
          'A car with this license plate already exists',
        )
      }
      throw new InternalServerErrorException(
        'Creating a car is not successfull',
      )
    }
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
    _carId: CarID,
    _updates: Partial<Except<CarProperties, 'id'>>,
    _currentUserId: UserID,
  ): Promise<Car> {
    return this.databaseConnection.transactional(async _tx => {
      const car = await this.carRepository.get(_tx, _carId)
      if (!car) throw new NotFoundException('car does not exist')
      if (_updates.licensePlate && car.licensePlate !== _updates.licensePlate)
        try {
          await this.checkForDuplicateLicensePlate(_updates.licensePlate)
        } catch (error) {
          if (error instanceof DuplicateLicensePlateError) {
            throw new BadRequestException(
              'A car with this license plate already exists',
            )
          }
          throw new InternalServerErrorException(
            'Update a car is not successfull',
          )
        }
      if (_currentUserId !== car.ownerId)
        throw new UnauthorizedException(
          'You are allowed to delete your own car',
        )
      const updatedCar = new Car({
        ...car,
        ..._updates,
        id: _carId,
      })

      return this.carRepository.update(_tx, updatedCar)
    })
  }
}
