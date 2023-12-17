import { Injectable } from '@nestjs/common'
import { type Except } from 'type-fest'

import {
  type CarID,
  type CarProperties,
  type CarState,
  type CarTypeID,
  type FuelType,
  type ICarRepository,
  type UserID,
} from '../application'
import { Car, CarNotFoundError } from '../application/car'

import { type Transaction } from './database-connection.interface'

type Row = {
  id: number
  car_type_id: number
  owner_id: number
  name: string
  state: string
  fuel_type: string
  horsepower: number
  license_plate: string | null
  info: string | null
}

function rowToDomain(row: Row): Car {
  return new Car({
    id: row.id as CarID,
    carTypeId: row.car_type_id as CarTypeID,
    ownerId: row.owner_id as UserID,
    state: row.state as CarState,
    name: row.name,
    fuelType: row.fuel_type as FuelType,
    horsepower: row.horsepower,
    licensePlate: row.license_plate,
    info: row.info,
  })
}

@Injectable()
export class CarRepository implements ICarRepository {
  public async find(tx: Transaction, id: CarID): Promise<Car | null> {
    const maybeRow = await tx.oneOrNone<Row>(
      'SELECT * FROM cars WHERE id = $(id)',
      { id },
    )

    return maybeRow ? rowToDomain(maybeRow) : null
  }

  public async get(tx: Transaction, id: CarID): Promise<Car> {
    const car = await this.find(tx, id)

    if (!car) throw new CarNotFoundError(id)

    return car
  }

  public async getAll(tx: Transaction): Promise<Car[]> {
    const rows = await tx.any<Row>('SELECT * FROM cars')

    return rows.map(row => rowToDomain(row))
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async findByLicensePlate(
    _tx: Transaction,
    _licensePlate: string,
  ): Promise<Car | null> {
    throw new Error('Not implemented')
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async update(_tx: Transaction, _car: Car): Promise<Car> {
    throw new Error('Not implemented')
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async insert(
    _tx: Transaction,
    _car: Except<CarProperties, 'id'>,
  ): Promise<Car> {
    throw new Error('Not implemented')
  }
}
