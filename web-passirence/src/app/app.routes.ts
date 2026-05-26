import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
	{
		path: '',
		component: Home,
		pathMatch: 'full',
	},
	{
		path: 'services',
		loadComponent: () =>
			import('./features/services/services.component').then((m) => m.ServicesComponent),
	},
	{
		path: 'professionals',
		loadComponent: () =>
			import('./features/professionals/professionals.component').then((m) => m.ProfessionalsComponent),
	},
	{
		path: 'schedules',
		loadComponent: () =>
			import('./features/schedules/schedules.component').then((m) => m.SchedulesComponent),
	},
	{
		path: 'user',
		loadComponent: () =>
			import('./features/user/user.component').then((m) => m.UserComponent),
	},
	{
		path: 'meus-agendamentos',
		loadComponent: () =>
			import('./features/appointments-my/appointments.component').then((m) => m.AppointmentsComponent),
	},
	{
		path: 'admin',
		loadComponent: () => import('./features/admin/admin').then(m => m.Admin),
		children: [
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/admin/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
			},
			{
				path: 'agendamentos',
				loadComponent: () =>
					import('./features/admin/admin-appointments/admin-appointments').then(
						(m) => m.AdminAppointments,
					),
			},
			{
				path: 'profissionais',
				loadComponent: () => import('./features/admin/admin-profissionais/admin-profissionais').then(m => m.AdminProfissionais),
			},
			{
				path: 'servicos',
				loadComponent: () => import('./features/admin/admin-servicos/admin-servicos').then(m => m.AdminServicos),
			},
			{
				path: 'clientes',
				loadComponent: () =>
					import('./features/admin/admin-clientes/admin-clientes').then((m) => m.AdminClientes),
			},
			{
				path: 'clientes/:id',
				loadComponent: () =>
					import('./features/admin/admin-clientes/admin-cliente-detalhe').then(
						(m) => m.AdminClienteDetalhe,
					),
			},
			{
				path: 'bloqueios',
				loadComponent: () =>
					import('./features/admin/schedule-blocks/schedule-blocks').then((m) => m.ScheduleBlocks),
			},
			{
				path: 'dias-bloqueados',
				redirectTo: 'bloqueios',
				pathMatch: 'full',
			},
			{
				path: 'horarios-bloqueados',
				redirectTo: 'bloqueios',
				pathMatch: 'full',
			},
			{
				path: 'whatsapp',
				loadComponent: () => import('./features/admin/admin-whatsapp/admin-whatsapp').then(m => m.AdminWhatsapp),
			},
			{
				path: 'configuracoes',
				loadComponent: () => import('./features/admin/admin-configuracoes/admin-configuracoes').then(m => m.AdminConfiguracoes),
			},
		],
	},
];

