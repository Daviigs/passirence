import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SchedulesComponent } from './schedules.component';
import {
  AppointmentStateService,
  AppointmentsApiService,
  ProfessionalsApiService,
} from '../../core/services';

describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulesComponent],
      providers: [
        provideRouter([]),
        {
          provide: AppointmentsApiService,
          useValue: {
            getAvailableDates: () => of([]),
            getAvailableTimes: () => of([]),
          },
        },
        {
          provide: ProfessionalsApiService,
          useValue: { getProfessionals: () => of([]) },
        },
        {
          provide: AppointmentStateService,
          useValue: {
            getSelectedServices: () => [],
            getSelectedProfessional: () => null,
            setSelectedDate: () => undefined,
            setSelectedTime: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
