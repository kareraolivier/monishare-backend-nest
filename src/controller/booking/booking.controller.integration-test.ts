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
  BookingOwnCarError,
  BookingOverlapError,
  BookingStateTransitionError,
} from '../../application'
import { UserBuilder, BookingBuilder } from '../../builders'
import {
  AuthenticationGuardMock,
  mockBookingService,
  type BookingServiceMock,
} from '../../mocks'
import { configureGlobalEnhancers } from '../../setup-app'
import { ValidationError } from '../../util'
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

  it('should get 404 not found when route does not exist', async () => {
    await request(app.getHttpServer())
      .get(`/booking`)
      .expect(HttpStatus.NOT_FOUND)
  })

  describe('getAll', () => {
    it('should return all existing bookings', async () => {
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
    it('should return single booking', async () => {
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
    it('should return bad request if id is undefined', async () => {
      bookingServiceMock.get.mockResolvedValue(bookingTwo)

      await request(app.getHttpServer())
        .get('/bookings/undefined')
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('create', () => {
    it('should create a new booking', async () => {
      const user = UserBuilder.from({ id: 42 }).build()
      const bookingData = {
        carId: 1,
        startDate: dayjs('2024-04-01T14:07:27.828Z'),
        endDate: dayjs('2024-04-10T14:07:28.828Z'),
      }
      const booking = new BookingBuilder()
        .withRenter(user.id)
        .withCar(bookingData.carId)
        .withStartDate(bookingData.startDate)
        .withEndDate(bookingData.endDate)
        .withState(BookingState.PENDING)
        .build()

      bookingServiceMock.create.mockResolvedValue(booking)
      authenticationGuardMock.user = user

      await request(app.getHttpServer())
        .post(`/bookings`)
        .send(bookingData)
        .expect(HttpStatus.CREATED)

      expect(bookingServiceMock.create).toHaveBeenCalledWith(
        {
          ...bookingData,
          state: BookingState.PENDING,
          renterId: user.id,
        },
        user.id,
      )
    })

    it('should handle BookingOwnCarError', async () => {
      const user = UserBuilder.from({ id: 42 }).build()
      const bookingData = {
        id: 1,
        carId: 1,
        renterId: 42,
        state: 'PENDING',
      }

      bookingServiceMock.create.mockRejectedValue(
        new BookingOwnCarError(bookingData.carId as CarID),
      )
      authenticationGuardMock.user = user

      await request(app.getHttpServer())
        .post(`/bookings`)
        .send(bookingData)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should handle ValidationError', async () => {
      const user = UserBuilder.from({ id: 42 }).build()
      const invalidBookingData = {
        carId: -1,
        startDate: dayjs('2024-05-01T14:07:27.828Z'),
        endDate: dayjs('2024-04-10T14:07:28.828Z'),
      }

      bookingServiceMock.create.mockRejectedValue(
        new ValidationError('Invalid booking data'),
      )
      authenticationGuardMock.user = user

      await request(app.getHttpServer())
        .post(`/bookings`)
        .send(invalidBookingData)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should handle BookingOverlapError', async () => {
      const user = UserBuilder.from({ id: 42 }).build()
      const overlappingBookingData = {
        carId: 1,
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-10').toISOString(),
      }

      bookingServiceMock.create.mockRejectedValue(
        new BookingOverlapError(1 as CarID),
      )
      authenticationGuardMock.user = user

      await request(app.getHttpServer())
        .post(`/bookings`)
        .send(overlappingBookingData)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('update', () => {
    it('should successfully update a booking', async () => {
      const user = UserBuilder.from({ id: 42 }).build()
      const bookingId = 1
      const patchData = { state: BookingState.ACCEPTED }
      const updatedBooking = new BookingBuilder().withId(bookingId).build()

      bookingServiceMock.update.mockResolvedValue(updatedBooking)

      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}`)
        .send(patchData)
        .expect(HttpStatus.OK)

      expect(bookingServiceMock.update).toHaveBeenCalledWith(
        bookingId,
        patchData,
        user.id,
      )
    })

    it('should handle BookingStateTransitionError', async () => {
      const bookingId = 1
      const patchData = { state: BookingState.ACCEPTED }

      bookingServiceMock.update.mockRejectedValue(
        new BookingStateTransitionError(bookingId as BookingID),
      )
      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}`)
        .send(patchData)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })
})
