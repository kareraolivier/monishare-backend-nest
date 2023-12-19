import {
  Injectable,
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

  public async create(_data: Except<CarProperties, 'id'>): Promise<Car> {
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
    _carId: CarID,
    _updates: Partial<Except<CarProperties, 'id'>>,
    _currentUserId: UserID,
  ): Promise<Car> {
    return this.databaseConnection.transactional(async _tx => {
      const car = await this.carRepository.get(_tx, _carId)
      if (!car) throw new NotFoundException('car does not exist')
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
