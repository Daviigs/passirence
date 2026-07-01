import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ServicesComponent } from './services.component';
import { AppointmentStateService, ServicesApiService } from '../../core/services';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        provideRouter([]),
        { provide: ServicesApiService, useValue: { getServices: () => of([]) } },
        {
          provide: AppointmentStateService,
          useValue: {
            getSelectedServices: () => [],
            setSelectedServices: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
