package database

import (
	"api-passirence/internal/models"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDatabase() {

	dsn := "host=localhost user=postgres password=1234 dbname=passirence port=5432 sslmode=disable"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  logger.Info,
				IgnoreRecordNotFoundError: true,
				Colorful:                  true,
			},
		),
	})

	if err != nil {
		log.Fatal("Erro ao conectar no banco")
	}

	log.Println("Banco conectado com sucesso")

	DB = database

	if err := runMigrations(database); err != nil {
		log.Fatalf("Erro ao executar migrations: %v", err)
	}
}

func runMigrations(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.BarberShopSettings{},
		&models.BusinessHour{},
		&models.Cliente{},
		&models.Profissional{},
		&models.Servico{},
		&models.Appointment{},
		&models.AppointmentService{},
		&models.ScheduleBlock{},
	); err != nil {
		return err
	}

	if err := migrateAppointmentStatuses(db); err != nil {
		return err
	}

	return seedDefaultSettings(db)
}

func seedDefaultSettings(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.BarberShopSettings{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	return db.Create(&models.BarberShopSettings{
		Timezone:        "America/Sao_Paulo",
		SlotInterval:    30,
		ReminderMinutes: 60,
	}).Error
}
