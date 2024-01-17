import dayjs from 'dayjs'

import { bookings } from '../../../jest.integration-test-setup'
import {
  CarRepositoryMock,
  mockBookingRepository,
  mockCarRepository,
  mockDatabaseConnection,
  type BookingRepositoryMock,
  type DatabaseConnectionMock,
} from '../../mocks'
import { UserID } from '../user'
import { UserBuilder } from '../user/user.builder'

import { type BookingID } from './booking'
import { BookingState } from './booking-state'
import { BookingBuilder } from './booking.builder'
import { BookingService } from './booking.service'

describe('BookingService', () => {
  let bookingService: BookingService
  let carRepositoryMock: CarRepositoryMock
  let bookingRepositoryMock: BookingRepositoryMock
  let databaseConnectionMock: DatabaseConnectionMock

  beforeEach(() => {
    carRepositoryMock = mockCarRepository()
    bookingRepositoryMock = mockBookingRepository()
    databaseConnectionMock = mockDatabaseConnection()

    bookingService = new BookingService(
      carRepositoryMock,
      bookingRepositoryMock,
      databaseConnectionMock,
    )
  })

  describe('Get All bookings', () => {
    it('it should get all bookings', async () => {
      const booking = new BookingBuilder().build()
      bookingRepositoryMock.getAll.mockResolvedValue([booking])
      const actual = await bookingService.getAll()
      expect(actual).toIncludeSameMembers(Object.values(bookings))
    })
  })

  describe.skip('Get single booking', () => {
    it('it should get single booking', async () => {
      const bookingId = 1 as BookingID
      const booking = new BookingBuilder().build()
      bookingRepositoryMock.get.mockResolvedValue(booking)
      const actual = await bookingService.get(bookingId, 1 as UserID)
      expect(actual).toEqual(bookings.beatrice)
    })
  })

  describe.skip('update', () => {
    xit('should update a booking', async () => {
      const renter = new UserBuilder().build()
      const booking = new BookingBuilder()
        .withRenter(renter)
        .withState(BookingState.PENDING)
        .build()
      const updatedBooking = BookingBuilder.from(booking)
        .withState(BookingState.ACCEPTED)
        .build()
      jest.spyOn(bookingRepositoryMock, 'get').mockResolvedValue(booking)
      jest
        .spyOn(bookingRepositoryMock, 'update')
        .mockResolvedValue(updatedBooking)

      await expect(
        bookingService.update(booking.id, { state: BookingState.ACCEPTED }),
      ).resolves.toEqual(updatedBooking)
    })
  })

  describe.skip('create', () => {
    xit('should create a booking', async () => {
      const user = new UserBuilder().build()
      const booking = new BookingBuilder()
        .withRenter(user.id)
        .withState(BookingState.PENDING)
        .build()
      console.log(booking)
      await expect(
        bookingService.create(booking, booking.renterId),
      ).resolves.toEqual({
        ...booking,
        startDate: dayjs('2024-02-08T14:07:27.828Z'),
        endDate: dayjs('2024-02-09T14:07:28.828Z'),
      })
    })
  })
})
