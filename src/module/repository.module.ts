import { Module } from '@nestjs/common'

import {
  IBookingRepository,
  ICarRepository,
  ICarTypeRepository,
  IUserRepository,
} from '../application'
import {
  BookingRepository,
  CarRepository,
  CarTypeRepository,
  UserRepository,
} from '../persistence'

@Module({
  providers: [
    {
      provide: ICarRepository,
      useClass: CarRepository,
    },
    {
      provide: ICarTypeRepository,
      useClass: CarTypeRepository,
    },
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
    {
      provide: IBookingRepository,
      useClass: BookingRepository,
    },
  ],
  exports: [
    ICarRepository,
    ICarTypeRepository,
    IUserRepository,
    IBookingRepository,
  ],
})
export class RepositoryModule {}
