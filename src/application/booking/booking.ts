import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator'
import { type Opaque } from 'type-fest'

import { type CarID } from '../car'
import { UserID } from '../user'

import { BookingState } from './booking-state'

export type BookingID = Opaque<number, 'booking-id'>

export type BookingProperties = {
  id: BookingID
  carId: CarID
  state: BookingState
  renterId: UserID
  startDate: string
  endDate: string
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

  @IsString()
  @IsNotEmpty()
  public readonly startDate: string

  @IsString()
  @IsNotEmpty()
  public readonly endDate: string

  public constructor(data: BookingProperties) {
    this.id = data.id
    this.carId = data.carId
    this.renterId = data.renterId
    this.state = data.state
    this.startDate = data.startDate
    this.endDate = data.endDate
  }
}
