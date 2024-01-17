import {
  type CarRepositoryMock,
  type DatabaseConnectionMock,
  mockCarRepository,
  mockDatabaseConnection,
  BookingRepositoryMock,
  mockBookingRepository,
} from '../../mocks'
import { UserBuilder } from '../user/user.builder'

import { CarBuilder } from './car.builder'
import { CarService } from './car.service'

describe('CarService', () => {
  let carService: CarService
  let bookingRepositoryMock: BookingRepositoryMock
  let carRepositoryMock: CarRepositoryMock
  let databaseConnectionMock: DatabaseConnectionMock

  beforeEach(() => {
    bookingRepositoryMock = mockBookingRepository()
    carRepositoryMock = mockCarRepository()
    databaseConnectionMock = mockDatabaseConnection()

    carService = new CarService(
      bookingRepositoryMock,
      carRepositoryMock,
      databaseConnectionMock,
    )
  })

  describe.skip('update', () => {
    it('should update a car', async () => {
      const owner = new UserBuilder().build()
      const car = new CarBuilder().withOwner(owner).withHorsepower(50).build()
      const updatedCar = CarBuilder.from(car).withHorsepower(555).build()

      await expect(
        carService.update(car.id, { horsepower: 555 }, owner.id),
      ).resolves.toEqual(updatedCar)
    })
  })

  describe.skip('create', () => {
    it('should create a car', async () => {
      const owner = new UserBuilder().build()
      const car = new CarBuilder().withOwner(owner).build()
      const creatatedCar = CarBuilder.from(car).build()

      await expect(carService.create(car)).resolves.toEqual(creatatedCar)
    })
  })
})
