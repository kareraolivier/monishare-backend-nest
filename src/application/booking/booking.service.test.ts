import dayjs from 'dayjs'

import {
  CarRepositoryMock,
  mockBookingRepository,
  mockCarRepository,
  mockDatabaseConnection,
  type BookingRepositoryMock,
  type DatabaseConnectionMock,
} from '../../mocks'
import { AccessDeniedError } from '../access-denied.error'
import { type CarID } from '../car'
import { CarBuilder } from '../car/car.builder'
import { type UserID } from '../user'

import { type BookingID } from './booking'
import { BookingState } from './booking-state'
import { BookingBuilder } from './booking.builder'
import { BookingService } from './booking.service'
import { BookingOverlapError, BookingOwnCarError } from './error'

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

  describe('Get all bookings', () => {
    it('should retrieve all bookings', async () => {
      const bookings = [
        new BookingBuilder().withId(1 as BookingID).build(),
        new BookingBuilder().withId(2 as BookingID).build(),
      ]
      bookingRepositoryMock.getAll.mockResolvedValue(bookings)
      const result = await bookingService.getAll()
      expect(result).toEqual(bookings)

      expect(bookingRepositoryMock.getAll).toHaveBeenCalledWith(
        expect.anything(),
      )
    })
  })

  describe('Get single booking', () => {
    it('it should get single booking', async () => {
      const bookingId = 1 as BookingID
      const userId = 1 as UserID
      const booking = new BookingBuilder().build()
      bookingRepositoryMock.get.mockResolvedValue(booking)
      const car = new CarBuilder().withOwner(userId).build()
      bookingRepositoryMock.get.mockResolvedValue(booking)

      carRepositoryMock.get.mockResolvedValue(car)
      const actual = await bookingService.get(bookingId, userId)
      expect(actual).toEqual(booking)
      expect(bookingRepositoryMock.get).toHaveBeenCalledWith(
        expect.anything(),
        bookingId,
      )
      expect(carRepositoryMock.get).toHaveBeenCalledWith(
        expect.anything(),
        booking.carId,
      )
    })

    it('should throw AccessDeniedError if user is neither the renter nor the car owner', async () => {
      const bookingId = 1 as BookingID
      const userId = 2 as UserID
      const booking = new BookingBuilder().withRenter(3 as UserID).build()
      const car = new CarBuilder().withOwner(4 as UserID).build()

      bookingRepositoryMock.get.mockResolvedValue(booking)
      carRepositoryMock.get.mockResolvedValue(car)

      await expect(bookingService.get(bookingId, userId)).rejects.toThrow(
        AccessDeniedError,
      )
      expect(bookingRepositoryMock.get).toHaveBeenCalledWith(
        expect.anything(),
        bookingId,
      )
      expect(carRepositoryMock.get).toHaveBeenCalledWith(
        expect.anything(),
        booking.carId,
      )
    })
  })

  describe('Update booking', () => {
    it('should allow valid state transitions', async () => {
      const bookingId = 1 as BookingID
      const transitions = [
        { from: BookingState.PENDING, to: BookingState.ACCEPTED },
        { from: BookingState.PENDING, to: BookingState.DECLINED },
        { from: BookingState.ACCEPTED, to: BookingState.PICKEDUP },
        { from: BookingState.PICKEDUP, to: BookingState.RETURNED },
      ]

      for (const { from, to } of transitions) {
        const originalBooking = new BookingBuilder()
          .withId(bookingId)
          .withState(from)
          .build()
        bookingRepositoryMock.get.mockResolvedValue(originalBooking)

        const updates = { state: to }
        const updatedBooking = { ...originalBooking, ...updates }
        bookingRepositoryMock.update.mockResolvedValue(updatedBooking)

        const result = await bookingService.update(bookingId, updates)
        expect(result).toEqual(updatedBooking)
      }
    })

    it('should throw AccessDeniedError for invalid state transitions', async () => {
      const bookingId = 1 as BookingID
      const invalidTransitions = [
        { from: BookingState.PENDING, to: BookingState.PICKEDUP },
      ]

      for (const { from, to } of invalidTransitions) {
        const originalBooking = new BookingBuilder()
          .withId(bookingId)
          .withState(from)
          .build()
        bookingRepositoryMock.get.mockResolvedValue(originalBooking)

        const updates = { state: to }

        await expect(bookingService.update(bookingId, updates)).rejects.toThrow(
          AccessDeniedError,
        )
        expect(bookingRepositoryMock.update).not.toHaveBeenCalled()
      }
    })
  })

  describe('Create booking', () => {
    it('should throw BookingOverlapError for overlapping bookings', async () => {
      const carId = 1 as CarID
      const renterId = 2 as UserID
      const bookingData = {
        carId: carId,
        renterId: renterId,
        state: BookingState.PENDING,
        startDate: dayjs('2024-04-01T14:07:27.828Z'),
        endDate: dayjs('2024-04-10T14:07:28.828Z'),
      }

      const car = new CarBuilder().withOwner(3 as UserID).build()
      const overlappingBooking = new BookingBuilder()
        .withCar(carId)
        .withStartDate(dayjs('2024-04-05T14:07:28.828Z'))
        .withEndDate(dayjs('2024-04-15T14:07:27.828Z'))
        .build()

      carRepositoryMock.get.mockResolvedValue(car)
      bookingRepositoryMock.findByCarId.mockResolvedValue([overlappingBooking])

      await expect(
        bookingService.create(bookingData, renterId),
      ).rejects.toThrow(BookingOverlapError)

      expect(bookingRepositoryMock.insert).not.toHaveBeenCalled()
      expect(bookingRepositoryMock.findByCarId).toHaveBeenCalledWith(
        expect.anything(),
        carId,
      )
    })

    it('should throw BookingOwnCarError if renter is the car owner', async () => {
      const carId = 1 as CarID
      const renterId = 1 as UserID
      const bookingData = {
        carId: carId,
        renterId: renterId,
        state: BookingState.PENDING,
        startDate: dayjs('2024-04-01T14:07:27.828Z'),
        endDate: dayjs('2024-04-10T14:07:28.828Z'),
      }

      const car = new CarBuilder().withOwner(renterId).build()

      carRepositoryMock.get.mockResolvedValue(car)

      await expect(
        bookingService.create(bookingData, renterId),
      ).rejects.toThrow(BookingOwnCarError)

      expect(bookingRepositoryMock.insert).not.toHaveBeenCalled()
    })
  })
})
