import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserComponent } from './user.component';
import {
  AppointmentStateService,
  AppointmentsApiService,
  ClientsApiService,
} from '../../core/services';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        provideRouter([]),
        { provide: AppointmentsApiService, useValue: {} },
        { provide: ClientsApiService, useValue: { searchByPhone: () => of(null) } },
        {
          provide: AppointmentStateService,
          useValue: {
            getSelectedServices: () => [],
            getSelectedDate: () => null,
            getSelectedTime: () => null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
