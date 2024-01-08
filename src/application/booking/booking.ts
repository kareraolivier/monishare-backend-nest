import { IsInt, IsPositive, IsString, IsNotEmpty } from 'class-validator'
import { type Opaque } from 'type-fest'

import { type CarID } from '../car'

export type BookingID = Opaque<number, 'booking-id'>

export type BookingProperties = {
  id: BookingID
  carId: CarID
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

  @IsString()
  @IsNotEmpty()
  public readonly startDate: string

  @IsString()
  @IsNotEmpty()
  public readonly endDate: string

  public constructor(data: BookingProperties) {
    this.id = data.id
    this.carId = data.carId
    this.startDate = data.startDate
    this.endDate = data.endDate
  }
}
