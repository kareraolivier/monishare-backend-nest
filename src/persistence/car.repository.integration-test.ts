//After using all imports delete the following two lines
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { setupIntegrationTest, cars } from '../../jest.integration-test-setup'
import {
  CarNotFoundError,
  Car,
  type CarID,
  type CarProperties,
  CarState,
  type CarTypeID,
  FuelType,
  type ICarRepository,
  type UserID,
} from '../application'
import { CarRepository } from './car.repository'
import { type Transaction } from './database-connection.interface'

describe('CarRepository', () => {
  const { execute } = setupIntegrationTest()

  let carRepository: CarRepository

  beforeEach(() => {
    carRepository = new CarRepository()
  })

  //update repository tests
  describe('update', () => {
    it('should update a car ', async () => {
      const updated = {
        ...cars.izzedin,
        horsepower: 120,
        licensePlate: 'RA-12',
        info: 'no smoking',
      }
      const actual = await execute(_tx => carRepository.update(_tx, updated))

      expect(actual).toEqual(updated)
    })

    it('should throw if a car does not exist', async () => {
      const updated = {
        id: 2342 as CarID,
        name: `Izzi's Car`,
        carTypeId: 3 as CarTypeID,
        ownerId: 3 as UserID,
        state: CarState.LOCKED,
        fuelType: FuelType.PETROL,
        horsepower: 120,
        licensePlate: 'RA-12',
        info: 'no smoking',
      }
      await expect(
        execute(_tx => carRepository.update(_tx, updated)),
      ).rejects.toThrow(CarNotFoundError)
    })
  })
})
