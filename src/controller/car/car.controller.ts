import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import {
  Car,
  type CarID,
  ICarService,
  type User,
  CarState,
} from '../../application'
import {
  DuplicateLicensePlateError,
  UnAuthorizedError,
} from '../../application/car/error'
import { AuthenticationGuard } from '../authentication.guard'
import { CurrentUser } from '../current-user.decorator'

import { CarDTO, CreateCarDTO, PatchCarDTO } from './car.dto'

@ApiTags(Car.name)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'The request was not authorized because the JWT was missing, expired or otherwise invalid.',
})
@ApiInternalServerErrorResponse({
  description: 'An internal server error occurred.',
})
@UseGuards(AuthenticationGuard)
@Controller('/cars')
export class CarController {
  private readonly carService: ICarService

  public constructor(carService: ICarService) {
    this.carService = carService
  }

  @ApiOperation({
    summary: 'Retrieve all cars.',
  })
  @ApiOkResponse({
    description: 'The request was successful',
    type: [CarDTO],
  })
  @Get()
  public async getAll(): Promise<CarDTO[]> {
    const cars = await this.carService.getAll()

    return cars.map(car => CarDTO.fromModel(car))
  }

  @ApiOperation({
    summary: 'Retrieve a specific car.',
  })
  @ApiOkResponse({
    description: 'The request was successful.',
    type: CarDTO,
  })
  @ApiBadRequestResponse({
    description:
      'The request was malformed, e.g. missing or invalid parameter or property in the request body.',
  })
  @ApiNotFoundResponse({
    description: 'No car with the given id was found.',
  })
  @Get(':id')
  public async get(@Param('id', ParseIntPipe) id: CarID): Promise<CarDTO> {
    const car = await this.carService.get(id)

    return CarDTO.fromModel(car)
  }

  @ApiOperation({
    summary: 'Create a new car.',
  })
  @ApiCreatedResponse({
    description: 'A new car was created.',
  })
  @ApiBadRequestResponse({
    description:
      'The request was malformed, e.g. missing or invalid parameter or property in the request body.',
  })
  @ApiConflictResponse({
    description: 'A car with the given license plate already exists.',
  })
  @Post()
  public async create(
    @CurrentUser() _owner: User,
    @Body() _data: CreateCarDTO,
  ): Promise<CarDTO> {
    try {
      const augmentedData = {
        ..._data,
        ownerId: _owner.id,
        state: CarState.LOCKED,
      }
      const createdCar = await this.carService.create(augmentedData)
      return CarDTO.fromModel(createdCar)
    } catch (error) {
      if (error instanceof DuplicateLicensePlateError) {
        throw new BadRequestException(error)
      }
      throw new InternalServerErrorException(
        'Creating a car is not successfull',
      )
    }
  }

  @ApiOperation({
    summary: 'Update an existing car.',
  })
  @ApiOkResponse({
    description: 'The car was updated.',
  })
  @ApiBadRequestResponse({
    description:
      'The request was malformed, e.g. missing or invalid parameter or property in the request body.',
  })
  @ApiNotFoundResponse({
    description: 'No car with the given id was found.',
  })
  @Patch(':id')
  public async patch(
    @CurrentUser() _user: User,
    @Param('id', ParseIntPipe) carId: CarID,
    @Body() _data: PatchCarDTO,
  ): Promise<CarDTO> {
    try {
      const car = await this.carService.update(carId, _data, _user.id)
      return CarDTO.fromModel(car)
    } catch (error) {
      if (error instanceof DuplicateLicensePlateError) {
        throw new BadRequestException(error)
      }
      if (error instanceof UnAuthorizedError) {
        throw new UnauthorizedException(error.message)
      }
      throw new InternalServerErrorException(
        'Updating a car is not successfull',
      )
    }
  }
}
