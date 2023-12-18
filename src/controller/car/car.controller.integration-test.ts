import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CarBuilder, UserBuilder } from '../../builders';
import {
  AuthenticationGuardMock,
  type CarServiceMock,
  mockCarService,
} from '../../mocks';
import { configureGlobalEnhancers } from '../../setup-app';
import { AuthenticationGuard } from '../authentication.guard';
import { CarController } from './car.controller';
import { FuelType } from '../../application';
import { CarState, ICarService } from '../../application/car';

describe('CarController', () => {
  const user = UserBuilder.from({ id: 2, name: 'peter' }).build();

  let app: INestApplication;
  let carServiceMock: CarServiceMock;
  let authenticationGuardMock: AuthenticationGuardMock;

  beforeEach(async () => {
    carServiceMock = mockCarService();
    authenticationGuardMock = new AuthenticationGuardMock(user);

    const moduleReference = await Test.createTestingModule({
      controllers: [CarController],
      providers: [
        {
          provide: ICarService, 
          useValue: carServiceMock,
        },
      ],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue(authenticationGuardMock)
      .compile();

    app = moduleReference.createNestApplication();
    await configureGlobalEnhancers(app).init();
  });

  afterEach(() => app.close());

  describe('create', () => {
    it('should create a new car', async () => {
      const newCar = CarBuilder.from({
        carTypeId:1,
        name:"blahblah",
        fuelType:FuelType.PETROL,
        horsepower:2,
        licensePlate:"kelvayi",
        info:"no smoking" 
           }).build();
      carServiceMock.create.mockResolvedValue(newCar);

      await request(app.getHttpServer())
        .post('/cars')
        .send({

        carTypeId:newCar.carTypeId,
        name:newCar.name,
        fuelType:newCar.fuelType,
        horsepower:newCar.horsepower,
        licensePlate:newCar.licensePlate,
        info:newCar.info
        })
        .expect(HttpStatus.CREATED)
        .expect({ ...newCar });

      expect(carServiceMock.create).toHaveBeenCalledWith({
        carTypeId:1,
        name:"blahblah",
        fuelType:FuelType.PETROL,
        horsepower:2,
        licensePlate:"kelvayi",
        info:"no smoking", 
        ownerId: 2,
        state: CarState.LOCKED,
      });
    });

    it('should return a 400 for a bad request', async () => {
      await request(app.getHttpServer())
        .post('/cars')
        .send({ 
            carTypeId:"1",
            name:"blahblah",
            fuelType:FuelType.PETROL,
            horsepower:2,
            licensePlate:"kelvayi",
            info:"no smoking" 
    
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

  });
});
