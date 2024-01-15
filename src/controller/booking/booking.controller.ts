import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import {
  type BookingID,
  IBookingService,
  Booking,
  type User,
  BookingState,
  BookingOverlapError,
  BookingYourOwnCarError,
  UserID,
  AccessDeniedError,
} from '../../application'
import { ValidationError } from '../../util'
import { AuthenticationGuard } from '../authentication.guard'
import { CurrentUser } from '../current-user.decorator'

import { BookingDTO, CreateBookingDTO } from './booking.dto'

@ApiTags(Booking.name)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'The request was not authorized because the JWT was missing, expired or otherwise invalid.',
})
@ApiInternalServerErrorResponse({
  description: 'An internal server error occurred.',
})
@UseGuards(AuthenticationGuard)
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
    @CurrentUser() user: User,
  ): Promise<BookingDTO> {
    try {
      if (!id) throw new BadRequestException('Invalid booking ID.')

      const booking = await this.bookingService.get(id, user.id)
      return BookingDTO.fromModel(booking)
    } catch (error) {
      if (error instanceof AccessDeniedError)
        throw new UnauthorizedException(
          'You are not allowed to access this information',
        )
      throw error
    }
  }

  @ApiOperation({
    summary: 'Create a new booking.',
  })
  @ApiCreatedResponse({
    description: 'A new booking was created.',
  })
  @ApiBadRequestResponse({
    description: 'The request was malformed check again',
  })
  @ApiConflictResponse({
    description: 'The booking is not successfull.',
  })
  @Post()
  public async create(
    @CurrentUser() renter: User,
    @Body() data: CreateBookingDTO,
  ): Promise<BookingDTO> {
    try {
      const bookingData = {
        ...data,
        state: BookingState.PENDING,
        renterId: renter.id,
      }
      const createdBooking = await this.bookingService.create(
        bookingData,
        renter.id,
      )
      return BookingDTO.fromModel(createdBooking)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message)
      }
      if (error instanceof BookingYourOwnCarError) {
        throw new BadRequestException(error.message)
      }
      if (error instanceof BookingOverlapError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }
  }
}
