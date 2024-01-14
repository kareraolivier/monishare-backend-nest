import { IsInt, IsPositive, IsNotEmpty, IsEnum } from 'class-validator'
import { IsDayjs } from 'class-validator-extended'
import { Dayjs } from 'dayjs'
import { type Opaque } from 'type-fest'

import { validate } from '../../util'
import { type CarID } from '../car'
import { UserID } from '../user'

import { BookingState } from './booking-state'

export type BookingID = Opaque<number, 'booking-id'>

export type BookingProperties = {
  id: BookingID
  carId: CarID
  renterId: UserID
  state: BookingState
  startDate: Dayjs
  endDate: Dayjs
}

export class Booking {
  @IsInt()
  @IsPositive()
  public readonly id: BookingID

  @IsInt()
  @IsPositive()
  public readonly carId: CarID

  @IsInt()
  @IsPositive()
  public readonly renterId: UserID

  @IsEnum(BookingState)
  public readonly state: BookingState
  @IsDayjs()
  @IsNotEmpty()
  public readonly startDate: Dayjs
  @IsDayjs()
  @IsNotEmpty()
  public readonly endDate: Dayjs

  public constructor(data: BookingProperties) {
    this.id = data.id
    this.carId = data.carId
    this.renterId = data.renterId
    this.state = data.state
    this.startDate = data.startDate
    this.endDate = data.endDate

    validate(this)
  }
}
