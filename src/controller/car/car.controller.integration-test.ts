import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { ICarService } from '../../application'
import { CarBuilder, UserBuilder } from '../../builders'
import {
  AuthenticationGuardMock,
  type CarServiceMock,
  mockCarService,
} from '../../mocks'
import { configureGlobalEnhancers } from '../../setup-app'
import { AuthenticationGuard } from '../authentication.guard'

import { CarController } from './car.controller'

describe('CarController', () => {
  const user = UserBuilder.from({
    id: 42,
    name: 'peter',
  }).build()

  let app: INestApplication
  let carServiceMock: CarServiceMock
  let authenticationGuardMock: AuthenticationGuardMock

  beforeEach(async () => {
    carServiceMock = mockCarService()
    authenticationGuardMock = new AuthenticationGuardMock(user)

    const moduleReference = await Test.createTestingModule({
      controllers: [CarController],
      providers: [
        {
          provide: ICarService,
          useValue: carServiceMock,
        },
      ],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue(authenticationGuardMock)
      .compile()

    app = moduleReference.createNestApplication()

    await configureGlobalEnhancers(app).init()
  })

  afterEach(() => app.close())

  describe('update', () => {
    const carId = 3
    it('should get 404 not found when route is not right', async () => {
      await request(app.getHttpServer())
        .patch(`/car/${carId}`)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('should update a new car  if the user is an administrator', async () => {
      const carId = 42
      const newUpdatedCar = new CarBuilder().withId(carId).build()
      carServiceMock.update.mockResolvedValue(newUpdatedCar)

      authenticationGuardMock.user = UserBuilder.from(user).build()

      await request(app.getHttpServer())
        .patch(`/cars/${carId}`)
        .send({
          ...newUpdatedCar,
          name: newUpdatedCar.name,
          horsepower: newUpdatedCar.horsepower,
          licensePlate: newUpdatedCar.licensePlate,
          info: newUpdatedCar.info,
        })
        .expect(HttpStatus.OK)
        .expect({ ...newUpdatedCar })

      expect(carServiceMock.update).toHaveBeenCalledWith(
        carId,
        newUpdatedCar,
        carId,
      )
    })
  })
})
