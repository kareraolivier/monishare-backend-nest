import {
  type BookingRepositoryMock,
  type DatabaseConnectionMock,
  mockBookingRepository,
  mockDatabaseConnection,
} from '../../mocks'
import { UserBuilder } from '../user/user.builder'

import { BookingState } from './booking-state'
import { BookingBuilder } from './booking.builder'
import { BookingService } from './booking.service'

describe('BookingService', () => {
  let bookingService: BookingService
  let bookingRepositoryMock: BookingRepositoryMock
  let databaseConnectionMock: DatabaseConnectionMock

  beforeEach(() => {
    bookingRepositoryMock = mockBookingRepository()
    databaseConnectionMock = mockDatabaseConnection()

    bookingService = new BookingService(
      bookingRepositoryMock,
      databaseConnectionMock,
    )
  })

  describe('update', () => {
    xit('should update a booking', async () => {
      const renter = new UserBuilder().build()
      const booking = new BookingBuilder()
        .withRenter(renter)
        .withState(BookingState.ACCEPTED)
        .build()
      const updatedBooking = BookingBuilder.from(booking)
        .withState(BookingState.ACCEPTED)
        .build()
      jest.spyOn(bookingRepositoryMock, 'get').mockResolvedValue(booking)
      jest
        .spyOn(bookingRepositoryMock, 'update')
        .mockResolvedValue(updatedBooking)

      await expect(
        bookingService.update(
          booking.id,
          { state: BookingState.ACCEPTED },
          renter.id,
        ),
      ).resolves.toEqual(updatedBooking)
    })
  })
})
