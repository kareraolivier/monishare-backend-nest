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
      const expected = actual.map(booking => ({
        ...booking,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
      }))
      expect(expected).toEqual([
        {
          ...bookings.beatrice,
          startDate: bookings.beatrice.startDate.toISOString(),
          endDate: bookings.beatrice.endDate.toISOString(),
        },
      ])
    })
  })

  describe('get', () => {
    it('should return a specified booking', async () => {
      const actual = await execute(tx =>
        bookingRepository.get(tx, bookings.beatrice.id),
      )

      const expected = {
        ...actual,
        startDate: actual.startDate.toISOString(),
        endDate: actual.endDate.toISOString(),
      }
      expect(expected).toEqual({
        ...bookings.beatrice,
        startDate: bookings.beatrice.startDate.toISOString(),
        endDate: bookings.beatrice.endDate.toISOString(),
      })
    })
  })
})
