import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsDateString, IsPositive } from 'class-validator'
import { Dayjs } from 'dayjs'
import { type Writable } from 'type-fest'

import {
  type Booking,
  type BookingID,
  BookingState,
  type CarID,
  type UserID,
} from '../../application'
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
    example: 'PENDING',
  })
  @IsEnum(BookingState)
  public readonly state!: BookingState

  @ApiProperty({
    description: 'The start date of booking.',
    type: 'string',
    example: '2024-02-08T14:07:27.828Z',
  })
  @IsDateString()
  public readonly startDate!: string

  @ApiProperty({
    description: 'The end date of booking.',
    type: 'string',
    example: '2024-02-09T14:07:28.828Z',
  })
  @IsDateString()
  public readonly endDate!: string

  public static create(data: {
    id: BookingID
    carId: CarID
    renterId: UserID
    state: BookingState
    startDate: Dayjs
    endDate: Dayjs
  }): BookingDTO {
    const instance = new BookingDTO() as Writable<BookingDTO>
    instance.id = data.id
    instance.carId = data.carId
    instance.renterId = data.renterId
    instance.state = data.state
    instance.startDate = data.startDate.toISOString()
    instance.endDate = data.endDate.toISOString()
    return validate(instance)
  }

  public static fromModel(booking: Booking): BookingDTO {
    return BookingDTO.create(booking)
  }
}

export class CreateBookingDTO extends PickType(BookingDTO, [
  'carId',
  'startDate',
  'endDate',
] as const) {}

export class PatchBookingDTO extends PartialType(
  PickType(BookingDTO, ['state'] as const),
) {}
