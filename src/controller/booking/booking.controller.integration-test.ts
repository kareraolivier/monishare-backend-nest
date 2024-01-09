import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IBookingService } from '../../application'
import { UserBuilder } from '../../builders'
import {
  AuthenticationGuardMock,
  type BookingServiceMock,
  mockBookingService,
} from '../../mocks'
import { configureGlobalEnhancers } from '../../setup-app'
import { AuthenticationGuard } from '../authentication.guard'

import { BookingController } from './booking.controller'

describe('bookingController', () => {
  const user = UserBuilder.from({
    id: 42,
    name: 'peter',
  }).build()

  let app: INestApplication
  let bookingServiceMock: BookingServiceMock
  let authenticationGuardMock: AuthenticationGuardMock

  beforeEach(async () => {
    bookingServiceMock = mockBookingService()
    authenticationGuardMock = new AuthenticationGuardMock(user)

    const moduleReference = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: IBookingService,
          useValue: bookingServiceMock,
        },
      ],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue(authenticationGuardMock)
      .compile()
    app = moduleReference.createNestApplication()

    await configureGlobalEnhancers(app).init()
  })

  it('should get 404 not found when route is not exist', async () => {
    await request(app.getHttpServer())
      .patch(`/bookings`)
      .expect(HttpStatus.NOT_FOUND)
  })
})
