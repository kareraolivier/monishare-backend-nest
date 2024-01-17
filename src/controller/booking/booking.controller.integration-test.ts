import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import dayjs from 'dayjs'
import request from 'supertest'

import {
  type BookingID,
  BookingState,
  type CarID,
  IBookingService,
  type UserID,
} from '../../application'
import { UserBuilder, BookingBuilder } from '../../builders'
import {
  AuthenticationGuardMock,
  mockBookingService,
  type BookingServiceMock,
} from '../../mocks'
import { configureGlobalEnhancers } from '../../setup-app'
import { AuthenticationGuard } from '../authentication.guard'

import { BookingController } from './booking.controller'

describe('bookingController', () => {
  const user = UserBuilder.from({
    id: 42,
    name: 'peter',
  }).build()

  const bookingOne = BookingBuilder.from({
    id: 2 as BookingID,
    carId: 1 as CarID,
    renterId: 42 as UserID,
    state: BookingState.PENDING,
    startDate: dayjs('2024-01-08T14:07:27.828Z'),
    endDate: dayjs('2024-01-09T07:20:56.959Z'),
  }).build()

  const bookingTwo = BookingBuilder.from({
    id: 1 as BookingID,
    carId: 1 as CarID,
    renterId: 42 as UserID,
    state: BookingState.PENDING,
    startDate: dayjs('2024-02-08T14:07:27.828Z'),
    endDate: dayjs('2024-02-09T07:20:56.959Z'),
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

  afterEach(() => app.close())

  describe('getAll', () => {
    xit('should return all existing bookings', async () => {
      bookingServiceMock.getAll.mockResolvedValue([bookingOne, bookingTwo])

      await request(app.getHttpServer())
        .get('/bookings')
        .expect(HttpStatus.OK)
        .expect([
          {
            id: 2,
            carId: 1,
            renterId: 42,
            state: 'PENDING',
            startDate: '2024-01-08T14:07:27.828Z',
            endDate: '2024-01-09T07:20:56.959Z',
          },
          {
            id: 1,
            carId: 1,
            renterId: 42,
            state: 'PENDING',
            startDate: '2024-02-08T14:07:27.828Z',
            endDate: '2024-02-09T07:20:56.959Z',
          },
        ])
    })
  })

  describe('get', () => {
    xit('should return single booking', async () => {
      const bookingId = 1
      bookingServiceMock.get.mockResolvedValue(bookingTwo)

      await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .expect(HttpStatus.OK)
        .expect({
          id: 1,
          carId: 1,
          renterId: 42,
          state: 'PENDING',
          startDate: '2024-02-08T14:07:27.828Z',
          endDate: '2024-02-09T07:20:56.959Z',
        })
    })
    xit('should return bad request if id is undefined', async () => {
      bookingServiceMock.get.mockResolvedValue(bookingTwo)

      await request(app.getHttpServer())
        .get('/bookings/undefined')
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('create', () => {
    it('should fail if the user book his/her car', async () => {
      const booking = new BookingBuilder().withRenter(1).build()
      bookingServiceMock.create.mockResolvedValue(booking)
      authenticationGuardMock.user = UserBuilder.from(user).build()
      await request(app.getHttpServer())
        .post(`/bookings`)
        .send({
          carId: booking.carId,
          startDate: booking.startDate,
          endDate: booking.endDate,
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          ...booking,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
        })
      expect(bookingServiceMock.create).not.toHaveBeenCalled()
    })

    xit('should create a new booking', async () => {
      const booking = new BookingBuilder().withRenter(42).build()
      bookingServiceMock.create.mockResolvedValue(booking)
      authenticationGuardMock.user = UserBuilder.from(user).build()

      await request(app.getHttpServer())
        .post(`/bookings`)
        .send({
          carId: booking.carId,
          startDate: booking.startDate,
          endDate: booking.endDate,
        })
        .expect(HttpStatus.CREATED)
        .expect({
          id: booking.id,
          carId: booking.carId,
          renterId: booking.renterId,
          state: booking.state,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
        })

      expect(bookingServiceMock.create).toHaveBeenCalledWith(
        {
          carId: booking.carId,
          renterId: booking.renterId,
          state: booking.state,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
        },
        user.id,
      )
    })
  })

  xit('should get 404 not found when route does not exist', async () => {
    await request(app.getHttpServer())
      .get(`/booking`)
      .expect(HttpStatus.NOT_FOUND)
  })

  describe('update', () => {
    const bookingId = 3
    xit('should get 404 not found when route is not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/booking/${bookingId}`)
        .expect(HttpStatus.NOT_FOUND)
    })

    xit('should update a new booking', async () => {
      const bookingId = 42
      const newUpdatedBooking = new BookingBuilder().withId(bookingId).build()
      bookingServiceMock.update.mockResolvedValue(newUpdatedBooking)

      authenticationGuardMock.user = UserBuilder.from(user).build()

      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}`)
        .send({
          ...newUpdatedBooking,
        })
        .expect(HttpStatus.OK)
        .expect({ ...newUpdatedBooking })

      expect(bookingServiceMock.update).toHaveBeenCalledWith(
        bookingId,
        newUpdatedBooking,
        bookingId,
      )
    })
  })
})
