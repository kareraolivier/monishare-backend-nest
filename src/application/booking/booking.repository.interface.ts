import { type Except } from 'type-fest'

import { type Transaction } from '../../persistence/database-connection.interface'
import { type CarID } from '../car'

import { type Booking, type BookingID, type BookingProperties } from './booking'

export abstract class IBookingRepository {
  public abstract get(tx: Transaction, id: BookingID): Promise<Booking>

  public abstract getAll(tx: Transaction): Promise<Booking[]>

  public abstract update(tx: Transaction, booking: Booking): Promise<Booking>

  public abstract findByCarId(
    tx: Transaction,
    carId: CarID,
  ): Promise<Booking[] | null>

  public abstract insert(
    tx: Transaction,
    booking: Except<BookingProperties, 'id'>,
  ): Promise<Booking>
}
