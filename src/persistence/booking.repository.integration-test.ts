import { type BookingID } from '../application'
import {
  setupIntegrationTest,
  bookings,
} from '../../jest.integration-test-setup'

import { BookingRepository } from './booking.repository'
import { NotFoundException } from '@nestjs/common'

describe('BookingRepository', () => {
  const { execute } = setupIntegrationTest()

  let bookingRepository: BookingRepository

  beforeEach(() => {
    bookingRepository = new BookingRepository()
  })
  describe('getAll', () => {
    it('should get all the bookings', async () => {
      const actual = await execute(tx => bookingRepository.getAll(tx))
      expect(actual).toIncludeSameMembers(Object.values(bookings))
    })
  })

  describe('get', () => {
    it('should return a specified booking', async () => {
      const actual = await execute(tx =>
        bookingRepository.get(tx, bookings.beatrice.id),
      )
      expect(actual).toEqual(bookings.beatrice)
    })

    xit('should throw if a booking does not exist', async () => {
      await expect(
        execute(tx => bookingRepository.get(tx, 99 as BookingID)),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
