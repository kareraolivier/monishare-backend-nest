import dayjs from 'dayjs'

import {
  setupIntegrationTest,
  bookings,
  users,
} from '../../jest.integration-test-setup'
import { BookingID, BookingState, CarID, UserID } from '../application'
import { BookingNotFoundError } from '../application/booking/booking-not-found.error'

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

  describe('update', () => {
    it('should update a booking ', async () => {
      const updated = {
        ...bookings.beatrice,
      }
      const actual = await execute(tx => bookingRepository.update(tx, updated))
      expect(actual).toEqual(updated)
    })

    it('should throw if a booking does not exist', async () => {
      const updated = {
        id: 2 as BookingID,
        carId: 1 as CarID,
        renterId: users.izzedin.id,
        state: BookingState.PENDING,
        startDate: dayjs('2024-02-08T14:07:27.828Z'),
        endDate: dayjs('2024-02-09T14:07:28.828Z'),
      }
      await expect(
        execute(tx => bookingRepository.update(tx, updated)),
      ).rejects.toThrow(BookingNotFoundError)
    })
  })

  describe('create', () => {
    it('should create new booking', async () => {
      const create = {
        carId: 1 as CarID,
        renterId: 3 as UserID,
        state: BookingState.PENDING,
        startDate: dayjs('2024-02-08T14:07:27.828Z'),
        endDate: dayjs('2024-02-09T14:07:28.828Z'),
      }
      const actual = await execute(tx => bookingRepository.insert(tx, create))
      expect(actual).toEqual({ ...create, id: 2 as BookingID })
    })
  })
})
