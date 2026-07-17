import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { VerificationResultsModule } from './verification-results/verification-results.module';
import { VerificationsModule } from './verifications/verifications.module';

const databaseType = process.env.DB_TYPE ?? 'sqlite';
const isPostgres = databaseType === 'postgres';

const typeOrmOptions = isPostgres
  ? {
      type: 'postgres' as const,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'dem',
      synchronize: true,
      autoLoadEntities: true,
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    }
  : {
      type: 'sqlite' as const,
      database: process.env.DB_NAME ?? 'dem.sqlite',
      synchronize: true,
      autoLoadEntities: true,
    };

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmOptions),
    UsersModule,
    AuthModule,
    VerificationsModule,
    VerificationResultsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
