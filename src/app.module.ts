import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VerificationResultsModule } from './verification-results/verification-results.module';
import { VerificationsModule } from './verifications/verifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH ?? 'dem.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    VerificationsModule,
    VerificationResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
