import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [JwtModule.register(
    {
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' }
    }
  )],
  providers: [AuthService],
  exports: [AuthService]

})
export class AuthModule { }
