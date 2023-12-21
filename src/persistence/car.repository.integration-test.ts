import { setupIntegrationTest, cars } from '../../jest.integration-test-setup'
import {
  CarNotFoundError,
  type CarID,
  CarState,
  type CarTypeID,
  FuelType,
  type UserID,
} from '../application'

import { CarRepository } from './car.repository'

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
      const actual = await execute(tx => carRepository.update(tx, updated))

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
        execute(tx => carRepository.update(tx, updated)),
      ).rejects.toThrow(CarNotFoundError)
    })
  })
})
