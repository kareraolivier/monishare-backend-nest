import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { Except } from 'type-fest'

import {
  Booking,
  BookingProperties,
  type BookingID,
  type BookingState,
  type CarID,
  type UserID,
} from '../application'
import { BookingNotFoundError } from '../application/booking/booking-not-found.error'

import { type Transaction } from './database-connection.interface'

type Row = {
  id: number
  car_id: number
  renter_id: number
  state: string
  start_date: Date
  end_date: Date
}

function rowToDomain(row: Row): Booking {
  return new Booking({
    id: row.id as BookingID,
    carId: row.car_id as CarID,
    renterId: row.renter_id as UserID,
    state: row.state as BookingState,
    startDate: dayjs(row.start_date),
    endDate: dayjs(row.end_date),
  })
}
@Injectable()
export class BookingRepository {
  public async findByCarId(
    tx: Transaction,
    carId: CarID,
  ): Promise<Booking[] | null> {
    const rows = await tx.manyOrNone<Row>(
      'SELECT * FROM bookings WHERE car_id= $(carId)',
      {
        carId,
      },
    )
    return rows ? rows.map(row => rowToDomain(row)) : null
  }

  public async find(tx: Transaction, id: BookingID): Promise<Booking | null> {
    const maybeRow = await tx.oneOrNone<Row>(
      'SELECT * FROM bookings WHERE id = $(id)',
      { id },
    )
    return maybeRow ? rowToDomain(maybeRow) : null
  }

  public async getAll(tx: Transaction): Promise<Booking[]> {
    const rows = await tx.any<Row>('SELECT * FROM bookings')
    return rows.map(row => rowToDomain(row))
  }

  public async get(tx: Transaction, id: BookingID): Promise<Booking> {
    const booking = await this.find(tx, id)
    if (!booking) throw new BookingNotFoundError(id)
    return booking
  }

  public async insert(
    tx: Transaction,
    booking: Except<BookingProperties, 'id'>,
  ): Promise<Booking> {
    const row = await tx.one<Row>(
      `
      INSERT INTO bookings (
        car_id,
        renter_id,
        state,
        start_date,
        end_date
      ) VALUES (
        $(carId),
        $(renterId),
        $(state),
        $(startDate),
        $(endDate)
      ) RETURNING *`,
      { ...booking },
    )
    return rowToDomain(row)
  }
}
