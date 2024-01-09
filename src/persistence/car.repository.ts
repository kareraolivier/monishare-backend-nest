import { Injectable } from '@nestjs/common'
import { type Except } from 'type-fest'

import {
  CarNotFoundError,
  Car,
  type CarID,
  type CarProperties,
  type CarState,
  type CarTypeID,
  type FuelType,
  type ICarRepository,
  type UserID,
} from '../application'

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

  public async findByLicensePlate(
    tx: Transaction,
    licensePlate: string,
  ): Promise<Car | null> {
    const rows = await tx.oneOrNone<Row>(
      'SELECT * FROM cars WHERE license_plate= $(licensePlate)',
      {
        licensePlate,
      },
    )
    return rows ? rowToDomain(rows) : null
  }

  public async update(tx: Transaction, car: Car): Promise<Car> {
    const row = await tx.oneOrNone<Row>(
      `
      UPDATE cars SET
        name = $(name),
        state = $(state),
        fuel_type= $(fuelType),
        horsepower= $(horsepower),
        license_plate= $(licensePlate),
        info= $(info)
      WHERE
        id = $(id)
       RETURNING *`,
      { ...car },
    )

    if (row === null) {
      throw new CarNotFoundError(car.id)
    }
    return rowToDomain(row)
  }

  public async insert(
    tx: Transaction,
    car: Except<CarProperties, 'id'>,
  ): Promise<Car> {
    const row = await tx.one<Row>(
      `
      INSERT INTO cars (
        car_type_id,
        owner_id,
        name,
        state,
        fuel_type,
        horsepower,
        license_plate,
        info  
      ) VALUES (
        $(carTypeId),
        $(ownerId),
        $(name),
        $(state),
        $(fuelType),
        $(horsepower),
        $(licensePlate),
        $(info)
      ) RETURNING *`,
      { ...car },
    )
    return rowToDomain(row)
  }
}
