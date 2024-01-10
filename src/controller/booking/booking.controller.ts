import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger'

import { type BookingID, IBookingService } from '../../application'

import { BookingDTO } from './booking.dto'

@Controller('bookings')
export class BookingController {
  private readonly bookingService: IBookingService

  public constructor(bookingService: IBookingService) {
    this.bookingService = bookingService
  }

  @ApiOperation({
    summary: 'Retrieve all bookings.',
  })
  @ApiOkResponse({
    description: 'The request was successful',
    type: [BookingDTO],
  })
  @Get()
  public async getAll(): Promise<BookingDTO[]> {
    const bookings = await this.bookingService.getAll()
    return bookings.map(booking => BookingDTO.fromModel(booking))
  }

  @ApiOperation({
    summary: 'Retrieve a specific booking.',
  })
  @ApiOkResponse({
    description: 'The request was successful.',
    type: BookingDTO,
  })
  @ApiBadRequestResponse({
    description:
      'The request was malformed, e.g. missing or invalid parameter or property in the request body.',
  })
  @ApiNotFoundResponse({
    description: 'No booking with the given id was found.',
  })
  @Get(':id')
  public async get(
    @Param('id', ParseIntPipe) id: BookingID,
  ): Promise<BookingDTO> {
    const booking = await this.bookingService.get(id)
    if (!booking)
      throw new NotFoundException(`No booking with id ${id} was found.`)
    return BookingDTO.fromModel(booking)
  }
}
