import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNotEmpty, IsPositive } from 'class-validator'
import { type Writable } from 'type-fest'

import {
  type Booking,
  type BookingID,
  BookingState,
  type CarID,
  type UserID,
} from 'src/application'

import { validate } from '../../util'

export class BookingDTO {
  @ApiProperty({
    description: 'The id of the booking.',
    type: 'integer',
    minimum: 1,
    example: 2,
    readOnly: true,
  })
  @IsInt()
  @IsPositive()
  public readonly id!: BookingID

  @ApiProperty({
    description: 'The id of the car',
    type: 'integer',
    minimum: 1,
    example: 2,
  })
  @IsInt()
  @IsPositive()
  public readonly carId!: CarID

  @ApiProperty({
    description: 'The id of the user who rented the car.',
    type: 'integer',
    minimum: 1,
    example: 3,
  })
  @IsInt()
  @IsPositive()
  public readonly renterId!: UserID

  @ApiProperty({
    description: 'The current state of the booking.',
    enum: BookingState,
    example: BookingState.PENDING,
  })
  @IsEnum(BookingState)
  public readonly state!: BookingState

  @ApiProperty({
    description: 'The start date of booking.',
    type: String,
    nullable: true,
  })
  @IsNotEmpty()
  public readonly startDate!: string

  @ApiProperty({
    description: 'The end date of booking.',
    type: String,
    nullable: true,
  })
  @IsNotEmpty()
  public readonly endDate!: string

  public static create(data: {
    id: BookingID
    carId: CarID
    renterId: UserID
    state: BookingState
    startDate: string
    endDate: string
  }): BookingDTO {
    const instance = new BookingDTO() as Writable<BookingDTO>
    instance.id = data.id
    instance.carId = data.carId
    instance.renterId = data.renterId
    instance.state = data.state
    instance.startDate = data.startDate
    instance.endDate = data.endDate
    return validate(instance)
  }

  public static fromModel(booking: Booking): BookingDTO {
    return BookingDTO.create(booking)
  }
}

export class CreateBookingDTO extends PickType(BookingDTO, [
  'carId',
  'renterId',
  'state',
  'startDate',
  'endDate',
] as const) {}

export class PatchBookingDTO extends PartialType(
  PickType(BookingDTO, ['state'] as const),
) {}
