import { Injectable } from '@nestjs/common'
import { Dayjs } from 'dayjs'
// import { type Except } from 'type-fest'

import {
  Booking,
  type BookingID,
  type BookingState,
  type CarID,
  type UserID,
} from '../application'

import { type Transaction } from './database-connection.interface'

type Row = {
  id: number
  car_id: number
  renter_id: number
  state: string
  start_date: Dayjs
  end_date: Dayjs
}

function rowToDomain(row: Row): Booking {
  return new Booking({
    id: row.id as BookingID,
    carId: row.car_id as CarID,
    renterId: row.renter_id as UserID,
    state: row.state as BookingState,
    startDate: row.start_date,
    endDate: row.end_date,
  })
}
@Injectable()
export class BookingRepository {
  public async getAll(tx: Transaction): Promise<Booking[]> {
    const rows = await tx.any<Row>('SELECT * FROM bookings')
    return rows.map(row => rowToDomain(row))
  }
  public async get(tx: Transaction, id: BookingID): Promise<Booking | null> {
    const maybeRow = await tx.oneOrNone<Row>(
      'SELECT * FROM bookings WHERE id = $(id)',
      { id },
    )
    return maybeRow ? rowToDomain(maybeRow) : null
  }
}
