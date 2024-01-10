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
    it('should get all the bookings', async () => {
      const actual = await execute(tx => bookingRepository.getAll(tx))
      expect(actual).toEqual([bookings.beatrice])
    })
  })

  describe('get', () => {
    it('should return a specified booking', async () => {
      const actual = await execute(tx =>
        bookingRepository.get(tx, bookings.beatrice.id),
      )
      expect(actual).toEqual(bookings.beatrice)
    })
  })
})
