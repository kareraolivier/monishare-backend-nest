import dayjs, { Dayjs } from 'dayjs'
import { type Except } from 'type-fest'

import { Car, type CarID } from '../car'
import { User, type UserID } from '../user'

import { Booking, type BookingID, type BookingProperties } from './booking'
import { BookingState } from './booking-state'

/**********************************************************************************************************************\
 *                                                                                                                     *
 *   This file is already fully implemented. You don't need to modify it to successfully finish your project.          *
 *                                                                                                                     *
 \*********************************************************************************************************************/

type UntaggedBookingProperties = Except<
  BookingProperties,
  'id' | 'carId' | 'renterId' | 'state' | 'startDate' | 'endDate'
> & {
  id: number
  carId: number
  renterId: number
  state: BookingState
  startDate: Dayjs
  endDate: Dayjs
}

export class BookingBuilder {
  private readonly properties: UntaggedBookingProperties = {
    id: 1 as BookingID,
    carId: 1 as CarID,
    renterId: 1 as UserID,
    state: BookingState.PENDING,
    startDate: dayjs('2024-02-08T14:07:27.828Z'),
    endDate: dayjs('2024-02-09T14:07:28.828Z'),
  }

  public static from(
    properties: Booking | Partial<UntaggedBookingProperties>,
  ): BookingBuilder {
    return new BookingBuilder().with(properties)
  }

  public with(properties: Partial<UntaggedBookingProperties>): this {
    let key: keyof UntaggedBookingProperties

    for (key in properties) {
      const value = properties[key]

      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.properties[key] = value
      }
    }

    return this
  }

  public withId(id: number): this {
    this.properties.id = id
    return this
  }

  public withCar(data: number | Car): this {
    this.properties.carId = typeof data === 'number' ? data : data.id
    return this
  }

  public withRenter(data: number | User): this {
    this.properties.renterId = typeof data === 'number' ? data : data.id
    return this
  }

  public withState(state: BookingState): this {
    this.properties.state = state
    return this
  }

  public withStartDate(startDate: Dayjs): this {
    this.properties.startDate = startDate
    return this
  }

  public withEndDate(endDate: Dayjs): this {
    this.properties.endDate = endDate
    return this
  }

  public build(): Booking {
    return new Booking({
      ...this.properties,
      id: this.properties.id as BookingID,
      carId: this.properties.carId as CarID,
      renterId: this.properties.renterId as UserID,
      state: this.properties.state as BookingState,
      startDate: this.properties.startDate,
      endDate: this.properties.endDate,
    })
  }
}
