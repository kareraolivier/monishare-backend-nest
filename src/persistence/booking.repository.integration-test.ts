import {
  setupIntegrationTest,
  bookings,
} from '../../jest.integration-test-setup'

import { BookingRepository } from './booking.repository'

describe('BookingRepository', () => {
  const { execute } = setupIntegrationTest()

  let bookingRepository: BookingRepository

  beforeEach(() => {
    bookingRepository = new BookingRepository()
  })

  describe('getAll', () => {
    xit('should get all the bookings', async () => {
      const actual = await execute(tx => bookingRepository.getAll(tx))
      expect(actual).toEqual(bookings)
    })
  })
})
